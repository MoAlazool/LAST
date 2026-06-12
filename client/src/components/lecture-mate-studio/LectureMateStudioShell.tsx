import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import Hero from "./dashboard/Hero";
import NewAnalysis from "./dashboard/NewAnalysis";
import LandingShowcase from "./dashboard/LandingShowcase";
import MasterySection from "./dashboard/MasterySection";
import Footer from "./layout/Footer";

import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useLectureProcessor } from "@/hooks/useLectureProcessor";

/**
 * Lecture Mate dashboard shell exported from Google AI Studio (Downloads bundle),
 * integrated into the Vite client under client/src.
 */
export default function LectureMateStudioShell() {
  const { isRTL } = useLanguage();
  const { 
    handleAnalyze, 
    handleFileAnalyze, 
    isAnalyzing, 
    selectedModel, 
    setSelectedModel 
  } = useLectureProcessor();

  return (
    <div className="flex min-h-screen" dir={isRTL ? "rtl" : "ltr"}>
      <Sidebar />

      <main className={cn(
        "flex-1 bg-surface min-h-screen flex flex-col",
        isRTL ? "mr-64" : "ml-64"
      )}>
        <Header />

        <div className="px-6 sm:px-12 py-6 sm:py-8 flex-1">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            <div className="max-w-3xl mx-auto w-full">
              <NewAnalysis
                handleAnalyze={handleAnalyze}
                handleFileAnalyze={handleFileAnalyze}
                isAnalyzing={isAnalyzing}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
              />
            </div>

            <LandingShowcase />

            <MasterySection />

            <Hero />
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
