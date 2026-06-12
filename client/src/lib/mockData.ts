import { Clock, FileText, Layout, MessageSquare, PlayCircle, List, CheckCircle, HelpCircle, Presentation } from "lucide-react";

export type LectureStatus = "processing" | "completed" | "failed" | "archived";

export interface Question {
  id: number;
  text: string;
  options: string[] | null;
  correct_answer: string | null;
  correctIndex?: number; // Keep for backward compatibility
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

export interface Slide {
  id: number;
  title: string;
  content: string[];
  // Expanded layout set (rich, "designer" decks). Old types still valid.
  type?: "intro" | "section" | "content" | "bullets" | "quote" | "stats" | "comparison" | "summary" | "cards" | "process" | "timeline" | "diagram" | "figure" | "code";
  lead?: string;
  subtitle?: string;
  quote?: string;
  left_label?: string;
  right_label?: string;
  left_points?: string[];
  right_points?: string[];
  stats?: Array<{ value: string; label: string }>;
  // Rich fields (optional)
  bullets?: Array<{ text: string; icon?: string } | string>;
  callout?: { label?: string; text: string };
  cards?: Array<{ icon?: string; title: string; text: string }>;
  steps?: Array<{ title: string; text?: string }>;
  visual?: { type: "svg" | "mermaid"; code: string; caption?: string };
  // figure — a real image extracted from the uploaded lecture
  imageUrl?: string;
  imageRef?: number;
  // code — a code snippet from the lecture
  code?: string;
  codeLanguage?: string;
  speaker_notes?: string;
  direction?: "ltr" | "rtl";
  language?: "en" | "ar";
}

export interface Flashcard {
  id: number | string;
  term: string;
  definition: string;
  flagged?: boolean;
  interval?: number; // for spaced repetition (in days)
  easeFactor?: number; // for spaced repetition
  nextReviewDate?: string; // ISO date
  masteryLevel?: number; // 0-100
  relatedConcept?: string;
}

// --- Visual math learning aids (attached to a Formula where helpful) ---
export interface GraphSeries {
  label?: string;
  expression?: string; // shown as the curve label only
  points: { x: number; y: number }[];
}
export interface FormulaGraph {
  title?: string;
  xLabel?: string;
  yLabel?: string;
  series: GraphSeries[];
}
export interface SolutionStep {
  title?: string;
  math?: string; // LaTeX for this step
  explanation?: string;
}

export interface Formula {
  id: number;
  name: string;
  formula: string;
  description: string;
  category?: string;
  variables?: { symbol: string; meaning: string }[];
  visual?: MedicalVisual; // geometric shape / diagram (SVG or mermaid)
  graph?: FormulaGraph; // interactive coordinate graph / function curve
  steps?: SolutionStep[]; // worked step-by-step solution
}

// --- Medical Insights (parallel to Formulas, shown only for medical lectures) ---

// An AI-authored visual explanation embedded in a medical card.
// type "mermaid" -> rendered via the mermaid library; type "svg" -> self-contained
// <svg> rendered safely through a data: URI <img> (animations still play).
export interface MedicalVisual {
  type: "svg" | "mermaid";
  code: string;
  caption?: string;
}

// A real reference image resolved server-side (e.g. from Wikipedia) for an item.
// `imageQuery` is what the AI suggests; `image` is what the backend resolved.
export interface MedicalImage {
  url: string;       // thumbnail/image URL
  pageUrl?: string;  // source page (for attribution link)
  title?: string;    // resolved page title
  source?: string;   // e.g. "Wikipedia"
}

// An interactive 3D model resolved server-side (e.g. from Sketchfab) for an anatomy term.
export interface Model3D {
  embedUrl: string;
  name?: string;
  author?: string;
  pageUrl?: string;
  source?: string; // e.g. "Sketchfab"
}

export interface MedicalTerm {
  id: number;
  name: string;
  type: "disease" | "anatomy" | "symptom" | "procedure" | "test" | "concept";
  definition: string;
  clinicalContext?: string;
  category?: string; // medical specialty: Cardiology, Neurology, ...
  visual?: MedicalVisual;
  imageQuery?: string;
  image?: MedicalImage;
  model3dQuery?: string; // e.g. "human heart anatomy" — resolved to an interactive 3D model
  model3d?: Model3D;
}

export interface DrugCard {
  id: number;
  name: string;
  drugClass: string;
  mechanism: string;
  indications: string[];
  dosage?: string;
  sideEffects: string[];
  warnings?: string;
  visual?: MedicalVisual;
  imageQuery?: string;
  image?: MedicalImage;
  moleculeName?: string; // generic compound name for a 3D PubChem lookup (e.g. "Lisinopril")
}

export interface ClinicalCalculation {
  id: number;
  name: string;
  formula: string; // LaTeX — rendered with KaTeXMath
  description: string;
  variables?: { symbol: string; meaning: string }[];
  normalRange?: string;
  category?: string;
  visual?: MedicalVisual;
  imageQuery?: string;
  image?: MedicalImage;
}

export interface ClinicalProcedure {
  id: number;
  name: string;
  steps: string[]; // ordered steps OR case logic (presentation -> diagnosis -> treatment)
  indication?: string;
  notes?: string;
  visual?: MedicalVisual;
  imageQuery?: string;
  image?: MedicalImage;
}

export interface MedicalInsights {
  terms?: MedicalTerm[];
  drugs?: DrugCard[];
  calculations?: ClinicalCalculation[];
  procedures?: ClinicalProcedure[];
  insight?: { title: string; description: string };
}

// --- Engineering Lab (parallel to Medical Insights, shown only for engineering lectures) ---
export interface EngComponent {
  id: number;
  name: string;
  type?: string; // e.g. resistor, capacitor, microcontroller, sensor, IC
  description: string;
  specs?: { label: string; value: string }[];
  typicalUse?: string;
  category?: string; // e.g. Electronics, Power, Sensors
  visual?: MedicalVisual;
  imageQuery?: string;
  image?: MedicalImage;
  model3dQuery?: string;
  model3d?: Model3D;
}

export interface EngCircuit {
  id: number;
  name: string;
  description: string;
  components?: string[];
  howItWorks?: string;
  visual?: MedicalVisual; // schematic (SVG) or block diagram (mermaid)
}

export interface CodeSnippet {
  id: number;
  title: string;
  language: string; // e.g. cpp, arduino, python
  code: string;
  explanation?: string;
}

export interface EngFormula {
  id: number;
  name: string;
  formula: string; // LaTeX — rendered with KaTeXMath
  description: string;
  variables?: { symbol: string; meaning: string }[];
  category?: string;
}

export interface EngProcedure {
  id: number;
  name: string;
  steps: string[];
  notes?: string;
}

export interface EngineeringInsights {
  components?: EngComponent[];
  circuits?: EngCircuit[];
  code?: CodeSnippet[];
  formulas?: EngFormula[];
  procedures?: EngProcedure[];
  insight?: { title: string; description: string };
}

export type LectureCategory =
  | "science"
  | "technology"
  | "engineering"
  | "mathematics"
  | "medicine"
  | "history"
  | "art"
  | "language"
  | "business"
  | "education"
  | "other";

export interface Lecture {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: string;
  date: string;
  createdAt?: string; // ISO date string
  status: LectureStatus;
  progress?: number; // 0-100
  summary?: string | string[]; // Support both long-form string (new) and array (legacy)
  transcript?: string;
  quiz_sets?: {
    easy: Question[];
    medium: Question[];
    hard: Question[];
  };
  questions?: Question[]; // Legacy support
  slides?: Slide[];
  flashcards?: Flashcard[];
  formulas?: Formula[];
  medical?: MedicalInsights; // Medical Insights — populated only for medical lectures
  engineering?: EngineeringInsights; // Engineering Lab — populated only for engineering lectures
  modelType?: "gpu" | "api"; // Model used to process this lecture
  category?: LectureCategory; // Smart category classification
  geminiFileUri?: string; // Gemini Vision API file URI
  geminiFileMimeType?: string; // Gemini Vision API file mime type
  conceptMap?: any; // AI generated concept map configuration
  extractedImages?: { url: string; description: string; descriptionAr?: string; analyzed?: boolean }[]; // Array of extracted images
  transcriptChunks?: Array<{ text: string; images: string[]; page_number: number }>; // Chunks with associated images
  sourceType?: "youtube" | "pdf" | "pptx" | "docx" | "audio" | "video"; // Source of the lecture
  sourceUrl?: string; // Public URL of the original source file (if uploaded)
  documentPageCount?: number; // Total pages/slides of original uploaded document
}

export const MOCK_LECTURES: Lecture[] = [
  {
    id: "1",
    title: "Introduction to Quantum Mechanics: The Wave Function",
    thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    duration: "45:20",
    date: "Today, 10:23 AM",
    status: "completed",
    summary: [
      "The wave function (Ψ) is a fundamental concept in quantum mechanics describing the quantum state of a particle.",
      "Unlike classical mechanics, quantum mechanics is probabilistic, not deterministic.",
      "The Schrödinger equation determines how the wave function evolves over time.",
      "Observation causes the 'collapse' of the wave function to a specific eigenstate.",
      "Heisenberg's Uncertainty Principle places limits on the precision of simultaneous measurements of position and momentum."
    ],
    transcript: `Good morning everyone. Today we are going to dive deep into the heart of Quantum Mechanics: The Wave Function. 

    Now, in classical mechanics, if we want to describe the state of a particle, we specify its position and its momentum. If we know these two things, and we know the forces acting on the particle, we can predict its future motion with absolute certainty using Newton's laws. 

    But the quantum world is different. Very different. 

    In quantum mechanics, we don't have precise values for position and momentum simultaneously. Instead, the state of a system is described by a mathematical function called the wave function, denoted by the Greek letter Psi (Ψ).

    This wave function contains all the information that can be known about the system. But here's the catch: it doesn't tell us *exactly* where the particle is. Instead, the square of the absolute value of the wave function gives us the *probability density* of finding the particle at a particular location.

    Think about that for a second. Nature, at its most fundamental level, is not deterministic. It's probabilistic. Einstein hated this idea, famously saying "God does not play dice." But experiment after experiment has shown that this is indeed how the universe works.

    Now, let's look at the Schrödinger equation...`,
    quiz_sets: {
      easy: [
        {
          id: 101,
          text: "What is the wave function denoted by?",
          options: ["Sigma (Σ)", "Psi (Ψ)", "Delta (Δ)", "Omega (Ω)"],
          correct_answer: "Psi (Ψ)",
          correctIndex: 1,
          type: "multiple_choice"
        }
      ],
      medium: [
        {
          id: 1,
          text: "What does the square of the wave function represent?",
          options: [
            "The exact position of the particle",
            "The momentum of the particle",
            "The probability density of finding the particle",
            "The energy of the particle"
          ],
          correct_answer: "The probability density of finding the particle",
          correctIndex: 2,
          type: "multiple_choice"
        },
        {
          id: 2,
          text: "Classical mechanics is probabilistic while quantum mechanics is deterministic.",
          options: ["True", "False"],
          correct_answer: "False",
          correctIndex: 1,
          type: "true_false"
        }
      ],
      hard: [
        {
          id: 201,
          text: "Explain why Einstein famously said 'God does not play dice' in the context of the Schrödinger equation and the wave function.",
          options: null,
          correct_answer: null,
          correctIndex: 0,
          type: "open_ended",
          expected_keywords: ["probabilistic", "deterministic", "Einstein", "deterministic nature", "God does not play dice"]
        }
      ]
    },
    slides: [
      {
        id: 1,
        title: "The Wave Function (Ψ)",
        content: [
          "Fundamental description of quantum state",
          "Contains all knowable information about the system",
          "Not directly observable"
        ]
      },
      {
        id: 2,
        title: "Probability Density",
        content: [
          "|Ψ(x,t)|² represents probability density",
          "Determines likelihood of finding particle at position x",
          "Normalization condition: ∫|Ψ|²dx = 1"
        ]
      },
      {
        id: 3,
        title: "Schrödinger Equation",
        content: [
          "Describes time evolution of Ψ",
          "ih̄(∂Ψ/∂t) = ĤΨ",
          "Analogous to Newton's F=ma in classical mechanics"
        ]
      }
    ]
  },
  {
    id: "2",
    title: "Modern Art History: Abstract Expressionism",
    thumbnailUrl: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    duration: "1:12:05",
    date: "Yesterday",
    status: "completed",
    summary: [
      "Abstract Expressionism emerged in New York in the 1940s.",
      "It was the first specifically American movement to achieve international influence.",
      "Key figures include Jackson Pollock, Mark Rothko, and Willem de Kooning.",
      "The movement emphasizes spontaneous, automatic, or subconscious creation."
    ],
    transcript: "Welcome back to Art History 101. Today we are moving into the post-war era...",
    quiz_sets: {
      easy: [],
      medium: [
        {
          id: 301,
          text: "When did Abstract Expressionism emerge?",
          options: ["1920s", "1930s", "1940s", "1950s"],
          correct_answer: "1940s",
          correctIndex: 2,
          type: "multiple_choice"
        }
      ],
      hard: []
    },
    slides: []
  },
  {
    id: "3",
    title: "Neural Networks and Deep Learning",
    thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3",
    duration: "55:00",
    date: "Nov 24, 2025",
    status: "processing",
    progress: 65,
    summary: [],
    transcript: "",
    quiz_sets: { easy: [], medium: [], hard: [] },
    slides: []
  }
];
