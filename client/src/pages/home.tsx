import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Youtube, Sparkles, Upload, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useLectures } from "@/hooks/useLectures";
import { extractVideoId, getYouTubeThumbnail, getYouTubeVideoInfo, getYouTubeTranscript, transcribeAudioFile, transcribeYouTubeWithWhisper } from "@/lib/youtubeService";
import { generateSummary, generateQuiz, generateSlides, generateFlashcards, generateFormulas as extractMathFormulas, generateConceptMap } from "@/lib/aiService";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { classifyLecture } from "@/lib/categoryClassifier";

export default function Home() {
  const { user } = useAuth();
  const { createLecture, updateLecture, isCreating } = useLectures();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const analyzerRef = useRef<HTMLDivElement>(null);

  const scrollToAnalyzer = () => {
    analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processingLectureId, setProcessingLectureId] = useState<string | null>(null);
  const [isProcessingStopped, setIsProcessingStopped] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"gpu" | "api">("api");
  const [enableTimeRange, setEnableTimeRange] = useState(false);
  const [startMinutes, setStartMinutes] = useState("");
  const [startSeconds, setStartSeconds] = useState("");
  const [endMinutes, setEndMinutes] = useState("");
  const [endSeconds, setEndSeconds] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const { language } = useLanguage();

  const t = {
    heroBadge:
      language === "ar"
        ? "جديد: البطاقات التعليمية متاحة الآن"
        : "New: Flashcard Generation Available",
    heroTitleLine1: language === "ar" ? "أتقن أي مادة" : "Master Any Subject",
    heroTitleLine2: language === "ar" ? "في نصف الوقت" : "In Half The Time",
    heroSubtitle:
      language === "ar"
        ? "رفيق الدراسة بالذكاء الاصطناعي: حوّل المحاضرات إلى ملخصات واختبارات وبطاقات تعليمية وشرائح عرض فوراً."
        : "The all-in-one AI study companion. Convert lectures into summaries, quizzes, flashcards, and slides instantly.",
    inputPlaceholder:
      language === "ar"
        ? "ألصق رابط فيديو يوتيوب هنا..."
        : "Paste video URL...",
    analyzeNow: language === "ar" ? "ابدأ التحليل" : "Analyze Now",
    uploadFile: language === "ar" ? "رفع ملف" : "Upload File",
    recordAudio: language === "ar" ? "تسجيل صوت" : "Record Audio",
    selectModel: language === "ar" ? "اختر الموديل" : "Select Model",
    selectTimeRange: language === "ar" ? "اختر جزء محدد من الفيديو" : "Select specific video segment",
    enableTimeRange: language === "ar" ? "تفعيل اختيار الوقت" : "Enable time selection",
    startTime: language === "ar" ? "وقت البداية" : "Start Time",
    endTime: language === "ar" ? "وقت النهاية" : "End Time",
    minutes: language === "ar" ? "دقائق" : "min",
    seconds: language === "ar" ? "ثواني" : "sec",
    modelGpu: language === "ar" ? "LM-Titan (GPU)" : "LM-Titan (GPU)",
    modelApi: language === "ar" ? "LM-Cloud (API)" : "LM-Cloud (API)",
    modelGpuDesc: language === "ar" ? "يعمل على الموديلات المحلية المعتمدة على GPU (Ollama)" : "Runs on local GPU-based models (Ollama)",
    modelApiDesc: language === "ar" ? "يعمل على API السحابي (Gemini)" : "Runs on cloud API (Gemini)",
    modelGpuTooltip: language === "ar"
      ? "يستخدم موديلات محلية تعمل على GPU الخاص بك. أسرع وأكثر خصوصية، لكن يتطلب GPU قوي."
      : "Uses local models running on your GPU. Faster and more private, but requires a powerful GPU.",
    modelApiTooltip: language === "ar"
      ? "يستخدم Google Gemini API السحابي. لا يحتاج GPU، لكن يتطلب اتصال بالإنترنت وAPI key."
      : "Uses Google Gemini cloud API. No GPU needed, but requires internet connection and API key.",
    howItWorksTitle: language === "ar" ? "كيف يعمل؟" : "How It Works",
    howItWorksSubtitle:
      language === "ar"
        ? "ثلاث خطوات بسيطة لتغيير تجربة تعلّمك."
        : "Three simple steps to transform your learning experience.",
    steps:
      language === "ar"
        ? [
          {
            step: "01",
            title: "ألصق الرابط",
            desc: "انسخ أي رابط محاضرة من يوتيوب وألصقه في المحلل.",
          },
          {
            step: "02",
            title: "معالجة بالذكاء الاصطناعي",
            desc: "نستخرج النص وننشئ ملخصاً وأسئلة وشرائح عرض.",
          },
          {
            step: "03",
            title: "ابدأ التعلّم",
            desc: "استعرض الملخص وأجب عن الأسئلة وراجع المادة بسهولة.",
          },
        ]
        : [
          {
            step: "01",
            title: "Paste URL",
            desc: "Copy any YouTube lecture link and paste it into our analyzer.",
          },
          {
            step: "02",
            title: "AI Processing",
            desc: "Our AI extracts transcripts, generates summaries, and creates quizzes.",
          },
          {
            step: "03",
            title: "Start Learning",
            desc: "Review the summary, take the quiz, and master the material.",
          },
        ],
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "audio/mpeg",
        "audio/mp3",
        "audio/wav",
        "audio/webm",
        "audio/ogg",
        "audio/m4a",
        "video/mp4",
        "video/webm",
        "video/ogg",
        "video/quicktime",
        "audio/x-m4a",
        "audio/mp4",
        // Documents
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
        "application/msword", // .doc
        "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
        "application/vnd.ms-powerpoint" // .ppt
      ];

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const allowedExts = ['pdf', 'docx', 'doc', 'pptx', 'ppt'];

      if (!allowedTypes.includes(file.type) && !allowedExts.includes(fileExt || '')) {
        toast({
          title: "Error",
          description: "Invalid file type. Please upload audio, video, PDF, Word, or PowerPoint.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (500MB max)
      if (file.size > 500 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "File size too large. Maximum size is 500MB.",
          variant: "destructive",
        });
        return;
      }

      setUploadedFile(file);
      setUrl(""); // Clear YouTube URL if file is uploaded

      toast({
        title: "File selected",
        description: `Ready to process: ${file.name}`,
      });
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,video/*,.pdf,.doc,.docx,.ppt,.pptx";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFileUpload({ target: { files: [file] } } as any);
      }
    };
    input.click();
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if file is uploaded instead of URL
    if (uploadedFile) {
      await handleFileAnalyze(uploadedFile);
      return;
    }

    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a YouTube URL or upload an audio file",
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
      // Extract video ID
      const videoId = extractVideoId(url);
      if (!videoId) {
        throw new Error("Invalid YouTube URL");
      }

      // Get video info
      const videoInfo = await getYouTubeVideoInfo(videoId);
      if (!videoInfo) {
        throw new Error("Could not fetch video information");
      }

      // Create lecture with processing status
      // Category will be classified by AI when transcript is available
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
      if (!lectureId) {
        throw new Error("Failed to create lecture - no ID returned");
      }

      setProcessingLectureId(lectureId);
      setIsProcessingStopped(false);

      toast({
        title: "Lecture created!",
        description: "Processing your lecture...",
      });

      // Process in background
      processLecture(lectureId, videoId, videoInfo);

      // Redirect to lecture page
      setLocation(`/lecture/${lectureId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze lecture. Please try again.",
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
      // Create lecture with processing status
      // Use a custom thumbnail for uploaded files
      const uploadThumbnail = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225' viewBox='0 0 400 225'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238B5CF6;stop-opacity:1' /%3E%3Cstop offset='100%25' style='stop-color:%237C3AED;stop-opacity:1' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='225' fill='url(%23grad)'/%3E%3Cg transform='translate(200, 112.5)'%3E%3Ccircle cx='0' cy='0' r='40' fill='white' opacity='0.2'/%3E%3Cpath d='M-15,-20 L15,0 L-15,20 Z' fill='white'/%3E%3C/g%3E%3Ctext x='200' y='180' font-family='Arial, sans-serif' font-size='18' fill='white' text-anchor='middle' font-weight='600'%3EAudio File%3C/text%3E%3C/svg%3E";

      // Category will be classified by AI when transcript is available
      const lectureData = {
        title: file.name,
        thumbnailUrl: uploadThumbnail,
        duration: "0:00",
        status: "processing" as const,
        progress: 0,
        modelType: selectedModel,
      };
      const newLecture = await createLecture(lectureData);

      const lectureId = newLecture.id;
      if (!lectureId) {
        throw new Error("Failed to create lecture - no ID returned");
      }

      setProcessingLectureId(lectureId);
      setIsProcessingStopped(false);

      toast({
        title: "File uploaded!",
        description: "Transcribing audio file...",
      });

      // Process in background
      processAudioFile(lectureId, file);

      // Redirect to lecture page
      setLocation(`/lecture/${lectureId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process audio file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processAudioFile = async (lectureId: string, file: File) => {
    try {
      if (!user?.uid) return;

      // Check if processing was stopped
      if (isProcessingStopped && processingLectureId === lectureId) {
        return;
      }

      // Update progress
      await updateLecture({ lectureId, updates: { progress: 20 } });

      // Check again after update
      if (isProcessingStopped && processingLectureId === lectureId) {
        return;
      }

      // Transcribe audio file
      console.log(`[Home] Transcribing audio file: ${file.name}`);

      // Auto-configure based on selected model
      const whisperModel = selectedModel === "gpu" ? "large-v3" : "small";
      const device = selectedModel === "gpu" ? "cuda" : "cpu";

      if (selectedModel === "gpu") {
        console.log(`[Home] Local Processing: Using device ${device} with model ${whisperModel}`);
      } else {
        console.log(`[Home] Cloud Processing: Using Gemini API (LM-Cloud)`);
      }


      // We need to upload the file to Firebase Storage first to get a URL, 
      // but for processing we need a local file path.
      // Since we already have the File object in the browser, we can just send it directly to the API.

      // However, for large files, it might be better to upload to Firebase first 
      // and then have the server download it.
      // For now, let's stick to sending the file directly to the API as it's simpler.

      const transcribeResult = await transcribeAudioFile(file, whisperModel, undefined, device, lectureId);

      const transcript = typeof transcribeResult === 'string' ? transcribeResult : transcribeResult?.transcript;
      const geminiFileUri = typeof transcribeResult === 'string' ? undefined : transcribeResult?.geminiFileUri;
      const geminiFileMimeType = typeof transcribeResult === 'string' ? undefined : transcribeResult?.geminiFileMimeType;
      const extractedImages = typeof transcribeResult === 'string' ? undefined : transcribeResult?.extractedImages;
      const transcriptChunks = typeof transcribeResult === 'string' ? undefined : transcribeResult?.transcriptChunks;
      const sourceUrl = typeof transcribeResult === 'string' ? undefined : transcribeResult?.sourceUrl;
      const documentPageCount = typeof transcribeResult === 'string' ? undefined : transcribeResult?.documentPageCount;

      console.log(`[Home] Transcript received:`, {
        length: transcript?.length || 0,
        preview: transcript?.substring(0, 100) || "empty",
        hasGeminiVision: !!geminiFileUri,
        hasImages: !!extractedImages && extractedImages.length > 0,
        hasChunks: !!transcriptChunks,
        chunksCount: transcriptChunks?.length || 0
      });

      if (!transcript || transcript.length === 0) {
        throw new Error("Could not transcribe audio file or transcript is empty");
      }

      if (isProcessingStopped && processingLectureId === lectureId) {
        return;
      }

      console.log(`[Home] Saving transcript to Firestore for lecture: ${lectureId}`);
      // Classify category using AI with transcript for better accuracy
      const category = await classifyLecture({ title: file.name, transcript }, selectedModel);
      await updateLecture({ lectureId, updates: { progress: 40, transcript, category, modelType: selectedModel, geminiFileUri, geminiFileMimeType, extractedImages, transcriptChunks, sourceUrl, documentPageCount } });
      console.log(`[Home] Transcript saved successfully with category: ${category}, modelType: ${selectedModel}`);

      console.log(`[Home] Starting sequential AI generation (Summary -> Quiz -> Slides -> Flashcards)...`);
      await updateLecture({ lectureId, updates: { progress: 45 } });

      // 1. Generate Summary
      console.log(`[Home] Generating summary...`);
      const summary = await generateSummary(transcript, selectedModel);
      console.log(`[Home] Summary generated.`);
      await updateLecture({ lectureId, updates: { progress: 55, summary } });

      // 1.5 Generate Mind Map
      console.log(`[Home] Generating mind map...`);
      const conceptMap = await generateConceptMap(transcript, selectedModel);
      console.log(`[Home] Concept Map generated.`);
      await updateLecture({ lectureId, updates: { progress: 65, conceptMap } });

      // 2. Generate Quiz
      console.log(`[Home] Generating quiz...`);
      const questions = await generateQuiz(transcript, selectedModel);
      console.log(`[Home] Quiz generated.`);
      await updateLecture({ lectureId, updates: { progress: 75, questions } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      // 3. Generate Slides
      const isPresentation = !!file.name.match(/\.(pptx?)$/i);
      let slides: any[] = [];
      if (!isPresentation) {
        console.log(`[Home] Generating slides...`);
        slides = await generateSlides(transcript, summary);
        console.log(`[Home] Slides generated.`);
      } else {
        console.log(`[Home] Skipped slides generation for presentation file.`);
      }
      await updateLecture({ lectureId, updates: { progress: 90, slides } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      // 4. Generate Flashcards
      console.log(`[Home] Generating flashcards...`);
      const flashcards = await generateFlashcards(transcript, selectedModel);
      console.log(`[Home] Flashcards generated.`);

      if (isProcessingStopped && processingLectureId === lectureId) return;

      // 5. Extract Formulas
      console.log(`[Home] Extracting math formulas...`);
      let formulas = await extractMathFormulas(transcript, selectedModel, geminiFileUri, geminiFileMimeType);
      console.log(`[Home] Math formulas extracted: ${formulas?.length || 0}`);

      await updateLecture({ lectureId, updates: { progress: 100, flashcards, formulas, status: "completed", modelType: selectedModel } });

      setProcessingLectureId(null);
      setIsProcessingStopped(false);
      setUploadedFile(null);

      toast({
        title: "Processing complete!",
        description: "Your audio file has been analyzed successfully.",
      });
    } catch (error: any) {
      if (!isProcessingStopped || processingLectureId !== lectureId) {
        console.error("[Home] Error processing audio file:", error);
        await updateLecture({
          lectureId,
          updates: { status: "failed", progress: 0 },
        });
        toast({
          title: "Error",
          description: error.message || "Failed to process audio file",
          variant: "destructive",
        });
      }
      setProcessingLectureId(null);
      setIsProcessingStopped(false);
      setUploadedFile(null);
    }
  };

  const processLecture = async (lectureId: string, videoId: string, videoInfo: any) => {
    try {
      if (!user?.uid) return;

      // Check if processing was stopped
      if (isProcessingStopped && processingLectureId === lectureId) {
        return;
      }

      // Update progress
      await updateLecture({ lectureId, updates: { progress: 20 } });

      // Check again after update
      if (isProcessingStopped && processingLectureId === lectureId) {
        return;
      }

      // Get transcript
      console.log(`[Home] Fetching transcript for video: ${videoId}`);

      // Calculate time range in seconds if enabled
      let startTimeSeconds: number | null = null;
      let endTimeSeconds: number | null = null;

      if (enableTimeRange) {
        // Parse time values - treat empty strings as 0
        const startMin = startMinutes.trim() === "" ? 0 : (parseInt(startMinutes) || 0);
        const startSec = startSeconds.trim() === "" ? 0 : (parseInt(startSeconds) || 0);
        const endMin = endMinutes.trim() === "" ? 0 : (parseInt(endMinutes) || 0);
        const endSec = endSeconds.trim() === "" ? 0 : (parseInt(endSeconds) || 0);

        startTimeSeconds = startMin * 60 + startSec;
        endTimeSeconds = endMin * 60 + endSec;

        // Validate time range - end must be greater than start
        // If both are 0 or end <= start, disable time filtering
        if (endTimeSeconds > startTimeSeconds && endTimeSeconds > 0) {
          console.log(`[Home] Using time range: ${startTimeSeconds}s - ${endTimeSeconds}s`);
        } else {
          // Invalid or empty range, disable it and use full transcript
          console.log(`[Home] Time range invalid or empty (start: ${startTimeSeconds}s, end: ${endTimeSeconds}s), using full transcript`);
          startTimeSeconds = null;
          endTimeSeconds = null;
        }
      }

      // Auto-configure based on selected model
      // For GPU model: use Whisper with GPU (cuda) and large-v3, fallback to CPU automatically if GPU not available
      // For API model: use YouTube transcript API
      let transcript: string | null = null;
      let geminiFileUri: string | undefined;
      let geminiFileMimeType: string | undefined;

      if (selectedModel === "gpu") {
        // LM-Titan: Use Whisper with GPU and large-v3
        const whisperModel = "large-v3"; // Always use best model
        const device = "cuda"; // Try GPU first, will fallback to CPU automatically if not available
        console.log(`[Home] Using Whisper to transcribe YouTube video: ${videoId} with GPU and ${whisperModel}`);
        const transcribeResult = await transcribeYouTubeWithWhisper(
          videoId,
          whisperModel,
          undefined, // auto-detect language (will be set to 'ar' if Arabic detected)
          device,
          startTimeSeconds,
          endTimeSeconds,
          user?.uid, // Pass user ID for Firebase Storage
          videoInfo?.title, // Pass video title for language detection
          videoInfo?.channelName, // Pass channel name for language detection
          lectureId // Pass lecture ID for process tracking
        );

        transcript = typeof transcribeResult === 'string' ? transcribeResult : transcribeResult?.transcript || null;
        geminiFileUri = typeof transcribeResult === 'string' ? undefined : transcribeResult?.geminiFileUri;
        geminiFileMimeType = typeof transcribeResult === 'string' ? undefined : transcribeResult?.geminiFileMimeType;
      } else {
        // LM-Cloud: Use YouTube transcript API
        console.log(`[Home] Calling getYouTubeTranscript for video: ${videoId}...`);
        const transcriptResult = await getYouTubeTranscript(videoId, startTimeSeconds, endTimeSeconds);
        transcript = transcriptResult.transcript;
        const transcriptChunks = transcriptResult.transcriptChunks;
        console.log(`[Home] getYouTubeTranscript completed with ${transcriptChunks?.length || 0} chunks.`);
      }

      console.log(`[Home] Transcript received:`, {
        length: transcript?.length || 0,
        preview: transcript?.substring(0, 100) || "empty",
        method: selectedModel === "gpu" ? "Whisper" : "Transcript API",
        hasGeminiVision: !!geminiFileUri,
        hasChunks: !!transcriptChunks,
        chunksCount: transcriptChunks?.length || 0
      });

      if (!transcript || transcript.length === 0) {
        throw new Error("Could not extract transcript or transcript is empty");
      }

      if (isProcessingStopped && processingLectureId === lectureId) {
        return;
      }

      console.log(`[Home] Saving transcript to Firestore for lecture: ${lectureId}`);
      // Classify category using AI with transcript for better accuracy
      console.log(`[Home] Classifying lecture...`);
      const category = await classifyLecture({ title: videoInfo?.title || "Untitled Lecture", transcript }, selectedModel);
      console.log(`[Home] Classification done: ${category}. Updating lecture in DB...`);
      await updateLecture({ lectureId, updates: { progress: 40, transcript, category, modelType: selectedModel, geminiFileUri, geminiFileMimeType, transcriptChunks } });
      console.log(`[Home] Transcript, chunks and category saved successfully.`);

      console.log(`[Home] Starting parallel AI generation (Summary, Quiz, Flashcards)...`);
      await updateLecture({ lectureId, updates: { progress: 45 } });

      // Start sequential tasks
      console.log(`[Home] Generating summary...`);
      const summary = await generateSummary(transcript, selectedModel);
      console.log(`[Home] Summary generated.`);
      await updateLecture({ lectureId, updates: { progress: 55, summary } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      console.log(`[Home] Generating quiz...`);
      const questions = await generateQuiz(transcript, selectedModel);
      console.log(`[Home] Quiz generated.`);
      await updateLecture({ lectureId, updates: { progress: 65, questions } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      console.log(`[Home] Generating slides...`);
      const slides = await generateSlides(transcript, summary);
      console.log(`[Home] Slides generated.`);
      await updateLecture({ lectureId, updates: { progress: 75, slides } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      console.log(`[Home] Generating flashcards...`);
      const flashcards = await generateFlashcards(transcript, selectedModel);
      console.log(`[Home] Flashcards generated.`);
      await updateLecture({ lectureId, updates: { progress: 85, flashcards } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      console.log(`[Home] Generating Concept Map...`);
      const conceptMap = await generateConceptMap(transcript, selectedModel, flashcards);
      console.log(`[Home] Concept Map generated.`);
      await updateLecture({ lectureId, updates: { progress: 95, conceptMap } });

      if (isProcessingStopped && processingLectureId === lectureId) return;

      console.log(`[Home] Extracting math formulas...`);
      const formulas = await extractMathFormulas(transcript, selectedModel, geminiFileUri, geminiFileMimeType);
      console.log(`[Home] Math formulas extracted: ${formulas?.length || 0}`);

      await updateLecture({
        lectureId,
        updates: { progress: 100, flashcards, formulas, status: "completed", modelType: selectedModel },
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

  return (
    <AppLayout>
      <main className="relative pt-6 pb-16 lg:pt-14 lg:pb-24 overflow-hidden bg-[#f4f6f9]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-8%] right-[-5%] w-[45%] max-w-xl h-[320px] bg-[#F05A22]/15 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] left-[-8%] w-[40%] max-w-lg h-[280px] bg-blue-500/10 rounded-full blur-[90px]" />
        </div>

        <div className={"mx-auto px-4 sm:px-6 lg:px-8 " + (language === "ar" ? "rtl" : "ltr")}>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div
              className={
                "text-center " + (language === "ar" ? "lg:text-right" : "lg:text-left")
              }
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F05A22]/10 text-[#F05A22] text-[10px] font-bold uppercase tracking-wider mb-6 border border-[#F05A22]/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F05A22] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F05A22]" />
                </span>
                {t.heroBadge}
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black leading-[1.08] mb-6 tracking-tight text-slate-900">
                <span className="block text-slate-800">{t.heroTitleLine1}</span>
                <span className="block text-[#F05A22] mt-1">{t.heroTitleLine2}</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {t.heroSubtitle}
              </p>

              <div
                className={
                  "flex flex-wrap justify-center gap-3 " +
                  (language === "ar" ? "lg:justify-end" : "lg:justify-start")
                }
              >
                <button
                  type="button"
                  onClick={scrollToAnalyzer}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition-colors"
                >
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold">4.9/5 Rating</span>
                </button>
                <button
                  type="button"
                  onClick={scrollToAnalyzer}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 transition-colors"
                >
                  <span className="text-emerald-400 text-lg font-bold leading-none">✓</span>
                  <span className="text-sm font-semibold">Start for free</span>
                </button>
              </div>
            </div>

            <div className="relative" ref={analyzerRef} id="lecture-analyzer">
              <div className="rounded-[1.75rem] border border-slate-700/60 bg-gradient-to-b from-[#141c2f] to-[#0c101c] shadow-[0_24px_60px_rgba(15,23,42,0.45)] p-6 sm:p-8 relative z-10 ring-1 ring-white/5 scroll-mt-24">
                <form onSubmit={handleAnalyze} className="space-y-5">
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedModel("api")}
                      className={
                        "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap " +
                        (selectedModel === "api"
                          ? "bg-[#F05A22] text-white shadow-lg shadow-[#F05A22]/30"
                          : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-600/50")
                      }
                    >
                      {t.modelApi}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModel("gpu")}
                      className={
                        "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap " +
                        (selectedModel === "gpu"
                          ? "bg-[#F05A22] text-white shadow-lg shadow-[#F05A22]/30"
                          : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-600/50")
                      }
                    >
                      {t.modelGpu}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleUploadClick}
                    className="group w-full cursor-pointer relative border-2 border-dashed border-slate-500/70 rounded-2xl p-8 sm:p-10 text-center transition-all hover:border-[#F05A22]/60 hover:bg-slate-800/40 bg-slate-800/30"
                  >
                    <div className="w-14 h-14 bg-[#F05A22]/15 text-[#F05A22] rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:scale-105 transition-transform ring-1 ring-orange-500/20">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1.5">
                      {t.uploadFile}
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Supports PDF, PPT, and MP3 (Max 50MB)
                    </p>

                    {uploadedFile && (
                      <div className="mt-4 p-3 bg-emerald-500/15 text-emerald-300 rounded-xl text-sm font-semibold truncate border border-emerald-500/25">
                        ✓ {uploadedFile.name}
                      </div>
                    )}
                  </button>

                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-600/60" />
                    </div>
                    <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-[0.2em]">
                      <span className="bg-[#0f141f] px-3 text-slate-500">
                        OR PASTE LINK
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <div
                        className={
                          "absolute inset-y-0 flex items-center pointer-events-none text-red-500 " +
                          (language === "ar" ? "right-0 pr-3.5" : "left-0 pl-3.5")
                        }
                      >
                        <Youtube className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        className={
                          "block w-full py-3.5 bg-slate-800/80 border border-slate-600/60 rounded-xl text-sm text-white focus:ring-2 focus:ring-orange-500/40 focus:border-[#F05A22]/50 transition-all outline-none placeholder:text-slate-500 " +
                          (language === "ar"
                            ? "pr-11 pl-4 text-right"
                            : "pl-11 pr-4 text-left")
                        }
                        placeholder={t.inputPlaceholder}
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (e.target.value) setUploadedFile(null);
                        }}
                        disabled={!!uploadedFile}
                      />
                    </div>

                    {/* Time Range Selector */}
                    {url && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className={`flex items-center gap-3 mb-4 ${language === "ar" ? "flex-row-reverse" : ""}`}>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={enableTimeRange}
                              onChange={(e) => setEnableTimeRange(e.target.checked)} 
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F05A22]"></div>
                            <span className={`text-xs font-bold text-slate-400 ${language === "ar" ? "mr-3" : "ml-3"}`}>{t.enableTimeRange}</span>
                          </label>
                        </div>

                        {enableTimeRange && (
                          <div className="grid grid-cols-2 gap-4 animate-in zoom-in-95 duration-200">
                            {/* Start Time */}
                            <div className="space-y-2">
                              <label className={`text-[10px] font-black tracking-widest text-[#F05A22] uppercase block ${language === "ar" ? "text-right" : "text-left"}`}>
                                {t.startTime}
                              </label>
                              <div className="flex gap-2">
                                <input 
                                  type="number" 
                                  placeholder={t.minutes}
                                  value={startMinutes}
                                  onChange={(e) => setStartMinutes(e.target.value)}
                                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-[#F05A22]/50" 
                                />
                                <input 
                                  type="number" 
                                  placeholder={t.seconds}
                                  value={startSeconds}
                                  onChange={(e) => setStartSeconds(e.target.value)}
                                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-[#F05A22]/50" 
                                />
                              </div>
                            </div>

                            {/* End Time */}
                            <div className="space-y-2">
                              <label className={`text-[10px] font-black tracking-widest text-[#F05A22] uppercase block ${language === "ar" ? "text-right" : "text-left"}`}>
                                {t.endTime}
                              </label>
                              <div className="flex gap-2">
                                <input 
                                  type="number" 
                                  placeholder={t.minutes}
                                  value={endMinutes}
                                  onChange={(e) => setEndMinutes(e.target.value)}
                                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-[#F05A22]/50" 
                                />
                                <input 
                                  type="number" 
                                  placeholder={t.seconds}
                                  value={endSeconds}
                                  onChange={(e) => setEndSeconds(e.target.value)}
                                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white outline-none focus:border-[#F05A22]/50" 
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAnalyzing || isCreating}
                      className="w-full py-4 bg-gradient-to-r from-[#F05A22] to-[#F05A22] text-white font-bold rounded-xl shadow-lg shadow-orange-900/40 hover:brightness-105 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100"
                    >
                      {isAnalyzing || isCreating ? (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 animate-spin" />
                          {language === "ar" ? "جاري التحليل..." : "Processing..."}
                        </div>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          {t.analyzeNow}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              <div className="absolute -top-4 -right-4 w-28 h-28 bg-[#F05A22]/25 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-6 w-36 h-36 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            </div>
          </div>
        </div>
      </main>

      <section className="py-12 sm:py-14 bg-[#0b1220] border-t border-slate-800/80 shadow-inner">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 text-center">
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-black text-[#f07828]">
                10k+
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Active Students
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-black text-sky-400">
                1M+
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Notes Generated
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-black text-[#f07828]">
                95%
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Accuracy Rate
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-black text-sky-400">
                200+
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Universities
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}
