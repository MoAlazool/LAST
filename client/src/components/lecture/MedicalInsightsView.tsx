import { useState, useMemo } from "react";
import { MedicalInsights, MedicalTerm, DrugCard, ClinicalCalculation, ClinicalProcedure } from "@/lib/mockData";
import {
    Search, Download, Stethoscope, Pill, Calculator, ListChecks, BookText,
    AlertTriangle, Activity, Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { KaTeXMath } from "./MathRenderer";
import { MedicalVisual, MedicalImageView, sanitizeMermaid } from "./MedicalVisual";
import { Molecule3D, Anatomy3D } from "./Molecule3D";

interface MedicalInsightsViewProps {
    medical: MedicalInsights;
    lectureTitle?: string;
}

type SectionKey = "terms" | "drugs" | "calculations" | "procedures";

const PRIMARY = "#F05A22";

export function MedicalInsightsView({ medical, lectureTitle = "Medical Lecture" }: MedicalInsightsViewProps) {
    const { toast } = useToast();
    const { language } = useLanguage();
    const isAr = language === "ar";

    const terms = medical?.terms || [];
    const drugs = medical?.drugs || [];
    const calculations = medical?.calculations || [];
    const procedures = medical?.procedures || [];

    const allSections: { key: SectionKey; label: string; icon: React.ReactNode; count: number }[] = [
        { key: "terms", label: isAr ? "المصطلحات" : "Terms", icon: <BookText className="w-4 h-4" />, count: terms.length },
        { key: "drugs", label: isAr ? "الأدوية" : "Drugs", icon: <Pill className="w-4 h-4" />, count: drugs.length },
        { key: "calculations", label: isAr ? "الحسابات السريرية" : "Calculations", icon: <Calculator className="w-4 h-4" />, count: calculations.length },
        { key: "procedures", label: isAr ? "الإجراءات والحالات" : "Procedures", icon: <ListChecks className="w-4 h-4" />, count: procedures.length },
    ];
    const sections = allSections.filter(s => s.count > 0);

    const [activeSection, setActiveSection] = useState<SectionKey>(sections[0]?.key || "terms");
    const [searchQuery, setSearchQuery] = useState("");

    const t = {
        title: isAr ? "الرؤى الطبية" : "Medical Insights",
        subtitle: isAr ? "مستخرجة من" : "Extracted from",
        emptyTitle: isAr ? "لا توجد رؤى طبية" : "No Medical Insights",
        emptyDesc: isAr ? "لم يتم العثور على محتوى طبي في هذه المحاضرة." : "No medical content was found in this lecture.",
        searchPlaceholder: isAr ? "البحث..." : "Search...",
        noResults: isAr ? "لا توجد نتائج مطابقة لبحثك." : "Nothing matches your search.",
        copied: isAr ? "تم النسخ" : "Copied",
    };

    const matches = (haystack: string) =>
        !searchQuery || haystack.toLowerCase().includes(searchQuery.toLowerCase());

    const filteredTerms = useMemo(
        () => terms.filter(x => matches(`${x.name || ""} ${x.definition || ""} ${x.clinicalContext || ""} ${x.category || ""}`)),
        [terms, searchQuery]);
    const filteredDrugs = useMemo(
        () => drugs.filter(x => matches(`${x.name || ""} ${x.drugClass || ""} ${x.mechanism || ""} ${(x.indications || []).join(" ")}`)),
        [drugs, searchQuery]);
    const filteredCalcs = useMemo(
        () => calculations.filter(x => matches(`${x.name || ""} ${x.description || ""} ${x.category || ""}`)),
        [calculations, searchQuery]);
    const filteredProcs = useMemo(
        () => procedures.filter(x => matches(`${x.name || ""} ${(x.steps || []).join(" ")} ${x.indication || ""}`)),
        [procedures, searchQuery]);

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: t.copied, duration: 2000 });
    };

    const handleExportPDF = async () => {
        try {
            const dir = isAr ? "rtl" : "ltr";
            toast({ title: isAr ? "جاري تحضير ملف PDF..." : "Preparing PDF...", description: isAr ? "يرجى الانتظار قليلاً" : "Please wait a moment" });

            const { jsPDF } = await import("jspdf");
            const html2canvas = (await import("html2canvas")).default;
            const katex = (await import("katex")).default;
            const { sanitizeLatex } = await import("./MathRenderer");

            const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const list = (arr?: string[]) => (arr && arr.length ? `<ul style="margin:6px 0 0 0;padding-${isAr ? "right" : "left"}:18px;">${arr.map(i => `<li>${esc(i)}</li>`).join("")}</ul>` : "");

            // Pre-render mermaid visuals to SVG (async) so the synchronous card builders can embed them.
            const mermaidCache = new Map<string, string>();
            try {
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
                let mid = 0;
                const allItems: any[] = [...terms, ...drugs, ...calculations, ...procedures];
                for (const it of allItems) {
                    const v = it.visual;
                    if (v?.type === "mermaid" && v.code) {
                        try {
                            const { svg } = await mermaid.render(`pdf-mmd-${mid++}`, sanitizeMermaid(v.code));
                            mermaidCache.set(v.code, svg);
                        } catch { /* skip bad diagram */ }
                    }
                }
            } catch { /* mermaid unavailable -> skip diagrams */ }

            const visualHtml = (v?: { type: string; code: string; caption?: string }) => {
                if (!v?.code) return "";
                const inner = v.type === "mermaid" ? (mermaidCache.get(v.code) || "") : v.code;
                if (!inner) return v.caption ? `<p class="muted" style="font-style:italic;text-align:center;">${esc(v.caption)}</p>` : "";
                return `<div class="visual">${inner}${v.caption ? `<div class="vcap">${esc(v.caption)}</div>` : ""}</div>`;
            };

            const imageHtml = (img?: { url: string; title?: string; source?: string }) => {
                if (!img?.url) return "";
                return `<div class="visual"><img src="${esc(img.url)}" crossorigin="anonymous" style="max-width:100%;max-height:260px;object-fit:contain;" />${img.title ? `<div class="vcap">${esc(img.title)}${img.source ? ` — ${esc(img.source)}` : ""}</div>` : ""}</div>`;
            };

            const sectionHeader = (label: string) => `<h2 style="color:${PRIMARY};border-bottom:2px solid ${PRIMARY}33;padding-bottom:6px;margin:28px 0 14px;">${label}</h2>`;

            const termsHtml = terms.length ? sectionHeader(isAr ? "المصطلحات الطبية" : "Medical Terms") + terms.map(x => `
                <div class="card"><span class="tag">${esc(x.category || x.type || "")}</span><h3>${esc(x.name)}</h3><p>${esc(x.definition)}</p>${x.clinicalContext ? `<p class="muted"><b>${isAr ? "السياق السريري:" : "Clinical context:"}</b> ${esc(x.clinicalContext)}</p>` : ""}${imageHtml(x.image)}${visualHtml(x.visual)}</div>`).join("") : "";

            const drugsHtml = drugs.length ? sectionHeader(isAr ? "الأدوية" : "Drugs") + drugs.map(x => `
                <div class="card"><span class="tag">${esc(x.drugClass)}</span><h3>${esc(x.name)}</h3><p><b>${isAr ? "آلية العمل:" : "Mechanism:"}</b> ${esc(x.mechanism)}</p>${x.dosage ? `<p><b>${isAr ? "الجرعة:" : "Dosage:"}</b> ${esc(x.dosage)}</p>` : ""}<p><b>${isAr ? "دواعي الاستعمال:" : "Indications:"}</b></p>${list(x.indications)}<p><b>${isAr ? "الآثار الجانبية:" : "Side effects:"}</b></p>${list(x.sideEffects)}${x.warnings ? `<p class="muted"><b>${isAr ? "تحذيرات:" : "Warnings:"}</b> ${esc(x.warnings)}</p>` : ""}${imageHtml(x.image)}${visualHtml(x.visual)}</div>`).join("") : "";

            const calcsHtml = calculations.length ? sectionHeader(isAr ? "الحسابات السريرية" : "Clinical Calculations") + calculations.map(x => {
                let math = esc(x.formula);
                try { math = katex.renderToString(sanitizeLatex(x.formula || ""), { displayMode: true, throwOnError: false }); } catch { }
                return `<div class="card"><span class="tag">${esc(x.category || "")}</span><h3>${esc(x.name)}</h3><div class="math">${math}</div><p>${esc(x.description)}</p>${x.normalRange ? `<p class="muted"><b>${isAr ? "المعدل الطبيعي:" : "Normal range:"}</b> ${esc(x.normalRange)}</p>` : ""}${imageHtml(x.image)}${visualHtml(x.visual)}</div>`;
            }).join("") : "";

            const procsHtml = procedures.length ? sectionHeader(isAr ? "الإجراءات والحالات" : "Procedures & Cases") + procedures.map(x => `
                <div class="card"><h3>${esc(x.name)}</h3>${x.indication ? `<p class="muted"><b>${isAr ? "دواعي:" : "Indication:"}</b> ${esc(x.indication)}</p>` : ""}<ol style="margin:6px 0 0 0;padding-${isAr ? "right" : "left"}:18px;">${(x.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>${x.notes ? `<p class="muted"><b>${isAr ? "ملاحظات:" : "Notes:"}</b> ${esc(x.notes)}</p>` : ""}${imageHtml(x.image)}${visualHtml(x.visual)}</div>`).join("") : "";

            const htmlContent = `
                <html><head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                <style>
                    body{font-family:'Inter','IBM Plex Sans Arabic',sans-serif;margin:0;padding:40px;background:#fff;direction:${dir};color:#0f172a;}
                    .header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${PRIMARY};}
                    .card{page-break-inside:avoid;margin-bottom:18px;padding:18px 20px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;}
                    .card h3{font-size:18px;margin:6px 0 10px;color:#0f172a;}
                    .card p{font-size:13px;color:#334155;line-height:1.6;margin:4px 0;}
                    .card .muted{color:#64748b;}
                    .card .math{padding:14px;background:#fff;border:1px solid #f1f5f9;border-radius:10px;text-align:center;margin:8px 0;font-size:20px;}
                    .tag{display:inline-block;padding:3px 9px;background:${PRIMARY}15;color:${PRIMARY};border-radius:6px;font-size:10px;font-weight:800;text-transform:uppercase;}
                    .visual{margin-top:12px;padding:12px;background:#fff;border:1px solid #f1f5f9;border-radius:10px;text-align:center;}
                    .visual svg{max-width:100%;height:auto;}
                    .vcap{font-size:11px;color:#64748b;font-style:italic;margin-top:8px;}
                </style></head>
                <body>
                    <div class="header"><h1 style="color:${PRIMARY};margin:0;font-size:30px;">${t.title}</h1>
                    <p style="color:#64748b;margin:8px 0 0;">${esc(lectureTitle)} • ${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</p></div>
                    ${termsHtml}${drugsHtml}${calcsHtml}${procsHtml}
                </body></html>`;

            const container = document.createElement("div");
            container.innerHTML = htmlContent;
            container.style.position = "absolute";
            container.style.left = "-9999px";
            container.style.width = "210mm";
            document.body.appendChild(container);
            await new Promise(resolve => setTimeout(resolve, 1500));

            const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
            document.body.removeChild(container);

            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const pdf = new jsPDF("p", "mm", "a4");
            const pageWidth = 210, pageHeight = 297;
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            let heightLeft = imgHeight, position = 0;
            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save(`${lectureTitle.replace(/[^a-z0-9]/gi, '_')}_medical.pdf`);
            toast({ title: isAr ? "تمت عملية التصدير بنجاح" : "Export Successful" });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast({ title: isAr ? "خطأ في التصدير" : "Export Failed", variant: "destructive" });
        }
    };

    const totalCount = terms.length + drugs.length + calculations.length + procedures.length;

    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Stethoscope className="w-10 h-10 text-primary" />
                </div>
                <div className="max-w-md space-y-2">
                    <h3 className="text-2xl font-bold">{t.emptyTitle}</h3>
                    <p className="text-slate-500">{t.emptyDesc}</p>
                </div>
            </div>
        );
    }

    return (
        <div dir={isAr ? "rtl" : "ltr"} className={`max-w-7xl mx-auto py-8 font-display animate-in fade-in duration-500 ${isAr ? "text-right" : "text-left"}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Stethoscope className="w-9 h-9 text-primary" />
                        {t.title}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        {t.subtitle} <span className="text-primary font-semibold italic">"{lectureTitle}"</span>
                    </p>
                </div>
                <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all self-start"
                >
                    <Download className="w-5 h-5" />
                    {isAr ? "تصدير PDF" : "Export PDF"}
                </button>
            </div>

            {/* AI insight banner */}
            {medical.insight?.description && (
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
                    <span className="material-symbols-outlined text-primary text-3xl shrink-0">psychology</span>
                    <div>
                        {medical.insight.title && <h3 className="font-bold text-lg text-slate-900 mb-1">{medical.insight.title}</h3>}
                        <p className="text-slate-600 italic leading-relaxed">{medical.insight.description}</p>
                    </div>
                </div>
            )}

            {/* Section switcher + search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="flex flex-wrap gap-2">
                    {sections.map(s => (
                        <button
                            key={s.key}
                            onClick={() => setActiveSection(s.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSection === s.key
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                        >
                            {s.icon}
                            {s.label}
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeSection === s.key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{s.count}</span>
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-72 shrink-0">
                    <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${isAr ? "right-0 pr-3" : "left-0 pl-3"}`}>
                        <Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.searchPlaceholder}
                        dir={isAr ? "rtl" : "ltr"}
                        className={`block w-full py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-slate-400 font-medium ${isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`}
                    />
                </div>
            </div>

            {/* Section content */}
            {activeSection === "terms" && <TermsGrid items={filteredTerms} isAr={isAr} />}
            {activeSection === "drugs" && <DrugsGrid items={filteredDrugs} isAr={isAr} onCopy={copyText} />}
            {activeSection === "calculations" && <CalcGrid items={filteredCalcs} isAr={isAr} onCopy={copyText} />}
            {activeSection === "procedures" && <ProceduresList items={filteredProcs} isAr={isAr} />}

            {((activeSection === "terms" && filteredTerms.length === 0) ||
              (activeSection === "drugs" && filteredDrugs.length === 0) ||
              (activeSection === "calculations" && filteredCalcs.length === 0) ||
              (activeSection === "procedures" && filteredProcs.length === 0)) && (
                <div className="py-20 text-center text-slate-500 font-medium">{t.noResults}</div>
            )}
        </div>
    );
}

const cardMotion = (index: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: Math.min(index * 0.04, 0.4), duration: 0.4 },
});

const cardClass = "flex flex-col rounded-[24px] border border-[#F1F5F9] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 h-full";

function Tag({ children }: { children: React.ReactNode }) {
    return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 rounded-md w-fit">{children}</span>;
}

function TermsGrid({ items, isAr }: { items: MedicalTerm[]; isAr: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                        <Tag>{x.category || x.type}</Tag>
                        <Activity className="w-4 h-4 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{x.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{x.definition}</p>
                    {x.clinicalContext && (
                        <p className="text-sm text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">
                            <span className="font-bold text-slate-700">{isAr ? "السياق السريري: " : "Clinical context: "}</span>
                            {x.clinicalContext}
                        </p>
                    )}
                    {x.image && <MedicalImageView image={x.image} />}
                    {x.visual && <MedicalVisual visual={x.visual} />}
                    {x.model3d && <Anatomy3D model={x.model3d} />}
                </motion.div>
            ))}
        </div>
    );
}

function DrugsGrid({ items, isAr, onCopy }: { items: DrugCard[]; isAr: boolean; onCopy: (t: string) => void }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                        <Tag>{x.drugClass}</Tag>
                        <Pill className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{x.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        <span className="font-bold text-slate-700">{isAr ? "آلية العمل: " : "Mechanism: "}</span>{x.mechanism}
                    </p>
                    {x.dosage && (
                        <p className="text-sm text-slate-600 mt-2">
                            <span className="font-bold text-slate-700">{isAr ? "الجرعة: " : "Dosage: "}</span>{x.dosage}
                        </p>
                    )}
                    {x.indications?.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-bold text-slate-700 mb-1">{isAr ? "دواعي الاستعمال" : "Indications"}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {x.indications.map((i, k) => (
                                    <span key={k} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100">{i}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {x.sideEffects?.length > 0 && (
                        <div className="mt-3">
                            <p className="text-xs font-bold text-slate-700 mb-1">{isAr ? "الآثار الجانبية" : "Side effects"}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {x.sideEffects.map((i, k) => (
                                    <span key={k} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-100">{i}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {x.warnings && (
                        <p className="text-sm text-rose-600 leading-relaxed mt-3 pt-3 border-t border-slate-100 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{x.warnings}</span>
                        </p>
                    )}
                    {x.image && <MedicalImageView image={x.image} />}
                    {x.visual && <MedicalVisual visual={x.visual} />}
                    {(x.moleculeName || x.name) && <Molecule3D name={x.moleculeName || x.name} />}
                </motion.div>
            ))}
        </div>
    );
}

function CalcGrid({ items, isAr, onCopy }: { items: ClinicalCalculation[]; isAr: boolean; onCopy: (t: string) => void }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                        <Tag>{x.category || (isAr ? "حساب سريري" : "Clinical")}</Tag>
                        <button onClick={() => onCopy(x.formula)} title="Copy" className="text-slate-300 hover:text-primary transition-colors">
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-3">{x.name}</h3>
                    <div className="flex items-center justify-center py-8 px-4 bg-[#F8FAFC] rounded-2xl mb-4 border border-[#F1F5F9] overflow-x-auto">
                        <KaTeXMath formula={x.formula} displayMode={true} />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{x.description}</p>
                    {x.normalRange && (
                        <p className="text-sm mt-2">
                            <span className="font-bold text-slate-700">{isAr ? "المعدل الطبيعي: " : "Normal range: "}</span>
                            <span className="text-emerald-600 font-semibold">{x.normalRange}</span>
                        </p>
                    )}
                    {x.variables && x.variables.length > 0 && (
                        <div className="flex flex-wrap gap-x-4 gap-y-3 pt-4 mt-auto border-t border-slate-100">
                            {x.variables.map((v, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-[#FFF7ED] px-1.5 py-0.5 rounded text-primary border border-primary/10">
                                        <KaTeXMath formula={v.symbol} displayMode={false} />
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">{v.meaning}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {x.image && <MedicalImageView image={x.image} />}
                    {x.visual && <MedicalVisual visual={x.visual} />}
                </motion.div>
            ))}
        </div>
    );
}

function ProceduresList({ items, isAr }: { items: ClinicalProcedure[]; isAr: boolean }) {
    return (
        <div className="space-y-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className="rounded-[24px] border border-[#F1F5F9] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-xl text-slate-900">{x.name}</h3>
                        <ListChecks className="w-5 h-5 text-primary shrink-0" />
                    </div>
                    {x.indication && (
                        <p className="text-sm text-slate-500 mb-4">
                            <span className="font-bold text-slate-700">{isAr ? "دواعي: " : "Indication: "}</span>{x.indication}
                        </p>
                    )}
                    <ol className="space-y-2">
                        {(x.steps || []).map((s, k) => (
                            <li key={k} className="flex items-start gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black shrink-0 mt-0.5">{k + 1}</span>
                                <span className="text-sm text-slate-600 leading-relaxed">{s}</span>
                            </li>
                        ))}
                    </ol>
                    {x.notes && (
                        <p className="text-sm text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-100">
                            <span className="font-bold text-slate-700">{isAr ? "ملاحظات: " : "Notes: "}</span>{x.notes}
                        </p>
                    )}
                    {x.image && <MedicalImageView image={x.image} />}
                    {x.visual && <MedicalVisual visual={x.visual} />}
                </motion.div>
            ))}
        </div>
    );
}
