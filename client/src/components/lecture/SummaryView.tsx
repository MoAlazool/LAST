import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Share2, 
  Sparkles, 
  Clock, 
  User, 
  Calendar, 
  Lightbulb, 
  MessageSquare, 
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Sigma
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import { TextWithMath } from "./MathRenderer";

interface SummaryViewProps {
  summary: string | string[]; 
  title?: string;
  images?: { url: string; description: string; descriptionAr?: string; analyzed?: boolean; title?: string; type?: string; relevance?: string }[];
  formulas?: { name: string; latex: string; description?: string }[];
}

export function SummaryView({ summary, title: initialTitle, images, formulas }: SummaryViewProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const parsedData = useMemo(() => {
    if (typeof summary !== "string") return null;
    try {
      if (summary.trim().startsWith("{")) {
        return JSON.parse(summary);
      }
    } catch (e) {
      console.warn("Summary is not JSON, falling back to legacy parsing");
    }
    return null;
  }, [summary]);

  const handleExportPDF = async () => {
    const element = document.getElementById("premium-summary-container");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${initialTitle || "Summary"}.pdf`);
      toast({ title: language === "ar" ? "تم التصدير بنجاح" : "PDF Exported Successfully" });
    } catch (err) {
      toast({ title: "Export Failed", variant: "destructive" });
    }
  };

  if (!parsedData) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6">
        <h1 className="text-4xl font-black mb-8 text-[#1A1A1A]">{initialTitle || "Lecture Summary"}</h1>
        <div className="prose prose-orange max-w-none">
          <TextWithMath text={typeof summary === "string" ? summary : (Array.isArray(summary) ? summary.join("\n") : "No summary available.")} />
        </div>
      </div>
    );
  }

  const { mainTitle, subTitle, keyConcepts, definitions, takeawaySummary, takeawayPoints } = parsedData;

  const displayTitle = (mainTitle || initialTitle || "Lecture Summary").replace(/\.(pdf|pptx?|ppsx|docx?|doc|mp4|webm|mov|avi|mp3|wav|ogg)/gi, "").trim();

  return (
    <div id="premium-summary-container" className={cn("min-h-screen bg-[#F8FAFC] py-6 px-4 md:px-6 font-sans text-[#1A202C]", isRTL && "rtl text-right")}>
      <div className="w-full mx-auto">
        
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: CORE CONTENT (7/12) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-white rounded-[1.5rem] p-6 md:p-10 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden"
          >
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#F05A22]/[0.015] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
              {/* Breadcrumb / Course Info */}
              <div className={cn("flex items-center gap-3 mb-8", isRTL && "flex-row-reverse")}>
                 <div className="w-8 h-8 rounded-lg bg-[#F05A22]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#F05A22]" />
                 </div>
                 <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#F05A22]">
                   ACADEMIC MODULE: {displayTitle.toUpperCase()}
                 </span>
              </div>

              {/* Title & Metadata */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1A202C] mb-6 leading-[1.1] tracking-tight">
                {displayTitle}
              </h1>

              <div className={cn("flex flex-wrap items-center gap-6 text-[13px] font-bold text-[#64748B] mb-10", isRTL && "flex-row-reverse")}>
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-[#F05A22]/60" />
                  <span>{new Date().toLocaleDateString(isRTL ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#F05A22]/60" />
                  <span>45 min Lecture</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#F05A22]/60" />
                  <span>Prof. Academic AI</span>
                </div>
              </div>

              {/* Conceptual Overview */}
              <div className="mb-10">
                 <h2 className="text-xl font-black text-[#1A202C] mb-4">Conceptual Overview</h2>
                 <div className="text-[17px] leading-[1.8] text-[#4A5568] font-medium max-w-3xl">
                    <TextWithMath text={takeawaySummary.replace(/\\n/g, '\n')} />
                 </div>
              </div>

              {/* Key Summary Points Card */}
              <div className="bg-[#F8FAFC] rounded-[1.5rem] p-6 md:p-8 border border-slate-100 shadow-sm">
                 <div className={cn("flex items-center gap-4 mb-8", isRTL && "flex-row-reverse")}>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                       <Lightbulb className="w-5 h-5 text-[#F05A22]" />
                    </div>
                    <h3 className="text-xl font-black text-[#1A202C]">Key Summary Points</h3>
                 </div>
                 
                 <ul className="space-y-6">
                    {takeawayPoints?.map((point: string, i: number) => (
                      <li key={i} className={cn("flex items-start gap-4", isRTL && "flex-row-reverse")}>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F05A22] shrink-0 mt-2.5" />
                        <div className="text-[15px] font-medium text-[#4A5568] leading-relaxed">
                          <TextWithMath text={point} />
                        </div>
                      </li>
                    ))}
                 </ul>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: INSIGHTS & DEEP DIVE (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Agent Insights Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#FFF8F5] rounded-[1.5rem] p-6 md:p-8 border border-[#F05A22]/10 shadow-sm relative overflow-hidden"
            >
               <div className={cn("flex items-center gap-3 mb-8", isRTL && "flex-row-reverse")}>
                  <div className="w-8 h-8 rounded-lg bg-[#F05A22] flex items-center justify-center shadow-lg shadow-orange-500/20">
                     <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-[#7B341E]">Agent Insights</h3>
               </div>

               <div className="space-y-4">
                  <div className="bg-white rounded-2xl rounded-tl-none p-5 shadow-sm border border-[#F05A22]/5">
                     <p className="text-[13px] font-bold text-[#4A5568] leading-relaxed">
                       "The relationship between <span className="text-[#F05A22]">{keyConcepts?.[0]?.title || 'the core concepts'}</span> and <span className="text-[#F05A22]">{keyConcepts?.[1]?.title || 'subsequent modules'}</span> is the most critical takeaway from this lecture."
                     </p>
                  </div>
                  <div className="bg-white/60 rounded-2xl rounded-tl-none p-5 shadow-sm border border-[#F05A22]/5">
                     <p className="text-[13px] font-bold text-slate-400 leading-relaxed">
                       "Mastering {keyConcepts?.[0]?.title || 'this material'} will significantly help in understanding {keyConcepts?.[2]?.title || 'advanced topics'} later in the course."
                     </p>
                  </div>
               </div>
            </motion.div>

            {/* Deep Dive Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-[1.5rem] p-6 md:p-8 shadow-xl shadow-slate-200/40 border border-slate-100"
            >
               <div className={cn("flex items-center justify-between mb-10", isRTL && "flex-row-reverse")}>
                  <h3 className="text-2xl font-black text-[#1A202C]">Deep Dive</h3>
                  <div className="px-3 py-1 bg-[#F1F5F9] rounded-full text-[9px] font-black tracking-widest text-[#64748B] uppercase">
                    RELEVANCE: 98%
                  </div>
               </div>

                {/* Terminology Analysis */}
                <div>
                   <div className={cn("flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8]", isRTL && "flex-row-reverse")}>
                     <span>Terminology Analysis</span>
                   </div>
                   <div className="space-y-4">
                      {definitions?.slice(0, 4).map((def: any, i: number) => (
                        <div key={i} className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 group hover:border-[#F05A22]/20 transition-all cursor-pointer">
                           <h4 className="text-sm font-black text-[#1A202C] mb-2 group-hover:text-[#F05A22] transition-colors">{def.term}</h4>
                           <p className="text-xs font-medium text-[#64748B] leading-relaxed">
                             {def.definition}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>


            </motion.div>

            {/* Actions Quick Access */}
            <div className="flex gap-4 no-print">
               <Button onClick={handleExportPDF} className="flex-1 bg-[#1A202C] hover:bg-black text-white h-14 rounded-2xl font-bold shadow-lg shadow-slate-900/10">
                  <Download className="w-4 h-4 mr-2" /> Download PDF
               </Button>
               <Button variant="outline" className="w-14 h-14 rounded-2xl border-slate-200 bg-white shadow-sm">
                  <Share2 className="w-5 h-5 text-slate-600" />
               </Button>
            </div>

          </div>
        </div>

        {/* Global Footer */}
        <footer className="mt-20 py-10 border-t border-slate-100 flex flex-col items-center gap-4">
           <div className="w-10 h-1 rounded-full bg-[#F05A22]/20" />
           <p className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.4em] opacity-60">
             Curated by Lecture Mate Agent • Powered by Academic Intelligence
           </p>
        </footer>

      </div>
    </div>
  );
}
