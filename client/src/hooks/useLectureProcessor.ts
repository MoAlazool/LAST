import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useLectures } from "@/hooks/useLectures";
import { useToast } from "@/hooks/use-toast";
import { extractVideoId, getYouTubeVideoInfo, getYouTubeTranscript, transcribeAudioFile, transcribeYouTubeWithWhisper } from "@/lib/youtubeService";
import { generateSummary, generateQuiz, generateSlides, generateFlashcards, generateFormulas as extractMathFormulas, generateConceptMap, generateMedicalInsights, generateEngineeringInsights } from "@/lib/aiService";
import { classifyLecture } from "@/lib/categoryClassifier";

export function useLectureProcessor() {
  const { user } = useAuth();
  const { createLecture, updateLecture, isCreating } = useLectures();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingLectureId, setProcessingLectureId] = useState<string | null>(null);
  const [isProcessingStopped, setIsProcessingStopped] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gpu" | "api">("api");

  const processAudioFile = async (lectureId: string, file: File) => {
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

      await updateLecture({ lectureId, updates: { progress: 45 } });

      const summary = await generateSummary(transcript, selectedModel);
      await updateLecture({ lectureId, updates: { progress: 55, summary } });

      const conceptMap = await generateConceptMap(transcript, selectedModel);
      await updateLecture({ lectureId, updates: { progress: 65, conceptMap } });

      const questions = await generateQuiz(transcript, selectedModel);
      await updateLecture({ lectureId, updates: { progress: 75, questions } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      const isPresentation = !!file.name.match(/\.(pptx?)$/i);
      let slides: any[] = [];
      if (!isPresentation) {
        slides = await generateSlides(transcript, summary, extractedImages);
      }
      await updateLecture({ lectureId, updates: { progress: 90, slides } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      const flashcards = await generateFlashcards(transcript, selectedModel);

      if (isProcessingStopped && processingLectureId === lectureId) return;

      let formulas = await extractMathFormulas(transcript, selectedModel, geminiFileUri, geminiFileMimeType);

      // Medical Insights / Engineering Lab are only generated for their respective categories.
      const medical = category === "medicine"
        ? await generateMedicalInsights(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
        : undefined;
      const engineering = category === "engineering"
        ? await generateEngineeringInsights(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
        : undefined;

      await updateLecture({ lectureId, updates: { progress: 100, flashcards, formulas, medical, engineering, status: "completed", modelType: selectedModel } });

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

  const processLecture = async (lectureId: string, videoId: string, videoInfo: any, startTimeSeconds?: number | null, endTimeSeconds?: number | null) => {
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

      await updateLecture({ lectureId, updates: { progress: 45 } });

      // Step 2: Parallelized AI Processing
      // Phase 1: Run independent generation tasks in parallel.
      // Medical Insights are only generated for medical lectures.
      const [summary, flashcards, formulas, medical, engineering] = await Promise.all([
        generateSummary(transcript, selectedModel),
        generateFlashcards(transcript, selectedModel),
        extractMathFormulas(transcript, selectedModel, geminiFileUri, geminiFileMimeType),
        category === "medicine"
          ? generateMedicalInsights(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
          : Promise.resolve(undefined),
        category === "engineering"
          ? generateEngineeringInsights(transcript, selectedModel, geminiFileUri, geminiFileMimeType)
          : Promise.resolve(undefined)
      ]);

      await updateLecture({
        lectureId,
        updates: {
          progress: 80,
          summary,
          questions: [],
          flashcards,
          formulas,
          medical,
          engineering
        }
      });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      // Phase 2: Run dependent tasks in parallel
      const [slides, conceptMap] = await Promise.all([
        generateSlides(transcript, summary),
        generateConceptMap(transcript, selectedModel, flashcards)
      ]);

      await updateLecture({
        lectureId,
        updates: { 
          progress: 100, 
          slides,
          conceptMap,
          status: "completed", 
          modelType: selectedModel 
        },
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

  const handleAnalyze = async (url: string, startTimeSeconds?: number | null, endTimeSeconds?: number | null) => {
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

      const lectureData = {
        title: videoInfo.title,
        thumbnailUrl: videoInfo.thumbnailUrl,
        duration: videoInfo.duration,
        status: "processing" as const,
        progress: 0,
        modelType: selectedModel,
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

      processLecture(lectureId, videoId, videoInfo, startTimeSeconds, endTimeSeconds);
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

  const handleFileAnalyze = async (file: File) => {
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

      const lectureData = {
        title: file.name,
        thumbnailUrl: uploadThumbnail,
        duration: "0:00",
        status: "processing" as const,
        progress: 0,
        modelType: selectedModel,
        sourceType,
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

      processAudioFile(lectureId, file);
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
    isCreating
  };
}
