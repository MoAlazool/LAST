import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Download, Copy, FileText, Clock, Bot } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jsPDF } from "jspdf";
import { useLanguage } from "@/contexts/LanguageContext";
import html2canvas from "html2canvas";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

function processMath(text: string) {
    if (!text) return "";
    // Ensure math blocks are correctly spaced for ReactMarkdown
    let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, "\n\n$$\n$1\n$$\n\n");
    processed = processed.replace(/\$([^\$]+)\$/g, " $$ $1 $$ ");
    return processed;
}

interface TranscriptViewProps {
  text: string;
  title?: string;
  images?: Array<{ url: string; description?: string; pageNumber?: number }>;
  transcriptChunks?: Array<{ text: string; images: string[]; page_number: number }>;
}

export function TranscriptView({ text, title, images, transcriptChunks }: TranscriptViewProps) {
  const { toast } = useToast();
  const { language } = useLanguage();

  const defaultTitle = language === "ar" ? "النص الكامل" : "Transcript";
  const displayTitle = title || defaultTitle;

  const t = {
    fullTranscript: language === "ar" ? "النص الكامل" : "Full Transcript",
    copy: language === "ar" ? "نسخ" : "Copy",
    exportPDF: language === "ar" ? "تصدير PDF" : "Export PDF",
    noTranscript: language === "ar" ? "لا يوجد نص متاح." : "No transcript available.",
    toast: {
      copied: language === "ar" ? "تم النسخ" : "Copied to clipboard",
      copiedDesc: language === "ar" ? "تم نسخ النص إلى الحافظة." : "The transcript has been copied to your clipboard.",
      exported: language === "ar" ? "تم تصدير PDF" : "PDF exported",
      exportedDesc: language === "ar" ? "تم تصدير النص كملف PDF." : "The transcript has been exported as PDF.",
      exportFailed: language === "ar" ? "فشل التصدير" : "Export failed",
      exportFailedDesc: language === "ar" ? "فشل تصدير PDF. يرجى المحاولة مرة أخرى." : "Failed to export PDF. Please try again.",
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    toast({
      title: t.toast.copied,
      description: t.toast.copiedDesc,
    });
  };

  const handleExportPDF = async () => {
    try {
      // Check if text contains Arabic characters
      const hasArabic = /[\u0600-\u06FF]/.test(text || displayTitle);
      const dir = hasArabic ? "rtl" : "ltr";
      const textAlign = hasArabic ? "right" : "left";

      // Site colors
      const primaryColor = "#F05A22";
      const primaryDark = "#C2410C";
      const textColor = "#1a1a1a";
      const mutedText = "#6b7280";
      const borderColor = "#e5e7eb";
      const bgColor = "#ffffff";
      const mutedBg = "#f8f9fa";

      // Create HTML content
      const htmlContent = `
        <div style="font-family: 'Tajawal', Arial, sans-serif; direction: ${dir}; color: ${textColor}; line-height: 1.8; padding: 20px; background-color: ${bgColor};">
          <div style="text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 3px solid ${primaryColor};">
            <h1 style="font-size: 24px; font-weight: bold; color: ${primaryColor}; margin: 0;">
              ${displayTitle}
            </h1>
            <p style="font-size: 9px; color: ${mutedText}; margin-top: 10px;">
              ${language === "ar" ? "تم التصدير بواسطة LectureMate" : "Exported by LectureMate"} • ${new Date().toLocaleDateString(language === "ar" ? "ar-EG" : "en-US")}
            </p>
          </div>
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; color: ${primaryColor}; border-bottom: 2px solid ${primaryColor}; padding-bottom: 5px; margin-bottom: 10px; text-align: ${textAlign};">
              ${language === "ar" ? "📄 النص الكامل" : "📄 Full Transcript"}
            </h2>
            <div style="font-size: 11px; text-align: justify; line-height: 1.8; padding: 10px; background-color: ${mutedBg}; color: ${textColor};">
              ${(text || t.noTranscript).replace(/\n/g, "<br>")}
            </div>
          </div>
          <div style="margin-top: 30px; padding-top: 15px; border-top: 2px solid ${borderColor}; text-align: center;">
            <p style="font-size: 9px; color: ${mutedText};">
              ${language === "ar"
          ? "© 2025 LectureMate. جميع الحقوق محفوظة. هذا المستند محمي بحقوق النشر ولا يجوز نسخه أو توزيعه دون إذن."
          : "© 2025 LectureMate. All rights reserved. This document is protected by copyright and may not be copied or distributed without permission."}
            </p>
          </div>
        </div>
      `;

      // Create temporary container
      const container = document.createElement("div");
      container.innerHTML = htmlContent;
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "210mm"; // A4 width
      container.style.padding = "15mm";
      container.style.backgroundColor = "white";
      container.style.fontFamily = hasArabic ? "Tajawal, Arial, sans-serif" : "Arial, sans-serif";
      document.body.appendChild(container);

      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Convert HTML to Canvas
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 794, // A4 width in pixels at 96 DPI
        windowHeight: container.scrollHeight,
      });

      // Remove temporary container
      document.body.removeChild(container);

      // Create PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const pdf = new jsPDF("p", "mm", "a4");
      const imgData = canvas.toDataURL("image/jpeg", 0.95);

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save PDF
      const filename = `${displayTitle.replace(/[^a-z0-9\u0600-\u06FF]/gi, "_")}_transcript.pdf`;
      pdf.save(filename);

      toast({
        title: t.toast.exported,
        description: t.toast.exportedDesc,
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: t.toast.exportFailed,
        description: t.toast.exportFailedDesc,
        variant: "destructive",
      });
    }
  };

  // Detect language from content
  const detectContentLanguage = useMemo(() => {
    const hasArabic = /[\u0600-\u06FF]/.test(text || "");
    return hasArabic ? "ar" : language;
  }, [text, language]);

  // Use UI language for UI elements
  const uiDir = language === "ar" ? "rtl" : "ltr";

  // Use content language for content direction
  const contentDir = detectContentLanguage === "ar" ? "rtl" : "ltr";
  const contentTextAlign = detectContentLanguage === "ar" ? "right" : "left";

  const paragraphs = useMemo(() => {
    if (!text) return [];

    // Always render the extracted transcript text itself. For documents this is the
    // full Gemini Vision read (every page in order, equations as LaTeX, figures
    // described) — far richer than the old per-page parser chunks. Split into
    // readable blocks on blank lines, falling back to single newlines.
    let blocks = text.split(/\n{2,}/).filter(p => p.trim().length > 0);
    if (blocks.length <= 1 && text.length > 500) {
      blocks = text.split(/\n/).filter(p => p.trim().length > 0);
    }

    // Fallback: Whisper/GPU video transcripts arrive as one unbroken blob with no
    // line breaks, so the splits above yield a single giant block (shown as "01").
    // When that happens, fall back to the structured chunks (per-30s for video,
    // per-page for documents) so the transcript is broken into readable sections.
    if (blocks.length <= 1 && transcriptChunks && transcriptChunks.length > 1) {
      const chunkBlocks = transcriptChunks
        .map(c => (c?.text || "").trim())
        .filter(t => t.length > 0);
      if (chunkBlocks.length > 1) return chunkBlocks;
    }

    return blocks;
  }, [text, transcriptChunks]);

  // Parse real [MM:SS] marker from the start of a paragraph
  const parseTimestamp = (para: string): { timeStr: string; body: string } => {
    const match = para.match(/^\[(\d{1,2}:\d{2})\]\s*/);
    if (match) {
      return { timeStr: match[1], body: para.slice(match[0].length).trim() };
    }
    return { timeStr: "", body: para.trim() };
  };

  const wordCount = useMemo(() => text.split(/\s+/).filter(Boolean).length, [text]);
  const readTimeMins = Math.max(1, Math.ceil(wordCount / 180));

  // Images have been removed by user request
  const safeImages: any[] = [];
  const chunkImages: any = {};
  const IMG_EVERY_N = 999999;

  // Splitting title safely
  const titleParts = useMemo(() => {
    const cleanTitle = displayTitle.replace(/\.(pdf|pptx?|ppsx|docx?|doc|mp4|webm|mov|avi|mp3|wav|ogg)/gi, "").trim();
    const words = cleanTitle.split(' ');
    if (words.length <= 1) return { main: cleanTitle, highlight: "" };
    const highlightCount = Math.min(2, Math.max(1, Math.floor(words.length / 3)));
    return {
      main: words.slice(0, words.length - highlightCount).join(' '),
      highlight: words.slice(words.length - highlightCount).join(' ')
    };
  }, [displayTitle]);

  return (
    <div className="space-y-4 font-body animate-in fade-in duration-500 pb-20" dir={uiDir}>
      {/* Header Panel — Transformed to Digital Curator Light Style */}
      <div className={`relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 bg-white p-6 md:p-10 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-primary/10 overflow-hidden`}>
        {/* Background Decoration */}
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/[0.02] rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none"></div>
        
        <div className="space-y-4 max-w-2xl relative z-10">
          <div className={`flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest`}>
            <FileText className="w-4 h-4" />
            <span>{language === "ar" ? "النص المستخرج" : "Extracted Content"}</span>
          </div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-black font-headline tracking-tight text-[#111827] leading-tight">
            {titleParts.main} <span className="text-primary">{titleParts.highlight}</span>
          </h2>
          <div className={`flex flex-wrap gap-3 pt-2`}>
            <span className="px-5 py-2 bg-primary/5 rounded-full text-xs font-bold text-[#111827] border border-primary/10 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-primary" /> {readTimeMins} {language === "ar" ? "دقيقة" : "min read"}
            </span>
            <span className="px-5 py-2 bg-primary/5 rounded-full text-xs font-bold text-[#111827] border border-primary/10 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-primary" /> {wordCount} {language === "ar" ? "كلمة" : "words"}
            </span>
            <span className="px-5 py-2 bg-primary text-white rounded-full text-xs font-black shadow-lg shadow-primary/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> {language === "ar" ? "مؤرشف آلياً" : "AI Indexed"}
            </span>
          </div>
        </div>
        
        {/* Action Controls */}
        <div className="flex flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
          <Button onClick={handleCopy} className="bg-white border border-primary/20 text-[#111827] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all px-6 py-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 flex-1 md:flex-none">
            <Copy className="w-4 h-4 text-primary" />
            {t.copy}
          </Button>
          <Button onClick={handleExportPDF} className="bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all px-6 py-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 flex-1 md:flex-none">
            <Download className="w-4 h-4 text-white" />
            {t.exportPDF}
          </Button>
        </div>
      </div>

      {/* Stats Cards Section - Now Horizontal and Above Transcript */}
      <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-6 mb-12")}>
         {/* Document Info Card */}
         <div className="bg-white rounded-[1.5rem] p-6 border border-primary/10 shadow-[0_5px_20px_rgba(0,0,0,0.02)]">
           <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-8">{language === "ar" ? "المعلومات الأساسية" : "Document Info"}</h3>
           <div className="flex flex-col sm:flex-row gap-8">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl border-2 border-primary/10 overflow-hidden flex items-center justify-center bg-white text-primary shadow-sm">
                   <span className="material-symbols-outlined text-2xl">face</span>
                </div>
                <div>
                  <p className="text-base font-black text-[#111827] leading-none">{language === "ar" ? "المحاضر" : "Main Presenter"}</p>
                  <p className="text-[11px] text-primary font-bold uppercase tracking-widest mt-2">{language === "ar" ? "صوت متحدث" : "Assumed Speaker"}</p>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl border-2 border-primary/10 overflow-hidden flex items-center justify-center bg-white text-primary/40 shadow-sm">
                   <span className="material-symbols-outlined text-2xl">subscriptions</span>
                </div>
                <div>
                  <p className="text-base font-black text-[#111827] leading-none">{language === "ar" ? "الشرائح المكتشفة" : "Visual Media"}</p>
                  <p className="text-[11px] text-[#111827]/40 font-bold uppercase tracking-widest mt-2">{safeImages.length} {language === "ar" ? "عنصر مرئي" : "Images Found"}</p>
                </div>
              </div>
           </div>
         </div>

         {/* Learning Pulse Card */}
         <div className="relative bg-white rounded-[1.5rem] p-6 shadow-md border border-primary/20 overflow-hidden group flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-[#111827]/30 uppercase tracking-[0.2em] relative mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">bolt</span>
              {language === "ar" ? "نبض التعلم" : "Learning Pulse"}
            </h3>
            <div className="relative h-2 w-full bg-[#111827]/5 rounded-full mb-4 overflow-hidden">
              <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '45%' }}
                 transition={{ duration: 1, delay: 0.5 }}
                 className="absolute left-0 top-0 h-full bg-primary rounded-full shadow-[0_0_15px_rgba(232,93,26,0.3)]"
              ></motion.div>
            </div>
            <p className="text-sm font-black text-[#111827] relative">
               {language === "ar" ? `تحتاج إلى ${readTimeMins} دقائق للقراءة العميقة` : `Requires ${readTimeMins} mins of deep reading`}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
        {/* Main Transcript Feed */}
        <div className="col-span-1 lg:col-span-12 space-y-8">
          {paragraphs.length === 0 && (
            <div className="text-center p-20 text-muted-foreground bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">{t.noTranscript}</div>
          )}
          {paragraphs.map((p, idx) => {
            const { timeStr: realTimeStr, body: paraBody } = parseTimestamp(p);
            // Real [MM:SS] markers only exist for spoken media (YouTube/audio/video).
            // For documents there is no timeline, so show a clean section number instead
            // of a fabricated timestamp.
            const sectionLabel = String(idx + 1).padStart(2, "0");
            const timeStr = realTimeStr || sectionLabel;
            const processedText = processMath(paraBody);

            // Highlight certain paragraphs based on length and position
            const isHighlighted = idx > 0 && idx % 7 === 2 && p.length > 80;

            // Check if this chunk has associated images
            const chunkImageData = chunkImages[idx];
            const hasChunkImages = !!chunkImageData && chunkImageData.urls.length > 0;

            const imageSlot = Math.floor(idx / IMG_EVERY_N);
            const shouldShowImage = (safeImages.length > 0 && idx > 0 && idx % IMG_EVERY_N === 0 && imageSlot <= safeImages.length - 1) || hasChunkImages;
            const image = shouldShowImage && !hasChunkImages ? safeImages[imageSlot - 1] || null : null;


            return (
              <div key={idx} className="space-y-6 group/p">
                <div className={cn(
                  "relative transition-all duration-700",
                   isHighlighted ? "bg-[#FFF9F5] p-6 md:p-8 rounded-[2rem] shadow-[0_20px_40px_rgba(240,90,34,0.05)] border-2 border-primary/10" : "px-4 py-2"
                )}>
                  {isHighlighted && <div className={`absolute ${language === "ar" ? "-right-3" : "-left-3"} top-14 bottom-14 w-1.5 bg-primary rounded-full shadow-[0_0_25px_rgba(232,93,26,0.5)]`}></div>}
                  
                  <div className={`flex items-start gap-8 md:gap-16`}>
                    {/* Timestamp / Page label column */}
                    <div className="w-16 shrink-0 pt-2 text-center opacity-60 group-hover/p:opacity-100 transition-opacity">
                      <span className={cn(
                        "text-xs font-black font-headline tracking-[0.2em] transition-all",
                        isHighlighted ? "text-primary" : "text-[#111827]/40"
                      )}>{timeStr}</span>
                    </div>
                    
                    {/* Text content */}
                    <div className={cn("flex-1", contentTextAlign === "right" ? "text-right" : "text-left")} dir={contentDir}>
                      {isHighlighted && <div className={`flex items-center gap-2 mb-6`}>
                         <div className="h-px bg-primary/20 flex-1"></div>
                         <h4 className="text-[9px] font-black text-primary uppercase tracking-[0.3em] italic">{language === "ar" ? "رؤية مركزية" : "Curator Insight"}</h4>
                      </div>}
                      
                      <div className={cn(
                        "text-base md:text-lg leading-[1.7] font-body tracking-tight transition-colors duration-500",
                        isHighlighted ? "text-[#111827] font-bold" : "text-[#111827] font-medium"
                      )}>
                        <ReactMarkdown
                          remarkPlugins={[remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            p: ({ children }) => <span className="block mb-2">{children}</span>,
                            strong: ({ children }) => <strong className="font-extrabold text-primary bg-[#feecdc]/40 px-1.5 rounded-sm">{children}</strong>,
                            em: ({ children }) => <em className="italic text-primary opacity-90 border-b border-primary/20">{children}</em>
                          }}
                        >
                          {processedText}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Render image removed per user request */}

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
