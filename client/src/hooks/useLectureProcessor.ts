import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLectures } from "@/hooks/useLectures";
import { useToast } from "@/hooks/use-toast";
import { extractVideoId, getYouTubeVideoInfo, getYouTubeTranscript, transcribeAudioFile, transcribeYouTubeWithWhisper } from "@/lib/youtubeService";
import { generateSummary, generateQuiz, generateSlides, generateFlashcards, generateFormulas as extractMathFormulas, generateConceptMap, generateMedicalInsights, generateEngineeringInsights } from "@/lib/aiService";
import { classifyLecture } from "@/lib/categoryClassifier";
import { ALL_ANALYSIS_FEATURES, type AnalysisFeature } from "@/lib/analysisFeatures";
import { consumeAnalysisAttempt, UsageLimitError, useUsage, type UsageStatus } from "@/hooks/useUsage";

export function useLectureProcessor() {
  const { user } = useAuth();
  const { createLecture, updateLecture, isCreating } = useLectures();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingLectureId, setProcessingLectureId] = useState<string | null>(null);
  const [isProcessingStopped, setIsProcessingStopped] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gpu" | "api">("api");
  const { usage, setUsage } = useUsage();
  // Set when the free plan's daily quota is used up → the dashboard shows the upgrade dialog.
  const [limitReached, setLimitReached] = useState<UsageStatus | null>(null);

  /** Counts one analysis against the free plan. Returns false (and opens the upgrade dialog) when none are left. */
  const claimAttempt = async (): Promise<boolean> => {
    try {
      const status = await consumeAnalysisAttempt();
      setUsage(status);
      return true;
    } catch (e) {
      if (e instanceof UsageLimitError) {
        setUsage(e.status);
        setLimitReached(e.status);
        return false;
      }
      throw e;
    }
  };

  /**
   * Runs ONLY the AI features the user picked in the analysis dialog. Each feature is a
   * separate model call, so anything not selected costs zero tokens. Independent tasks
   * run concurrently and each result is saved the moment it's ready, so the lecture
   * page reveals modules progressively.
   */
  const runSelectedFeatures = async (opts: {
    lectureId: string;
    transcript: string;
    category: string;
    features: AnalysisFeature[];
    title: string;
    geminiFileUri?: string;
    geminiFileMimeType?: string;
    extractedImages?: any[];
    skipSlides?: boolean;
  }) => {
    const { lectureId, transcript, category, features, geminiFileUri, geminiFileMimeType, extractedImages } = opts;
    const want = (f: AnalysisFeature) => features.includes(f);
    const stopped = () => isProcessingStopped && processingLectureId === lectureId;

    const wantSlides = want("slides") && !opts.skipSlides;
    const wantMedical = want("insights") && category === "medicine";
    const wantEngineering = want("insights") && category === "engineering";
    const totalSteps = [want("summary"), want("flashcards"), want("conceptMap"), wantSlides, want("formulas"), want("quiz"), wantMedical, wantEngineering]
      .filter(Boolean).length;

    // Progress runs 45 → 95 spread evenly over the selected steps.
    let done = 0;
    const savePart = async (fields: Record<string, any>) => {
      if (stopped()) return;
      done++;
      const progress = totalSteps ? Math.round(45 + (50 * done) / totalSteps) : 95;
      try {
        await updateLecture({ lectureId, updates: { progress, ...fields } });
      } catch (e) {
        console.warn("[runSelectedFeatures] partial save failed:", e);
      }
    };

    await updateLecture({ lectureId, updates: { progress: 45, questions: [] } });

    // Slides are built from the summary: if slides were picked without the summary we
    // still generate it as slide input, but don't save it (it wasn't requested).
    const summaryRaw = want("summary") || wantSlides ? generateSummary(transcript, selectedModel) : null;
    const flashcardsRaw = want("flashcards") ? generateFlashcards(transcript, selectedModel) : null;

    const tasks: Promise<unknown>[] = [];
    if (summaryRaw && want("summary")) tasks.push(summaryRaw.then((summary) => savePart({ summary })));
    if (flashcardsRaw) tasks.push(flashcardsRaw.then((flashcards) => savePart({ flashcards })));
    if (want("formulas")) {
      tasks.push(extractMathFormulas(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
        .then((formulas) => savePart({ formulas })));
    }
    if (want("quiz")) {
      tasks.push(generateQuiz(transcript, selectedModel).then((questions) => savePart({ questions })));
    }
    if (wantMedical) {
      tasks.push(generateMedicalInsights(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
        .then((medical) => savePart({ medical })));
    }
    if (wantEngineering) {
      tasks.push(generateEngineeringInsights(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
        .then((engineering) => savePart({ engineering })));
    }
    if (wantSlides && summaryRaw) {
      tasks.push(summaryRaw
        .then((summary) => generateSlides(transcript, summary, extractedImages))
        .then((slides) => savePart({ slides })));
    }
    if (want("conceptMap")) {
      // Flashcards enrich the concept map when they were requested; otherwise build it from the transcript alone.
      const cards = flashcardsRaw ? flashcardsRaw.catch(() => undefined) : Promise.resolve(undefined);
      tasks.push(cards
        .then((flashcards) => generateConceptMap(transcript, selectedModel, flashcards as any))
        .then((conceptMap) => savePart({ conceptMap })));
    }

    // One failed/slow task never aborts the others; whatever succeeded is already saved.
    const results = await Promise.allSettled(tasks);
    results.forEach((r) => { if (r.status === "rejected") console.warn("[runSelectedFeatures] task failed:", r.reason); });
  };

  const processAudioFile = async (lectureId: string, file: File, features: AnalysisFeature[]) => {
    try {
      if (!user?.uid) return;

      if (isProcessingStopped && processingLectureId === lectureId) return;

      await updateLecture({ lectureId, updates: { progress: 20 } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      const whisperModel = selectedModel === "gpu" ? "large-v3" : "small";
      const device = selectedModel === "gpu" ? "cuda" : "cpu";

      const transcribeResult = await transcribeAudioFile(file, whisperModel, undefined, device, lectureId, selectedModel);

      const transcript = typeof transcribeResult === 'string' ? transcribeResult : transcribeResult?.transcript;
      const geminiFileUri = typeof transcribeResult === 'string' ? undefined : transcribeResult?.geminiFileUri;
      const geminiFileMimeType = typeof transcribeResult === 'string' ? undefined : transcribeResult?.geminiFileMimeType;
      const extractedImages = typeof transcribeResult === 'string' ? undefined : transcribeResult?.extractedImages;
      const transcriptChunks = typeof transcribeResult === 'string' ? undefined : transcribeResult?.transcriptChunks;
      const sourceUrl = typeof transcribeResult === 'string' ? undefined : transcribeResult?.sourceUrl;
      const documentPageCount = typeof transcribeResult === 'string' ? undefined : transcribeResult?.documentPageCount;

      if (!transcript || transcript.length === 0) {
        throw new Error("Could not transcribe audio file or transcript is empty");
      }

      if (isProcessingStopped && processingLectureId === lectureId) return;

      const category = await classifyLecture({ title: file.name, transcript }, selectedModel);
      await updateLecture({ lectureId, updates: { progress: 40, transcript, category, modelType: selectedModel, geminiFileUri, geminiFileMimeType, extractedImages, transcriptChunks, sourceUrl, documentPageCount } });

      const isPresentation = !!file.name.match(/\.(pptx?)$/i);
      await runSelectedFeatures({
        lectureId, transcript, category, features,
        geminiFileUri, geminiFileMimeType, extractedImages,
        title: file.name,
        // A PPTX upload already IS a slide deck — don't regenerate one.
        skipSlides: isPresentation,
      });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      await updateLecture({ lectureId, updates: { progress: 100, status: "completed", modelType: selectedModel } });

      setProcessingLectureId(null);
      setIsProcessingStopped(false);

      toast({
        title: "Processing complete!",
        description: "Your file has been analyzed successfully.",
      });
    } catch (error: any) {
      if (!isProcessingStopped || processingLectureId !== lectureId) {
        await updateLecture({ lectureId, updates: { status: "failed", progress: 0 } });
        toast({
          title: "Error",
          description: error.message || "Failed to process file",
          variant: "destructive",
        });
      }
      setProcessingLectureId(null);
      setIsProcessingStopped(false);
    }
  };

  const processLecture = async (lectureId: string, videoId: string, videoInfo: any, features: AnalysisFeature[], startTimeSeconds?: number | null, endTimeSeconds?: number | null) => {
    try {
      if (!user?.uid) return;

      if (isProcessingStopped && processingLectureId === lectureId) return;

      await updateLecture({ lectureId, updates: { progress: 20 } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      let sourceUrl: string | undefined;
      let transcript: string | null = null;
      let geminiFileUri: string | undefined;
      let geminiFileMimeType: string | undefined;
      let transcriptChunks: any[] | undefined;

      if (selectedModel === "gpu") {
        const whisperModel = "large-v3";
        const device = "cuda";
        const transcribeResult = await transcribeYouTubeWithWhisper(
          videoId,
          whisperModel,
          undefined,
          device,
          startTimeSeconds || null,
          endTimeSeconds || null,
          user?.uid,
          videoInfo?.title,
          videoInfo?.channelName,
          lectureId,
          selectedModel
        );

        if (!transcribeResult) {
          throw new Error("Failed to transcribe video - no result returned");
        }

        transcript = transcribeResult.transcript || null;
        geminiFileUri = transcribeResult.geminiFileUri;
        geminiFileMimeType = transcribeResult.geminiFileMimeType;
        sourceUrl = transcribeResult.sourceUrl;
        transcriptChunks = transcribeResult.transcriptChunks;
      } else {
        const transcriptResult = await getYouTubeTranscript(videoId, startTimeSeconds || null, endTimeSeconds || null);
        transcript = transcriptResult.transcript;
        transcriptChunks = transcriptResult.transcriptChunks;
        sourceUrl = `https://www.youtube.com/watch?v=${videoId}`;
      }

      if (!transcript || transcript.length === 0) {
        throw new Error("Could not extract transcript or transcript is empty");
      }

      if (isProcessingStopped && processingLectureId === lectureId) return;

      const category = await classifyLecture({ title: videoInfo?.title || "Untitled Lecture", transcript }, selectedModel);
      await updateLecture({ lectureId, updates: { progress: 40, transcript, category, modelType: selectedModel, geminiFileUri, geminiFileMimeType, sourceUrl, transcriptChunks } });

      const stopped = () => isProcessingStopped && processingLectureId === lectureId;
      await runSelectedFeatures({
        lectureId, transcript, category, features,
        geminiFileUri, geminiFileMimeType,
        title: videoInfo?.title || "Untitled Lecture",
      });

      if (stopped()) return;

      await updateLecture({
        lectureId,
        updates: { progress: 100, status: "completed", modelType: selectedModel },
      });

      setProcessingLectureId(null);
      setIsProcessingStopped(false);

      toast({
        title: "Processing complete!",
        description: "Your lecture has been analyzed successfully.",
      });
    } catch (error: any) {
      if (!isProcessingStopped || processingLectureId !== lectureId) {
        await updateLecture({ lectureId, updates: { status: "failed" } });
        toast({
          title: "Processing failed",
          description: error.message || "Failed to process lecture.",
          variant: "destructive",
        });
      }
      setProcessingLectureId(null);
      setIsProcessingStopped(false);
    }
  };

  const handleAnalyze = async (url: string, startTimeSeconds?: number | null, endTimeSeconds?: number | null, features: AnalysisFeature[] = ALL_ANALYSIS_FEATURES) => {
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to analyze lectures.",
        variant: "destructive",
      });
      setLocation("/sign-in");
      return;
    }

    setIsAnalyzing(true);

    try {
      const videoId = extractVideoId(url);
      if (!videoId) throw new Error("Invalid YouTube URL");

      const videoInfo = await getYouTubeVideoInfo(videoId);
      if (!videoInfo) throw new Error("Could not fetch video information");

      // Only count the attempt once the link is known to be valid.
      if (!(await claimAttempt())) return;

      const lectureData = {
        title: videoInfo.title,
        thumbnailUrl: videoInfo.thumbnailUrl,
        duration: videoInfo.duration,
        status: "processing" as const,
        progress: 0,
        modelType: selectedModel,
        requestedFeatures: features,
      };
      
      const newLecture = await createLecture(lectureData);
      const lectureId = newLecture.id;
      
      if (!lectureId) throw new Error("Failed to create lecture");

      setProcessingLectureId(lectureId);
      setIsProcessingStopped(false);

      toast({
        title: "Lecture created!",
        description: "Processing your lecture...",
      });

      processLecture(lectureId, videoId, videoInfo, features, startTimeSeconds, endTimeSeconds);
      setLocation(`/lecture/${lectureId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze lecture.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileAnalyze = async (file: File, features: AnalysisFeature[] = ALL_ANALYSIS_FEATURES) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to analyze lectures.",
        variant: "destructive",
      });
      setLocation("/sign-in");
      return;
    }

    setIsAnalyzing(true);

    try {
      const uploadThumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238B5CF6;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%237C3AED;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='225' fill='url(%23grad)'/%3E%3Cg transform='translate(200, 112.5)'%3E%3Ccircle cx='0' cy='0' r='40' fill='white' opacity='0.2'/%3E%3Cpath d='M-15,-20 L15,0 L-15,20 Z' fill='white'/%3E%3C/g%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='18' fill='white' text-anchor='middle' font-weight='600'%3EAudio File%3C/text%3E%3C/svg%3E";

      // Detect source type based on file extension
      const isPPTX = file.name.match(/\.pptx?$/i);
      const isPDF = file.name.match(/\.pdf$/i);
      const isDOCX = file.name.match(/\.docx?$/i);
      const sourceType: "pptx" | "pdf" | "docx" | "audio" = isPPTX ? "pptx" : isPDF ? "pdf" : isDOCX ? "docx" : "audio";

      if (!(await claimAttempt())) return;

      const lectureData = {
        title: file.name,
        thumbnailUrl: uploadThumbnail,
        duration: "0:00",
        status: "processing" as const,
        progress: 0,
        modelType: selectedModel,
        sourceType,
        requestedFeatures: features,
      };
      
      const newLecture = await createLecture(lectureData);
      const lectureId = newLecture.id;
      
      if (!lectureId) throw new Error("Failed to create lecture");

      setProcessingLectureId(lectureId);
      setIsProcessingStopped(false);

      toast({
        title: "File uploaded!",
        description: "Transcribing file...",
      });

      processAudioFile(lectureId, file, features);
      setLocation(`/lecture/${lectureId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process file.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    handleAnalyze,
    handleFileAnalyze,
    isAnalyzing,
    selectedModel,
    setSelectedModel,
    isCreating,
    usage,
    limitReached,
    dismissLimit: () => setLimitReached(null),
  };
}
