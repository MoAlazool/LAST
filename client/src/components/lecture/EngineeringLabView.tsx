import { useState, useMemo } from "react";
import { EngineeringInsights, EngComponent, EngCircuit, CodeSnippet, EngFormula, EngProcedure } from "@/lib/mockData";
import {
    Search, Download, CircuitBoard, Cpu, Code2, Sigma, ListChecks, Zap,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { KaTeXMath } from "./MathRenderer";
import { MedicalVisual, MedicalImageView, sanitizeMermaid } from "./MedicalVisual";
import { Model3DView } from "./Molecule3D";
import { CodeBlock } from "./CodeBlock";

interface EngineeringLabViewProps {
    engineering: EngineeringInsights;
    lectureTitle?: string;
}

type SectionKey = "components" | "circuits" | "code" | "formulas";

const PRIMARY = "#F05A22";

export function EngineeringLabView({ engineering, lectureTitle = "Engineering Lecture" }: EngineeringLabViewProps) {
    const { toast } = useToast();
    const { language } = useLanguage();
    const isAr = language === "ar";

    const components = engineering?.components || [];
    const circuits = engineering?.circuits || [];
    const code = engineering?.code || [];
    const formulas = engineering?.formulas || [];
    const procedures = engineering?.procedures || [];

    const allSections: { key: SectionKey; label: string; icon: React.ReactNode; count: number }[] = [
        { key: "components", label: isAr ? "المكوّنات" : "Components", icon: <Cpu className="w-4 h-4" />, count: components.length },
        { key: "circuits", label: isAr ? "الدوائر" : "Circuits", icon: <CircuitBoard className="w-4 h-4" />, count: circuits.length },
        { key: "code", label: isAr ? "الأكواد" : "Code", icon: <Code2 className="w-4 h-4" />, count: code.length },
        { key: "formulas", label: isAr ? "القوانين والخطوات" : "Formulas & How-To", icon: <Sigma className="w-4 h-4" />, count: formulas.length + procedures.length },
    ];
    const sections = allSections.filter(s => s.count > 0);

    const [activeSection, setActiveSection] = useState<SectionKey>(sections[0]?.key || "components");
    const [searchQuery, setSearchQuery] = useState("");

    const t = {
        title: isAr ? "مختبر الهندسة" : "Engineering Lab",
        subtitle: isAr ? "مستخرج من" : "Extracted from",
        emptyTitle: isAr ? "لا يوجد محتوى هندسي" : "No Engineering Content",
        emptyDesc: isAr ? "لم يتم العثور على محتوى هندسي في هذه المحاضرة." : "No engineering content was found in this lecture.",
        searchPlaceholder: isAr ? "بحث..." : "Search...",
        noResults: isAr ? "لا توجد نتائج مطابقة لبحثك." : "Nothing matches your search.",
        copied: isAr ? "تم النسخ" : "Copied",
    };

    const matches = (h: string) => !searchQuery || h.toLowerCase().includes(searchQuery.toLowerCase());
    const fComponents = useMemo(() => components.filter(x => matches(`${x.name || ""} ${x.description || ""} ${x.type || ""} ${x.typicalUse || ""}`)), [components, searchQuery]);
    const fCircuits = useMemo(() => circuits.filter(x => matches(`${x.name || ""} ${x.description || ""} ${(x.components || []).join(" ")}`)), [circuits, searchQuery]);
    const fCode = useMemo(() => code.filter(x => matches(`${x.title || ""} ${x.explanation || ""} ${x.code || ""}`)), [code, searchQuery]);
    const fFormulas = useMemo(() => formulas.filter(x => matches(`${x.name || ""} ${x.description || ""}`)), [formulas, searchQuery]);
    const fProcedures = useMemo(() => procedures.filter(x => matches(`${x.name || ""} ${(x.steps || []).join(" ")}`)), [procedures, searchQuery]);

    const totalCount = components.length + circuits.length + code.length + formulas.length + procedures.length;

    const handleExportPDF = async () => {
        try {
            const dir = isAr ? "rtl" : "ltr";
            toast({ title: isAr ? "جاري تحضير ملف PDF..." : "Preparing PDF...", description: isAr ? "يرجى الانتظار قليلاً" : "Please wait a moment" });
            const { jsPDF } = await import("jspdf");
            const html2canvas = (await import("html2canvas")).default;
            const katex = (await import("katex")).default;
            const { sanitizeLatex } = await import("./MathRenderer");

            const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const sectionHeader = (label: string) => `<h2 style="color:${PRIMARY};border-bottom:2px solid ${PRIMARY}33;padding-bottom:6px;margin:28px 0 14px;">${label}</h2>`;

            // Pre-render mermaid visuals
            const mermaidCache = new Map<string, string>();
            try {
                const mermaid = (await import("mermaid")).default;
                mermaid.initialize({ startOnLoad: false, theme: "neutral", securityLevel: "strict" });
                let mid = 0;
                for (const it of [...components, ...circuits] as any[]) {
                    const v = it.visual;
                    if (v?.type === "mermaid" && v.code) {
                        try { const { svg } = await mermaid.render(`engpdf-${mid++}`, sanitizeMermaid(v.code)); mermaidCache.set(v.code, svg); } catch { }
                    }
                }
            } catch { }

            const visualHtml = (v?: { type: string; code: string; caption?: string }) => {
                if (!v?.code) return "";
                const inner = v.type === "mermaid" ? (mermaidCache.get(v.code) || "") : v.code;
                if (!inner) return "";
                return `<div class="visual">${inner}${v.caption ? `<div class="vcap">${esc(v.caption)}</div>` : ""}</div>`;
            };
            const imageHtml = (img?: { url: string; title?: string; source?: string }) =>
                img?.url ? `<div class="visual"><img src="${esc(img.url)}" crossorigin="anonymous" style="max-width:100%;max-height:240px;object-fit:contain;" />${img.title ? `<div class="vcap">${esc(img.title)}${img.source ? ` — ${esc(img.source)}` : ""}</div>` : ""}</div>` : "";

            const componentsHtml = components.length ? sectionHeader(isAr ? "المكوّنات" : "Components") + components.map(x => `
                <div class="card"><span class="tag">${esc(x.type || x.category || "")}</span><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p>${(x.specs && x.specs.length) ? `<table>${x.specs.map(s => `<tr><td class="k">${esc(s.label)}</td><td>${esc(s.value)}</td></tr>`).join("")}</table>` : ""}${x.typicalUse ? `<p class="muted"><b>${isAr ? "الاستخدام:" : "Typical use:"}</b> ${esc(x.typicalUse)}</p>` : ""}${imageHtml(x.image)}${visualHtml(x.visual)}</div>`).join("") : "";

            const circuitsHtml = circuits.length ? sectionHeader(isAr ? "الدوائر" : "Circuits") + circuits.map(x => `
                <div class="card"><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p>${(x.components && x.components.length) ? `<p class="muted"><b>${isAr ? "المكوّنات:" : "Components:"}</b> ${esc(x.components.join(", "))}</p>` : ""}${x.howItWorks ? `<p>${esc(x.howItWorks)}</p>` : ""}${visualHtml(x.visual)}</div>`).join("") : "";

            const codeHtml = code.length ? sectionHeader(isAr ? "الأكواد" : "Code") + code.map(x => `
                <div class="card"><h3>${esc(x.title)}</h3><pre dir="ltr">${esc(x.code)}</pre>${x.explanation ? `<p class="muted">${esc(x.explanation)}</p>` : ""}</div>`).join("") : "";

            const formulasHtml = formulas.length ? sectionHeader(isAr ? "القوانين" : "Formulas & Laws") + formulas.map(x => {
                let math = esc(x.formula);
                try { math = katex.renderToString(sanitizeLatex(x.formula || ""), { displayMode: true, throwOnError: false }); } catch { }
                return `<div class="card"><h3>${esc(x.name)}</h3><div class="math">${math}</div><p>${esc(x.description)}</p></div>`;
            }).join("") : "";

            const procsHtml = procedures.length ? sectionHeader(isAr ? "خطوات العمل" : "How-To") + procedures.map(x => `
                <div class="card"><h3>${esc(x.name)}</h3><ol style="padding-${isAr ? "right" : "left"}:18px;">${(x.steps || []).map(s => `<li>${esc(s)}</li>`).join("")}</ol>${x.notes ? `<p class="muted">${esc(x.notes)}</p>` : ""}</div>`).join("") : "";

            const html = `<html><head>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
                <style>
                    body{font-family:'Inter','IBM Plex Sans Arabic',sans-serif;margin:0;padding:40px;background:#fff;direction:${dir};color:#0f172a;}
                    .header{text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid ${PRIMARY};}
                    .card{page-break-inside:avoid;margin-bottom:18px;padding:18px 20px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;}
                    .card h3{font-size:18px;margin:6px 0 10px;}
                    .card p{font-size:13px;color:#334155;line-height:1.6;margin:4px 0;}
                    .card .muted{color:#64748b;}
                    .card .math{padding:14px;background:#fff;border:1px solid #f1f5f9;border-radius:10px;text-align:center;margin:8px 0;font-size:20px;}
                    table{border-collapse:collapse;margin:8px 0;font-size:12px;} td{border:1px solid #e2e8f0;padding:4px 8px;} td.k{font-weight:700;color:#475569;background:#f1f5f9;}
                    pre{direction:ltr;text-align:left;background:#1e293b;color:#e2e8f0;padding:14px;border-radius:10px;font-size:12px;overflow-x:auto;white-space:pre-wrap;}
                    .tag{display:inline-block;padding:3px 9px;background:${PRIMARY}15;color:${PRIMARY};border-radius:6px;font-size:10px;font-weight:800;text-transform:uppercase;}
                    .visual{margin-top:12px;padding:12px;background:#fff;border:1px solid #f1f5f9;border-radius:10px;text-align:center;} .visual svg{max-width:100%;height:auto;}
                    .vcap{font-size:11px;color:#64748b;font-style:italic;margin-top:8px;}
                </style></head><body>
                <div class="header"><h1 style="color:${PRIMARY};margin:0;font-size:30px;">${t.title}</h1>
                <p style="color:#64748b;margin:8px 0 0;">${esc(lectureTitle)} • ${new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</p></div>
                ${componentsHtml}${circuitsHtml}${codeHtml}${formulasHtml}${procsHtml}
                </body></html>`;

            const container = document.createElement("div");
            container.innerHTML = html;
            container.style.position = "absolute"; container.style.left = "-9999px"; container.style.width = "210mm";
            document.body.appendChild(container);
            await new Promise(r => setTimeout(r, 1500));
            const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
            document.body.removeChild(container);
            const imgData = canvas.toDataURL("image/jpeg", 0.95);
            const pdf = new jsPDF("p", "mm", "a4");
            const pageW = 210, pageH = 297, imgH = (canvas.height * pageW) / canvas.width;
            let heightLeft = imgH, position = 0;
            pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH); heightLeft -= pageH;
            while (heightLeft > 0) { position = heightLeft - imgH; pdf.addPage(); pdf.addImage(imgData, "JPEG", 0, position, pageW, imgH); heightLeft -= pageH; }
            pdf.save(`${lectureTitle.replace(/[^a-z0-9]/gi, '_')}_engineering.pdf`);
            toast({ title: isAr ? "تمت عملية التصدير بنجاح" : "Export Successful" });
        } catch (e) {
            console.error("PDF Export Error:", e);
            toast({ title: isAr ? "خطأ في التصدير" : "Export Failed", variant: "destructive" });
        }
    };

    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <CircuitBoard className="w-10 h-10 text-primary" />
                </div>
                <div className="max-w-md space-y-2">
                    <h3 className="text-2xl font-bold">{t.emptyTitle}</h3>
                    <p className="text-slate-500">{t.emptyDesc}</p>
                </div>
            </div>
        );
    }

    const activeEmpty =
        (activeSection === "components" && fComponents.length === 0) ||
        (activeSection === "circuits" && fCircuits.length === 0) ||
        (activeSection === "code" && fCode.length === 0) ||
        (activeSection === "formulas" && fFormulas.length === 0 && fProcedures.length === 0);

    return (
        <div dir={isAr ? "rtl" : "ltr"} className={`max-w-7xl mx-auto py-8 font-display animate-in fade-in duration-500 ${isAr ? "text-right" : "text-left"}`}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="space-y-2">
                    <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <CircuitBoard className="w-9 h-9 text-primary" />
                        {t.title}
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl">
                        {t.subtitle} <span className="text-primary font-semibold italic">"{lectureTitle}"</span>
                    </p>
                </div>
                <button onClick={handleExportPDF} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:brightness-110 active:scale-95 transition-all self-start">
                    <Download className="w-5 h-5" />
                    {isAr ? "تصدير PDF" : "Export PDF"}
                </button>
            </div>

            {/* AI insight banner */}
            {engineering.insight?.description && (
                <div className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex items-start gap-4">
                    <Zap className="w-7 h-7 text-primary shrink-0" />
                    <div>
                        {engineering.insight.title && <h3 className="font-bold text-lg text-slate-900 mb-1">{engineering.insight.title}</h3>}
                        <p className="text-slate-600 italic leading-relaxed">{engineering.insight.description}</p>
                    </div>
                </div>
            )}

            {/* Switcher + search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="flex flex-wrap gap-2">
                    {sections.map(s => (
                        <button key={s.key} onClick={() => setActiveSection(s.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeSection === s.key ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                            {s.icon}{s.label}
                            <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${activeSection === s.key ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{s.count}</span>
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-72 shrink-0">
                    <div className={`absolute inset-y-0 flex items-center pointer-events-none text-slate-400 ${isAr ? "right-0 pr-3" : "left-0 pl-3"}`}>
                        <Search className="w-5 h-5" />
                    </div>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.searchPlaceholder} dir={isAr ? "rtl" : "ltr"}
                        className={`block w-full py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-primary focus:border-transparent text-sm placeholder-slate-400 font-medium ${isAr ? "pr-10 pl-4 text-right" : "pl-10 pr-4 text-left"}`} />
                </div>
            </div>

            {/* Content */}
            {activeSection === "components" && <ComponentsGrid items={fComponents} isAr={isAr} />}
            {activeSection === "circuits" && <CircuitsGrid items={fCircuits} isAr={isAr} />}
            {activeSection === "code" && <CodeList items={fCode} />}
            {activeSection === "formulas" && <FormulasHowTo formulas={fFormulas} procedures={fProcedures} isAr={isAr} />}

            {activeEmpty && <div className="py-20 text-center text-slate-500 font-medium">{t.noResults}</div>}
        </div>
    );
}

const cardMotion = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: Math.min(i * 0.04, 0.4), duration: 0.4 } });
const cardClass = "flex flex-col rounded-[24px] border border-[#F1F5F9] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 h-full";
function Tag({ children }: { children: React.ReactNode }) {
    return <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 rounded-md w-fit">{children}</span>;
}

function ComponentsGrid({ items, isAr }: { items: EngComponent[]; isAr: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                        <Tag>{x.type || x.category || (isAr ? "مكوّن" : "Component")}</Tag>
                        <Cpu className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{x.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{x.description}</p>
                    {x.specs && x.specs.length > 0 && (
                        <div className="mt-3 rounded-xl border border-slate-100 overflow-hidden">
                            {x.specs.map((s, i) => (
                                <div key={i} className="flex text-xs border-b border-slate-100 last:border-0">
                                    <span className="font-bold text-slate-600 bg-slate-50 px-3 py-1.5 w-2/5">{s.label}</span>
                                    <span className="text-slate-500 px-3 py-1.5">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {x.typicalUse && (
                        <p className="text-sm text-slate-500 leading-relaxed mt-3">
                            <span className="font-bold text-slate-700">{isAr ? "الاستخدام: " : "Typical use: "}</span>{x.typicalUse}
                        </p>
                    )}
                    {x.image && <MedicalImageView image={x.image} />}
                    {x.visual && <MedicalVisual visual={x.visual} />}
                    {x.model3d && <Model3DView model={x.model3d} />}
                </motion.div>
            ))}
        </div>
    );
}

function CircuitsGrid({ items, isAr }: { items: EngCircuit[]; isAr: boolean }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className={cardClass}>
                    <div className="flex items-center justify-between mb-3">
                        <Tag>{isAr ? "دائرة" : "Circuit"}</Tag>
                        <CircuitBoard className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-2">{x.name}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">{x.description}</p>
                    {x.components && x.components.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                            {x.components.map((c, i) => (
                                <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">{c}</span>
                            ))}
                        </div>
                    )}
                    {x.howItWorks && <p className="text-sm text-slate-500 leading-relaxed mt-3 pt-3 border-t border-slate-100">{x.howItWorks}</p>}
                    {x.visual && <MedicalVisual visual={x.visual} />}
                </motion.div>
            ))}
        </div>
    );
}

function CodeList({ items }: { items: CodeSnippet[] }) {
    return (
        <div className="space-y-6">
            {items.map((x, idx) => (
                <motion.div key={x.id || idx} {...cardMotion(idx)} className="rounded-[24px] border border-[#F1F5F9] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                    <div className="flex items-center gap-2 mb-3">
                        <Code2 className="w-5 h-5 text-primary shrink-0" />
                        <h3 className="font-bold text-xl text-slate-900">{x.title}</h3>
                    </div>
                    <CodeBlock code={x.code} language={x.language} title={x.title} />
                    {x.explanation && <p className="text-sm text-slate-500 leading-relaxed mt-4">{x.explanation}</p>}
                </motion.div>
            ))}
        </div>
    );
}

function FormulasHowTo({ formulas, procedures, isAr }: { formulas: EngFormula[]; procedures: EngProcedure[]; isAr: boolean }) {
    return (
        <div className="space-y-8">
            {formulas.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {formulas.map((x, idx) => (
                        <motion.div key={`f-${x.id || idx}`} {...cardMotion(idx)} className={cardClass}>
                            <div className="flex items-center justify-between mb-3"><Tag>{x.category || (isAr ? "قانون" : "Law")}</Tag><Sigma className="w-5 h-5 text-primary" /></div>
                            <h3 className="font-bold text-xl text-slate-900 mb-3">{x.name}</h3>
                            <div className="flex items-center justify-center py-8 px-4 bg-[#F8FAFC] rounded-2xl mb-4 border border-[#F1F5F9] overflow-x-auto">
                                <KaTeXMath formula={x.formula} displayMode={true} />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed font-medium">{x.description}</p>
                            {x.variables && x.variables.length > 0 && (
                                <div className="flex flex-wrap gap-x-4 gap-y-3 pt-4 mt-auto border-t border-slate-100">
                                    {x.variables.map((v, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-xs font-mono bg-[#FFF7ED] px-1.5 py-0.5 rounded text-primary border border-primary/10"><KaTeXMath formula={v.symbol} displayMode={false} /></span>
                                            <span className="text-xs text-slate-400 font-medium">{v.meaning}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
            {procedures.length > 0 && (
                <div className="space-y-6">
                    {procedures.map((x, idx) => (
                        <motion.div key={`p-${x.id || idx}`} {...cardMotion(idx)} className="rounded-[24px] border border-[#F1F5F9] bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                            <div className="flex items-center gap-2 mb-4"><ListChecks className="w-5 h-5 text-primary shrink-0" /><h3 className="font-bold text-xl text-slate-900">{x.name}</h3></div>
                            <ol className="space-y-2">
                                {(x.steps || []).map((s, k) => (
                                    <li key={k} className="flex items-start gap-3">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black shrink-0 mt-0.5">{k + 1}</span>
                                        <span className="text-sm text-slate-600 leading-relaxed">{s}</span>
                                    </li>
                                ))}
                            </ol>
                            {x.notes && <p className="text-sm text-slate-500 leading-relaxed mt-4 pt-4 border-t border-slate-100">{x.notes}</p>}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
