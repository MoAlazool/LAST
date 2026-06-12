import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Maximize2, 
  Search, 
  Copy,
  Upload,
  ChevronLeft,
  ChevronRight,
  User,
  MoreVertical,
  Image as ImageIcon,
  BarChart3,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TECH_DICTIONARY: Record<string, { ar: string, en: string }> = {
    // Data & OS
    "batch": {
        ar: "المعالجة بالدفعات (Batch): أسلوب تنفيذي للبرامج يتم فيه تشغيل الكميات الضخمة من البيانات مجدداً دون تدخل يدوي.",
        en: "Batch Processing: Executing a series of programs or bulk data on a computer without manual intervention."
    },
    "sql": {
        ar: "لغة الاستعلام المهيكلة (SQL): لغة برمجية قياسية لإدارة إنشاء وقراءة قواعد البيانات العلائقية بسرعة.",
        en: "Structured Query Language (SQL): A standard programming language for managing and querying relational databases."
    },
    "spark": {
        ar: "أباتشي سبارك (Spark): محرك معالجة بيانات سريع جداً ومفتوح المصدر للتعامل مع البيانات الضخمة.",
        en: "Apache Spark: A lightning-fast unified analytics engine for large-scale data processing and machine learning."
    },
    "impala": {
        ar: "إمبالا (Impala): محرك استعلام مفتوح المصدر (SQL) يوفر استعلامات فورية وسريعة جداً على بيانات Hadoop.",
        en: "Apache Impala: An open-source, native analytic database for Apache Hadoop providing fast SQL queries."
    },
    "search": {
        ar: "نظام البحث (Search): نظام فهرسي متقدم يسهل العثور على المعلومات عبر كميات هائلة من البيانات المعقدة.",
        en: "Search System: Advanced full-text indexing mechanics that make locating information across massive data sets highly efficient."
    },
    "solr": {
        ar: "أباتشي سولر (Solr): منصة بحث متطورة وسريعة تبحث في النصوص الكاملة وتوفر استعلاماً فائق السرعة.",
        en: "Apache Solr: A highly reliable, scalable, open-source enterprise search platform that provides powerful full-text search."
    },
    "stream": {
        ar: "معالجة التدفق (Stream): أسلوب للتعامل مع تدفق البيانات الكبيرة بشكل فوري ومستمر.",
        en: "Stream Processing: A big data technology for handling continuous, real-time flows of ingested data instantly."
    },
    "kafka": {
        ar: "أباتشي كافكا (Kafka): منصة بث بيانات موزعة تتيح بناء أنظمة بيانات حية بالاعتماد على سرعة النقل العالية.",
        en: "Apache Kafka: A distributed event streaming platform used for high-performance data pipelines and streaming analytics."
    },
    "sdk": {
        ar: "حزمة تطوير البرمجيات (SDK): مجموعة أدوات ومكتبات تساعد المطورين في بناء تطبيقات مخصصة وربطها بالنظام.",
        en: "Software Development Kit (SDK): A collection of software tools and libraries that helps developers build custom applications."
    },
    "kite": {
        ar: "واجهة كايت (Kite): مجموعة من المكتبات والأدوات التي تسهل بناء أنظمة البيانات فوق بيئة Hadoop.",
        en: "Kite SDK: A set of high-level libraries, tools, and examples that makes building data systems on Hadoop easier."
    },
    "yarn": {
        ar: "مدير الموارد (YARN): التكنولوجيا الأساسية التي تتيح توزيع وإدارة أعباء العمل عبر أجهزة وخوادم Hadoop.",
        en: "Yet Another Resource Negotiator (YARN): The core cluster resource management technology in the Apache Hadoop ecosystem."
    },
    "security": {
        ar: "الأمان (Security): أنظمة التشفير وحماية البيانات والمصادقة لمنع الوصول غير المصرح به للبيانات الحساسة.",
        en: "Security: Encryption, authentication, and authorization protocols to protect sensitive big data from unauthorized access."
    },
    "recordservice": {
        ar: "خدمة السجلات (RecordService): طبقة أمنية موحدة تفرض سياسات الوصول الدقيق للبيانات في بيئة Hadoop.",
        en: "RecordService: A unified security layer that enforces fine-grained role-based access policies across Hadoop data environments."
    },
    "hdfs": {
        ar: "نظام ملفات هادوب (HDFS): نظام يخزن البيانات الضخمة موزعة عبر أجهزة متعددة لضمان استمراريتها في حال تلف الأجهزة.",
        en: "Hadoop Distributed File System (HDFS): A highly fault-tolerant distributed file system designed to scale out to handle huge data."
    },
    "kudu": {
        ar: "أباتشي كودو (Kudu): نظام تخزين جدولي مفتوح للتطبيقات التي تتطلب تحليلات سريعة وتحديثات في بيئة Hadoop.",
        en: "Apache Kudu: An open-source columnar storage engine built for fast analytics on fast data in the Hadoop environment."
    },
    "hbase": {
        ar: "إتش بيس (HBase): قاعدة بيانات واسعة النطاق (NoSQL) مبنية فوق HDFS تتيح قراءة وكتابة سريعة للبيانات الكبيرة.",
        en: "Apache HBase: A distributed, scalable, big data NoSQL database logically built on top of HDFS for real-time reads/writes."
    },
    "sqoop": {
        ar: "أباتشي سكوب (Sqoop): أداة نقل بيانات صُممت خصيصاً لنقل البيانات بكفاءة بين Hadoop وقواعد البيانات العلائقية العادية.",
        en: "Apache Sqoop: A reliable tool designed for efficiently transferring bulk data between Apache Hadoop and structured relational databases."
    },
    "flume": {
        ar: "أباتشي فلوم (Flume): خدمة موزعة وموثوقة لجمع وتجميع ونقل كميات هائلة من مسارات بيانات السجلات (Logs) بكفاءة.",
        en: "Apache Flume: A distributed and reliable service for efficiently collecting, aggregating, and moving massive amounts of log data."
    },
    // Biology
    "mitochondrion": {
        ar: "ميتوكندريا: عضي خلوي يوصف بأنه 'مصنع طاقة الخلية' حيث يتم إنتاج الكيماويات الغنية بالطاقة.",
        en: "Mitochondrion: A cellular organelle universally dubbed the 'powerhouse of the cell' where energy-rich ATP is produced."
    },
    "atp": {
        ar: "عملة الطاقة في الخلية (ATP): مركب كيميائي يخزن وينقل الطاقة الضرورية للعمليات الحيوية.",
        en: "Adenosine Triphosphate (ATP): The primary energy currency of the cell, directly storing and transferring energy for biological processes."
    },
    "cristae": {
        ar: "أعراف الميتوكندريا (Cristae): طيات داخلية تزيد من مساحة السطح لتعزيز معدل إنتاج الطاقة.",
        en: "Cristae: The internal folds in the inner mitochondrial membrane that drastically increase surface area for energy production."
    },
    "matrix": {
        ar: "المصفوفة (Matrix): سائل داخل الميتوكندريا يحتوي على الإنزيمات الضرورية في دورة توليد الطاقة.",
        en: "Mitochondrial Matrix: The inner fluid containing crucial enzymes vital for the Krebs cycle and ATP generation."
    }
};

const getTermContext = (term: string, imgData: any, lang: string) => {
    // 1. Check Smart Dictionary first for genuine explanation
    const dictDef = TECH_DICTIONARY[term.toLowerCase().trim()];
    if (dictDef) return lang === "ar" ? dictDef.ar : dictDef.en;

    // 2. Collect all possible text sources in the image data to search for the term
    const searchSpace = [
        ...(imgData.bullets || []),
        imgData.descriptionAr || "",
        imgData.parsedDesc || ""
    ].filter(Boolean);

    for (const text of searchSpace) {
        // Remove any JSON remnants if they sneak in
        const cleanText = text.replace(/[{}[\]]/g, '').replace(/\\"/g, '"');
        
        // Split by common sentence delimiters
        const sentences = cleanText.split(/(?<=[.!?؟\n])\s+/);
        const found = sentences.find((s: string) => s.toLowerCase().includes(term.toLowerCase()));
        if (found) {
            let result = found.trim();
            // Clean up bullet characters
            result = result.replace(/^[-•*]\s*/, "");
            return result.length > 150 ? result.substring(0, 150).trim() + "..." : result;
        }
    }

    // Dynamic explicit fallback if the term is truly an isolated keyword
    return lang === "ar" 
        ? `يُعد المصطلح "${term}" جزءاً تقنياً أو مفهوماً محورياً لفهم المعمارية الموضحة في الصورة.` 
        : `"${term}" acts as a core technical component essential to understanding this architecture.`;
};

interface ImagesViewProps {
    lectureId: string;
    images: { url: string; description: string; descriptionAr?: string; analyzed?: boolean; title?: string; type?: string; relevance?: string }[];
    onAnalysisRequested?: (imgUrl: string) => void;
}

export function ImagesView({ lectureId, images, onAnalysisRequested }: ImagesViewProps) {
    const { language } = useLanguage();
    const { toast } = useToast();
    const [selectedImage, setSelectedImage] = useState<any | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 3; // MAX 3 cards per page as requested

    const t = {
        title: language === "ar" ? "المكتبة البصرية" : "Extracted Visuals",
        subtitle: language === "ar" ? "استخراج الصور المدعوم بالذكاء الاصطناعي والتحليل السياقي من جلساتك الأكاديمية." : "AI-powered image extraction and contextual analysis from your academic sessions.",
        searchPlaceholder: language === "ar" ? "البحث في المكتبة البصرية..." : "Search visual library...",
        viewFull: language === "ar" ? "View Full Size" : "View Full Size",
        copy: language === "ar" ? "Copy Explanation" : "Copy Explanation",
        curatorMode: language === "ar" ? "Curator Mode" : "Curator Mode",
        academicLuminary: language === "ar" ? "المنسق الأكاديمي" : "Academic Luminary",
        imageGallery: language === "ar" ? "معرض الصور" : "Image Gallery",
        uploadLecture: language === "ar" ? "رفع المحاضرة" : "Upload Lecture",
        advancedAnalysis: language === "ar" ? "تحليل متقدم" : "ADVANCED ANALYSIS",
        copied: language === "ar" ? "تم النسخ" : "Copied to clipboard",
        copiedDesc: language === "ar" ? "تم نسخ الشرح بنجاح." : "Explanation copied successfully.",
    };

    const isRTL = language === "ar";

    // First parse the raw JSON descriptions safely
    const parsedImages = useMemo(() => {
        return images.map(img => {
            let title = img.title;
            let type = img.type || "Visual";
            let desc = img.description;
            let bullets: string[] = [];
            let keyTerms: string[] = [];
            // Extract from JSON string if necessary
            try {
                if (img.description && img.description.trim().startsWith('{')) {
                    const parsed = JSON.parse(img.description);
                    title = parsed.title || title;
                    desc = parsed.description || desc;
                    type = parsed.type || type;
                    bullets = parsed.bullets || [];
                    keyTerms = parsed.keyTerms || [];
                }
            } catch (e) {
                // Ignore parse errors, keep raw string
            }
            return {
                ...img,
                parsedTitle: title || "Visual Concept",
                parsedDesc: desc,
                parsedType: type,
                bullets,
                keyTerms
            };
        });
    }, [images]);

    const filteredImages = useMemo(() => {
        let result = parsedImages.filter((img) => 
            img.relevance !== "garbage" && 
            img.parsedDesc !== "Decorative/Low-Value slide" &&
            !img.parsedDesc?.toLowerCase().includes("upload lecture")
        );
        if (searchQuery) {
            result = result.filter(img => {
                const text = `${img.parsedTitle} ${img.parsedDesc} ${img.descriptionAr || ""}`.toLowerCase();
                return text.includes(searchQuery.toLowerCase());
            });
        }
        return result;
    }, [parsedImages, searchQuery]);

    // Pagination
    const indexOfLastCard = currentPage * cardsPerPage;
    const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    const currentImages = filteredImages.slice(indexOfFirstCard, indexOfLastCard);
    const totalPages = Math.ceil(filteredImages.length / cardsPerPage);

    const visiblePageNumbers = useMemo(() => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        if (currentPage <= 4) {
            return [1, 2, 3, 4, 5, "...", totalPages] as (number | string)[];
        }

        if (currentPage >= totalPages - 3) {
            return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages] as (number | string)[];
        }

        return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages] as (number | string)[];
    }, [currentPage, totalPages]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t.copied,
            description: t.copiedDesc,
        });
    };

    return (
        <div className="flex bg-[#F8FAFC] min-h-[90vh] rounded-[2rem] overflow-hidden border border-slate-200/60 shadow-sm font-body" dir={isRTL ? "rtl" : "ltr"}>
            {/* SIDEBAR */}
            <aside className="w-64 bg-white border-e border-slate-100 flex flex-col py-8 px-6 space-y-10 shrink-0">
                <div className="flex items-center gap-4 px-2">
                   <div className="w-10 h-10 rounded-full bg-[#bd4816] flex items-center justify-center text-white shadow-md">
                      <Sparkles className="w-5 h-5 fill-white" />
                   </div>
                   <div>
                      <h3 className="font-bold text-[13px] text-slate-800 leading-tight">{t.academicLuminary}</h3>
                      <p className="text-[11px] text-slate-500 font-medium">{t.curatorMode}</p>
                   </div>
                </div>

                <nav className="space-y-1 mt-6">
                   <button
                     className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all bg-white text-[#bd4816] shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100"
                   >
                     <ImageIcon className="w-4 h-4 text-[#bd4816]" />
                     {t.imageGallery}
                   </button>
                </nav>

                <div className="pt-8 mt-auto flex justify-center">
                   <button 
                     className="w-full py-3.5 bg-[#be4816] text-white rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-900/20 hover:brightness-110 active:scale-95 transition-all"
                   >
                      <Upload className="w-4 h-4" />
                      {t.uploadLecture}
                   </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* TOP BAR */}
                <header className="flex items-center justify-between px-10 py-6 bg-transparent z-10">
                   <div className="flex items-center gap-6 flex-1 max-w-lg">
                      <h1 className="text-lg font-bold text-slate-900 hidden md:block tracking-tight">Lecture Mate</h1>
                      <div className="relative flex-1 group">
                         <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                            <Search className="w-4 h-4" />
                         </span>
                         <input 
                           type="text" 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           placeholder={t.searchPlaceholder}
                           className="w-full bg-white/60 border border-slate-200/60 rounded-full py-2.5 pl-10 pr-6 text-[13px] font-medium focus:ring-2 focus:ring-[#bd4816]/20 placeholder:text-slate-400 transition-all outline-none"
                         />
                      </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 cursor-pointer bg-white">
                         <User className="w-4 h-4" />
                      </div>
                   </div>
                </header>

                <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
                    {/* TITLE AREA */}
                    <div className="mb-10 space-y-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#1a202c] tracking-tight">
                            {t.title}
                        </h2>
                        <p className="text-[#4a5568] font-medium text-[15px]">
                            {t.subtitle}
                        </p>
                    </div>

                    {/* IMAGE GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl">
                        {currentImages.map((img, idx) => {
                            // The 3rd card on the page will span 2 columns if there are 3 cards, exactly like the reference screenshot.
                            const isAdvanced = idx === 2;
                            
                            return (
                                <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    className={cn(
                                        "bg-white rounded-[2rem] p-6 flex flex-col transition-all shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100",
                                        isAdvanced && "md:col-span-2 md:flex-row gap-8 items-stretch"
                                    )}
                                >
                                    {/* Image Container */}
                                    <div className={cn(
                                        "relative rounded-[1.5rem] overflow-hidden bg-slate-900 shrink-0",
                                        isAdvanced ? "w-full md:w-[45%] lg:w-[40%]" : "aspect-[16/10] w-full mb-6"
                                    )}>
                                        <img 
                                            src={img.url} 
                                            alt={img.parsedTitle}
                                            className="w-full h-full object-cover opacity-95 transition-transform duration-700 hover:scale-105"
                                        />
                                    </div>

                                    {/* Content Body */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="space-y-4">
                                            {isAdvanced && (
                                                <div className="flex items-center gap-2 mb-1 text-[#bd4816]">
                                                    <BarChart3 className="w-3.5 h-3.5 fill-current" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">{t.advancedAnalysis}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-start justify-between gap-4">
                                                <h3 className="text-xl font-bold text-slate-900 leading-snug">
                                                    {img.parsedTitle}
                                                </h3>
                                                {!isAdvanced && img.parsedType && (
                                                    <span className="bg-[#fdf2eb] text-[#be4816] px-2.5 py-1 rounded-[6px] text-[9px] font-bold uppercase tracking-wider shrink-0 mt-1">
                                                        {img.parsedType}
                                                    </span>
                                                )}
                                            </div>

                                            <div className={cn(
                                                "text-[14px] text-slate-600 leading-[1.65] font-medium",
                                                isRTL && "text-right",
                                                !isAdvanced && "line-clamp-6"
                                            )} dir={isRTL ? "rtl" : "ltr"}>
                                                {img.descriptionAr && isRTL ? (
                                                    <div className="space-y-3">
                                                       <p>{img.descriptionAr}</p>
                                                       <p className="text-[11px] italic text-slate-400 font-semibold border-l sm:border-r border-slate-200 px-2">
                                                          (Translation: {img.parsedDesc.length > 80 ? img.parsedDesc.substring(0, 80) + '...' : img.parsedDesc})
                                                       </p>
                                                    </div>
                                                ) : (
                                                    <p>{img.parsedDesc}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="pt-6 mt-4 flex items-center gap-3">
                                           <button 
                                              onClick={() => setSelectedImage(img)}
                                              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#be4816] text-white rounded-full font-bold text-[13px] hover:bg-[#a63e12] transition-colors"
                                              style={{ flexShrink: 0 }}
                                           >
                                              <Search className="w-3.5 h-3.5" />
                                              <span className="whitespace-nowrap">{t.viewFull}</span>
                                           </button>
                                           <button 
                                              onClick={() => handleCopy(img.descriptionAr || img.parsedDesc)}
                                              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent text-[#be4816] hover:bg-orange-50 rounded-full font-bold text-[13px] transition-colors"
                                              style={{ flexShrink: 0 }}
                                           >
                                              <Copy className="w-3.5 h-3.5" />
                                              <span className="whitespace-nowrap">{t.copy}</span>
                                           </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* PAGINATION */}
                    {totalPages > 1 && (
                        <div className="mt-14 flex items-center justify-center gap-4 pb-8 max-w-5xl">
                           <button 
                             onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                             disabled={currentPage === 1}
                             className="text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all"
                           >
                              <ChevronLeft className="w-4 h-4" />
                           </button>
                           
                           <div className="flex items-center gap-3">
                               {visiblePageNumbers.map((page, i) => (
                                  typeof page === "number" ? (
                                    <button 
                                      key={`page-${page}-${i}`}
                                      onClick={() => setCurrentPage(page)}
                                      className={cn(
                                         "text-sm font-semibold transition-all",
                                         currentPage === page ? "text-[#be4816] font-bold" : "text-slate-400 hover:text-slate-700"
                                      )}
                                    >
                                       {page}
                                    </button>
                                  ) : (
                                    <span key={`dots-${i}`} className="text-slate-300 text-sm select-none">...</span>
                                  )
                               ))}
                           </div>

                           <button 
                             onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                             disabled={currentPage === totalPages}
                             className="text-slate-400 hover:text-slate-900 disabled:opacity-30 transition-all"
                           >
                              <ChevronRight className="w-4 h-4" />
                           </button>
                        </div>
                    )}

                    {filteredImages.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                               <ImageIcon className="w-8 h-8" />
                            </div>
                            <p className="text-lg font-bold text-slate-400">No matching visuals found</p>
                        </div>
                    )}
                </div>
            </main>

            {/* LIGHTBOX / DETAILED MODAL */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-[#111827]/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 lg:p-12 overflow-y-auto custom-scrollbar"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white max-w-4xl w-full rounded-[2rem] overflow-hidden flex flex-col shadow-2xl relative my-auto cursor-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                               onClick={() => setSelectedImage(null)}
                               className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/60 hover:bg-[#be4816] text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                            >
                               <span className="material-symbols-outlined font-bold">close</span>
                            </button>
                            
                            {/* Image Section */}
                            <div className="w-full bg-[#f8fafc] flex items-center justify-center p-6 border-b border-slate-100 max-h-[55vh] overflow-hidden relative">
                                <img
                                    src={selectedImage.url}
                                    alt={selectedImage.parsedTitle || "Expanded Visual"}
                                    className="max-w-full max-h-[50vh] object-contain rounded-xl drop-shadow-sm"
                                />
                            </div>
                            
                            {/* Detailed Explanation Section */}
                            <div className="p-8 md:p-10 bg-white">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-[#be4816]">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                                        {selectedImage.parsedTitle}
                                    </h2>
                                </div>
                                
                                <div className="space-y-8">
                                    {/* Main Text Content */}
                                    <div className={cn("text-[16px] md:text-lg text-slate-700 leading-relaxed font-medium", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                       {selectedImage.descriptionAr && isRTL ? (
                                           <div className="space-y-6">
                                               <p className="whitespace-pre-wrap">{selectedImage.descriptionAr}</p>
                                               <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-[13px] italic text-slate-500 font-medium">
                                                  <strong className="text-slate-700 not-italic block mb-2 font-bold uppercase tracking-widest text-[10px]">English Reference</strong>
                                                  {selectedImage.parsedDesc}
                                               </div>
                                           </div>
                                       ) : (
                                           <p className="whitespace-pre-wrap">{selectedImage.parsedDesc}</p>
                                       )}
                                    </div>
                                    
                                    {/* Detailed Bullets (if available) */}
                                    {selectedImage.bullets && selectedImage.bullets.length > 0 && (
                                        <div className={cn("space-y-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">{language === 'ar' ? "النقاط الرئيسية" : "Key Takeaways"}</h4>
                                            <ul className="space-y-3">
                                                {selectedImage.bullets.map((bullet: string, i: number) => (
                                                    <li key={i} className="flex items-start gap-3">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#be4816] mt-2.5 shrink-0"></span>
                                                        <span className="text-base text-slate-600 font-medium">{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Key Terms */}
                                    {selectedImage.keyTerms && selectedImage.keyTerms.length > 0 && (
                                        <div className={cn("pt-4", isRTL && "text-right")} dir={isRTL ? "rtl" : "ltr"}>
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{language === 'ar' ? "المصطلحات العلمية (Terms)" : "Extracted Terminology"}</h4>
                                            <div className="flex flex-wrap gap-2.5">
                                                <TooltipProvider delayDuration={150}>
                                                    {selectedImage.keyTerms.map((termInfo: string, i: number) => {
                                                        const [termName, ...termDescArr] = termInfo.split(':');
                                                        const actualTerm = termName.trim();
                                                        const explicitDesc = termDescArr.join(':').trim();
                                                        // Search the entire selectedImage object for the term context
                                                        const explanation = explicitDesc || getTermContext(actualTerm, selectedImage, language);
                                                        
                                                        return (
                                                            <Tooltip key={i}>
                                                                <TooltipTrigger asChild>
                                                                    <span className="bg-[#fdf2eb] text-[#be4816] px-4 py-2 rounded-xl text-xs font-bold block border border-[#be4816]/10 hover:bg-[#be4816] hover:text-white transition-all shadow-sm cursor-help">
                                                                        {actualTerm}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent 
                                                                    side="top" 
                                                                    className="z-[200] w-56 p-4 bg-[#111827] text-white text-[12px] font-medium leading-relaxed rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center border-none"
                                                                >
                                                                    <span className="block text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1.5 line-clamp-1">{language === 'ar' ? 'تعريف مُستخرَج' : 'Contextual Definition'}</span>
                                                                    {explanation}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </TooltipProvider>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                                    <button 
                                       onClick={() => handleCopy(selectedImage.descriptionAr || selectedImage.parsedDesc)}
                                       className="flex items-center gap-2 px-6 py-3 bg-[#be4816] text-white hover:bg-[#a63e12] rounded-full font-bold text-sm transition-colors shadow-lg shadow-orange-900/10"
                                    >
                                       <Copy className="w-4 h-4" />
                                       {t.copy}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
