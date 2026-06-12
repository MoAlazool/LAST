// AI service for generating summaries, quizzes, and slides
// This is a simplified version - in production, integrate with OpenAI, Anthropic, or similar

import type { MedicalInsights, EngineeringInsights } from "./mockData";

export interface AISummary {
  points: string[];
}

export interface AIQuestion {
  id: number;
  text: string;
  options: string[] | null;
  correct_answer: string | null;
  correctIndex?: number;
  type: "multiple_choice" | "true_false" | "open_ended";
  is_numerical?: boolean;
  expected_keywords?: string[] | null;
  numerical_answer?: string | number | null;
  explanation?: string | null;
  hint?: string | null;
  reference?: {
    source_type: "uploaded_content" | "related_topic";
    location: string;
    concept: string;
  } | null;
}

export interface AISlide {
  id: number;
  title: string;
  content: string[];
  type?: "intro" | "section" | "content" | "quote" | "stats" | "comparison" | "summary";
  subtitle?: string;
  quote?: string;
  left_label?: string;
  right_label?: string;
  left_points?: string[];
  right_points?: string[];
  stats?: Array<{ value: string; label: string }>;
  speaker_notes?: string;
  direction?: "ltr" | "rtl";
  language?: "en" | "ar";
}

// Generate summary from transcript using AI (returns long-form abstractive summary)
export async function generateSummary(transcript: string, mode?: "gpu" | "api"): Promise<string> {
  try {
    console.log(`[aiService] Generating AI abstractive summary (mode: ${mode || "api"})...`);

    // Call backend API for AI summary generation
    const response = await fetch("/api/ai/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, mode }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate summary");
    }

    // Support both string (new format) and array (old format) for backward compatibility
    if (typeof data.summary === "string") {
      console.log(`[aiService] AI abstractive summary generated (${data.summary.length} characters)`);
      return data.summary;
    } else if (Array.isArray(data.summary)) {
      // Legacy format: convert array to paragraph text
      const summaryText = data.summary.join(" ");
      console.log(`[aiService] AI summary converted from array format (${summaryText.length} characters)`);
      return summaryText;
    } else {
      throw new Error("Invalid summary format received");
    }
  } catch (error: any) {
    console.error("[aiService] Error generating summary:", error);

    // Fallback to simple summary if API fails
    if (!transcript || transcript.length < 100) {
      return "Transcript is too short to generate a summary.";
    }

    const sentences = transcript
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 30);

    // Group into paragraphs
    const sentencesPerParagraph = 3;
    const paragraphs: string[] = [];
    for (let i = 0; i < Math.min(9, sentences.length); i += sentencesPerParagraph) {
      const paragraphSentences = sentences.slice(i, i + sentencesPerParagraph);
      paragraphs.push(paragraphSentences.join(". ") + ".");
    }

    return paragraphs.join("\n\n");
  }
}

// Generate quiz questions from transcript using AI
export async function generateQuiz(transcript: string, mode: "gpu" | "api" = "api", quizMode: "comprehensive" | "advanced" | "expert" = "comprehensive", title?: string): Promise<AIQuestion[]> {
  try {
    console.log(`[aiService] Generating AI quiz questions (mode: ${mode}, quizMode: ${quizMode})...`);

    if (!transcript || transcript.length < 200) {
      console.warn("[aiService] Transcript too short for quiz generation");
      return [];
    }

    // Call backend API for AI quiz generation
    const response = await fetch("/api/ai/quiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, mode, quizLevel: quizMode, title }), 
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate quiz questions");
    }

    const mapQuestions = (questionsData: any[]): AIQuestion[] => {
      return (questionsData || []).map((q: any) => ({
        id: q.id || Math.floor(Math.random() * 1000000),
        text: q.text || q.question || "",
        options: q.options || null,
        correctIndex: q.correctIndex ?? (q.options ? q.options.indexOf(q.correctAnswer || q.correct_answer) : 0),
        type: (q.type === "true-false" || q.type === "true_false")
          ? "true_false"
          : (q.type === "open_ended" || q.type === "open-ended" ? "open_ended" : "multiple_choice"),
        correct_answer: q.correct_answer ?? null,
        is_numerical: q.is_numerical ?? false,
        expected_keywords: q.expected_keywords ?? null,
        numerical_answer: q.numerical_answer ?? null,
        explanation: q.explanation ?? null,
        hint: q.hint ?? null,
        reference: q.reference ?? null
      }));
    };

    if (data.questions && Array.isArray(data.questions)) {
      return mapQuestions(data.questions);
    }

    // Fallback if data structure is unexpected (flatten legacy quiz_sets)
    if (data.quiz_sets) {
      const all = [
        ...(data.quiz_sets.easy?.questions || []),
        ...(data.quiz_sets.medium?.questions || []),
        ...(data.quiz_sets.hard?.questions || [])
      ];
      return mapQuestions(all);
    }

    return [];
  } catch (error: any) {
    console.error("[aiService] Error generating quiz:", error);
    return [];
  }
}

// Generate slides from transcript and summary
export async function generateSlides(
  transcript: string,
  summary: string | string[],
  extractedImages?: { url: string; description?: string; descriptionAr?: string; relevance?: string }[]
): Promise<AISlide[]> {
  try {
    // Offer the AI the REAL figures extracted from the lecture (skip junk), so it can
    // place + explain the most useful ones. Indices here become the slide's imageRef.
    const images = (extractedImages || [])
      .filter((img) => img && img.url && img.relevance !== "garbage")
      .slice(0, 12)
      .map((img, index) => ({
        index,
        description: img.descriptionAr || img.description || "",
        url: img.url,
      }));

    // Use AI API to generate structured slides
    const response = await fetch("/api/ai/slides", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        summary,
        mode: "api", // Slides are currently API-only for layout complexity
        theme: "clean",
        ...(images.length ? { images } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate slides");
    }

    const data = await response.json();

    // Convert API response to AISlide format
    if (data.slides && Array.isArray(data.slides)) {
      return data.slides.map((slide: any, index: number) => ({
        ...slide, // preserve rich fields (lead, bullets, cards, steps, callout, visual, ...)
        id: index + 1,
        title: slide.title || `Slide ${index + 1}`,
        // content stays a string[] for back-compat; derive from bullets if needed
        content: Array.isArray(slide.content) && slide.content.length
          ? slide.content
          : (Array.isArray(slide.bullets)
              ? slide.bullets.map((b: any) => (typeof b === "string" ? b : b?.text || "")).filter(Boolean)
              : []),
      }));
    }

    // Fallback: return empty array if no slides
    return [];
  } catch (error) {
    console.error("[aiService] Error generating slides:", error);

    // Fallback: create simple slides from summary if API fails
    const slides: AISlide[] = [];

    // Handle both string (new format) and array (legacy format)
    if (typeof summary === "string") {
      if (!summary || summary.trim().length === 0) {
        return slides;
      }

      // Split long-form summary into paragraphs and create slides from them
      const paragraphs = summary.split(/\n\s*\n/).filter(p => p.trim().length > 0);

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].trim();
        // Split paragraph into sentences for slide content
        const sentences = paragraph.split(/[.!؟]+/).filter(s => s.trim().length > 20);

        if (sentences.length > 0) {
          slides.push({
            id: slides.length + 1,
            title: `Section ${slides.length + 1}`,
            content: sentences.slice(0, 4), // Max 4 sentences per slide
          });
        }
      }
    } else {
      // Legacy array format
      if (summary.length === 0) {
        return slides;
      }

      // Create slides from summary points (group every 2-3 points)
      const pointsPerSlide = 2;
      for (let i = 0; i < summary.length; i += pointsPerSlide) {
        const slidePoints = summary.slice(i, i + pointsPerSlide);
        slides.push({
          id: slides.length + 1,
          title: `Key Point ${slides.length + 1}`,
          content: slidePoints,
        });
      }
    }

    return slides;
  }
}

// Generate flashcards from transcript
export async function generateFlashcards(transcript: string, mode: "gpu" | "api" = "api"): Promise<any[]> {
  try {
    if (!transcript || transcript.length < 200) {
      return [];
    }

    const response = await fetch("/api/ai/flashcards", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate flashcards");
    }

    const data = await response.json();

    if (!data.flashcards || !Array.isArray(data.flashcards)) {
      throw new Error("Invalid flashcards format received");
    }

    // Map backend format to frontend format
    const flashcards = data.flashcards.map((f: any) => ({
      id: f.id || 0,
      term: f.term || "",
      definition: f.definition || "",
    }));

    console.log(`[aiService] AI flashcards generated with ${flashcards.length} cards`);
    return flashcards;
  } catch (error: any) {
    console.error("[aiService] Error generating flashcards:", error);

    // Fallback to simple flashcards if API fails
    if (!transcript || transcript.length < 200) {
      return [];
    }

    const hasArabic = /[\u0600-\u06FF]/.test(transcript);
    return [
      {
        id: 1,
        term: hasArabic ? "المفهوم الرئيسي" : "Main Concept",
        definition: hasArabic ? "المفهوم الرئيسي الذي تمت مناقشته في هذه المحاضرة" : "The main concept discussed in this lecture",
      },
    ];
  }
}

// Generate formulas from transcript
export async function generateFormulas(
  transcript: string,
  mode: "gpu" | "api" = "api",
  geminiFileUri?: string,
  geminiFileMimeType?: string
): Promise<any[]> {
  try {
    if (!transcript || transcript.length < 200) {
      return [];
    }

    const response = await fetch("/api/ai/formulas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        mode,
        geminiFileUri,
        geminiFileMimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate formulas");
    }

    const data = await response.json();

    if (!data.formulas || !Array.isArray(data.formulas)) {
      throw new Error("Invalid formulas format received");
    }

    console.log(`[aiService] AI formulas generated with ${data.formulas.length} formulas`);
    return data.formulas;
  } catch (error: any) {
    console.error("[aiService] Error generating formulas:", error);
    // Graceful degradation: return empty array
    return [];
  }
}

// Generate Medical Insights from transcript (only used for medical lectures)
export async function generateMedicalInsights(
  transcript: string,
  mode: "gpu" | "api" = "api",
  geminiFileUri?: string,
  geminiFileMimeType?: string
): Promise<MedicalInsights> {
  const empty: MedicalInsights = { terms: [], drugs: [], calculations: [], procedures: [] };
  try {
    if (!transcript || transcript.length < 200) {
      return empty;
    }

    const response = await fetch("/api/ai/medical", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        mode,
        geminiFileUri,
        geminiFileMimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate medical insights");
    }

    const data = await response.json();

    const result: MedicalInsights = {
      insight: data?.insight,
      terms: Array.isArray(data?.terms) ? data.terms : [],
      drugs: Array.isArray(data?.drugs) ? data.drugs : [],
      calculations: Array.isArray(data?.calculations) ? data.calculations : [],
      procedures: Array.isArray(data?.procedures) ? data.procedures : [],
    };

    const total =
      (result.terms?.length || 0) +
      (result.drugs?.length || 0) +
      (result.calculations?.length || 0) +
      (result.procedures?.length || 0);
    console.log(`[aiService] Medical insights generated with ${total} items`);
    return result;
  } catch (error: any) {
    console.error("[aiService] Error generating medical insights:", error);
    // Graceful degradation
    return empty;
  }
}

// Generate Engineering Lab insights from transcript (only used for engineering lectures)
export async function generateEngineeringInsights(
  transcript: string,
  mode: "gpu" | "api" = "api",
  geminiFileUri?: string,
  geminiFileMimeType?: string
): Promise<EngineeringInsights> {
  const empty: EngineeringInsights = { components: [], circuits: [], code: [], formulas: [], procedures: [] };
  try {
    if (!transcript || transcript.length < 200) {
      return empty;
    }

    const response = await fetch("/api/ai/engineering", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, mode, geminiFileUri, geminiFileMimeType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate engineering insights");
    }

    const data = await response.json();
    const result: EngineeringInsights = {
      insight: data?.insight,
      components: Array.isArray(data?.components) ? data.components : [],
      circuits: Array.isArray(data?.circuits) ? data.circuits : [],
      code: Array.isArray(data?.code) ? data.code : [],
      formulas: Array.isArray(data?.formulas) ? data.formulas : [],
      procedures: Array.isArray(data?.procedures) ? data.procedures : [],
    };

    const total =
      (result.components?.length || 0) +
      (result.circuits?.length || 0) +
      (result.code?.length || 0) +
      (result.formulas?.length || 0) +
      (result.procedures?.length || 0);
    console.log(`[aiService] Engineering insights generated with ${total} items`);
    return result;
  } catch (error: any) {
    console.error("[aiService] Error generating engineering insights:", error);
    return empty;
  }
}


// Generate mind map from transcript
export async function generateConceptMap(
  transcript: string,
  mode: string = "api",
  flashcards?: any[]
): Promise<any> {
  try {
    // Only skip if we truly have no usable source at all
    if ((!transcript || transcript.trim().length === 0) && (!flashcards || flashcards.length === 0)) {
      return null;
    }

    const response = await fetch("/api/ai/concept-map", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transcript,
        flashcards,
        mode,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate mind map");
    }

    const data = await response.json();
    return data.conceptMap;
  } catch (error: any) {
    console.error("[aiService] Error generating mind map:", error);
    return null;
  }
}


// Classify lecture category using AI
export async function classifyCategory(
  title?: string,
  transcript?: string,
  summary?: string | string[],
  mode?: "gpu" | "api"
): Promise<string> {
  try {
    console.log(`[aiService] Classifying lecture category using AI (mode: ${mode || "api"})...`);

    const summaryText = typeof summary === "string"
      ? summary
      : Array.isArray(summary)
        ? summary.join(" ")
        : "";

    const response = await fetch("/api/ai/category", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        transcript,
        summary: summaryText,
        mode,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to classify category");
    }

    const category = data.category || "other";
    console.log(`[aiService] AI classified category: ${category}`);
    return category;
  } catch (error: any) {
    console.error("[aiService] Error classifying category:", error);
    // Fallback to keyword-based classification
    return "other";
  }
}

// Slide theme type
export type SlideTheme = "clean" | "dark" | "academic" | "modern" | "tech" | "corporate" | "creative" | "eco";

// Download slides as PowerPoint (.pptx)
export async function downloadSlidesPptx(
  slides: { title: string; content: string[] }[],
  theme: SlideTheme = "clean",
  lectureTitle: string = "Lecture Slides",
  customColor?: string,
  options?: {
    nanobanana?: boolean;
    visualStyle?: string;
    layoutStyle?: string;
    nbBgColor?: string;
    nbPanelColor?: string;
    nbTitleColor?: string;
    animate?: boolean;
    format?: "image" | "editable" | "hybrid";
  }
): Promise<void> {
  try {
    // Validate slides data
    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      throw new Error("No slides provided");
    }

    // Ensure all slides have required fields and preserve structured data
    const validSlides = slides.map(slide => ({
      ...slide,
      title: slide.title || "Untitled Slide",
      content: Array.isArray(slide.content) ? slide.content : [],
    }));

    console.log("[aiService] Downloading PPTX with slides:", {
      count: validSlides.length,
      slides: validSlides.map(s => ({ title: s.title, contentCount: s.content.length })),
      theme,
      lectureTitle,
      customColor,
    });

    const response = await fetch("/api/ai/slides/download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        slides: validSlides,
        theme,
        lectureTitle,
        customColor,
        animate: options?.animate !== false,
        format: options?.format || "image",
        nanobanana: options?.nanobanana,
        visualStyle: options?.visualStyle,
        layoutStyle: options?.layoutStyle,
        nbBgColor: options?.nbBgColor,
        nbPanelColor: options?.nbPanelColor,
        nbTitleColor: options?.nbTitleColor,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to download PowerPoint");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${lectureTitle.replace(/[^a-z0-9\u0600-\u06FF]/gi, "_")}_slides${options?.format === "editable" ? "_editable" : options?.format === "hybrid" ? "_editable_design" : ""}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error("[aiService] Error downloading PPTX:", error);
    throw error;
  }
}

export interface EssayEvaluation {
  similarityScore: number;
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
}

// Evaluate user's essay answer using AI
export async function evaluateEssayAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  expectedKeywords: string[] = [],
  isNumerical: boolean = false,
  mode: "gpu" | "api" = "api"
): Promise<EssayEvaluation> {
  try {
    const response = await fetch("/api/ai/evaluate-answer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, userAnswer, correctAnswer, expectedKeywords, is_numerical: isNumerical, mode }),
    });

    if (!response.ok) {
      throw new Error("Failed to evaluate answer");
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("[aiService] Error evaluating essay answer:", error);
    throw error;
  }
}

// Analyze extracted image with Gemini Vision
export async function analyzeImageWithAI(imageUrl: string, transcript?: string, language?: string): Promise<string> {
  try {
    console.log(`[aiService] Requesting image analysis...`);
    const response = await fetch("/api/ai/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl, transcript, language }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to analyze image");
    }

    const data = await response.json();
    return data.description || "";
  } catch (error: any) {
    console.error(`[aiService] Error analyzing image ${imageUrl}:`, error);
    throw error;
  }
}

// Chat with the agent based on transcript
export async function chatWithAgent(
  transcript: string,
  message: string,
  history: { role: string; content: string }[],
  mode: "gpu" | "api" = "api",
  image?: string,
  relatedLectures?: { id: string; title: string; summary?: string; category?: string; sourceType?: string }[]
): Promise<string> {
  try {
    const response = await fetch("/api/ai/agent-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcript, message, history, mode, image, relatedLectures }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to chat with agent");
    }

    const data = await response.json();
    return data.reply || "No reply generated.";
  } catch (error) {
    console.error("[aiService] Error in chatWithAgent:", error);
    throw error;
  }
}
