import { useEffect, useRef, useState } from "react";
import { Atom, Rotate3d, Loader2, Box, ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Model3D } from "@/lib/mockData";

interface Molecule3DProps {
    name: string; // compound/drug name to look up on PubChem
}

type Status = "idle" | "loading" | "ready" | "error";

const PUBCHEM = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name";

/**
 * Interactive 3D molecule viewer (3Dmol.js + PubChem).
 * Click-to-load so we don't spin up many WebGL contexts at once (browsers cap them).
 * Fetches the real 3D conformer SDF for the named compound; degrades gracefully.
 */
export function Molecule3D({ name }: Molecule3DProps) {
    const { language } = useLanguage();
    const isAr = language === "ar";
    const [status, setStatus] = useState<Status>("idle");
    const containerRef = useRef<HTMLDivElement>(null);
    const viewerRef = useRef<any>(null);

    const t = {
        load: isAr ? "عرض المجسم ثلاثي الأبعاد" : "View 3D molecule",
        loading: isAr ? "جاري تحميل البنية..." : "Loading structure...",
        error: isAr ? "تعذّر تحميل المجسم ثلاثي الأبعاد" : "3D structure unavailable",
        hint: isAr ? "اسحب للتدوير • مرر للتكبير" : "Drag to rotate • scroll to zoom",
    };

    useEffect(() => {
        return () => {
            try { viewerRef.current?.clear?.(); } catch { /* noop */ }
            viewerRef.current = null;
        };
    }, []);

    const fetchSdf = async (compound: string): Promise<string | null> => {
        const q = encodeURIComponent(compound.trim());
        // Prefer a computed 3D conformer; fall back to default SDF.
        for (const suffix of ["/SDF?record_type=3d", "/SDF"]) {
            try {
                const resp = await fetch(`${PUBCHEM}/${q}${suffix}`);
                if (resp.ok) {
                    const text = await resp.text();
                    if (text && text.includes("$$$$")) return text;
                }
            } catch { /* try next */ }
        }
        return null;
    };

    const handleLoad = async () => {
        if (status === "loading" || status === "ready") return;
        setStatus("loading");
        try {
            const sdf = await fetchSdf(name);
            if (!sdf) { setStatus("error"); return; }

            const $3Dmol: any = await import("3dmol");
            const lib = $3Dmol.default || $3Dmol;
            if (!containerRef.current) { setStatus("error"); return; }

            const viewer = lib.createViewer(containerRef.current, { backgroundColor: "white" });
            viewerRef.current = viewer;
            viewer.addModel(sdf, "sdf");
            viewer.setStyle({}, {
                stick: { radius: 0.14 },
                sphere: { scale: 0.28 },
            });
            viewer.zoomTo();
            viewer.render();
            viewer.spin("y", 0.5);
            setStatus("ready");
        } catch (err) {
            console.warn("[Molecule3D] failed:", err);
            setStatus("error");
        }
    };

    if (status === "error") {
        return (
            <p className="text-xs text-slate-400 italic mt-4 flex items-center gap-1.5">
                <Atom className="w-3.5 h-3.5" /> {t.error}
            </p>
        );
    }

    if (status === "idle") {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); handleLoad(); }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 active:scale-95 transition-all w-fit"
            >
                <Rotate3d className="w-4 h-4" />
                {t.load}
            </button>
        );
    }

    return (
        <div className="mt-4 rounded-2xl border border-[#F1F5F9] bg-white overflow-hidden">
            <div className="relative w-full h-64 bg-white">
                {/* 3Dmol renders a WebGL canvas inside this container */}
                <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ position: "relative" }} />
                {status === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400 bg-white/80">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-xs font-medium">{t.loading}</span>
                    </div>
                )}
            </div>
            {status === "ready" && (
                <p className="text-[11px] text-slate-400 text-center py-2 border-t border-slate-100">{t.hint}</p>
            )}
        </div>
    );
}

/**
 * Interactive 3D anatomy model (Sketchfab embed, which renders via WebGL/three.js).
 * Click-to-load so heavy iframes are only created on demand.
 */
// Neutral alias — the Sketchfab embed is generic (anatomy, hardware components, etc.)
export { Anatomy3D as Model3DView };

export function Anatomy3D({ model }: { model: Model3D }) {
    const { language } = useLanguage();
    const isAr = language === "ar";
    const [open, setOpen] = useState(false);

    if (!model?.embedUrl) return null;

    const src = `${model.embedUrl}${model.embedUrl.includes("?") ? "&" : "?"}autospin=0.2&ui_infos=0&ui_watermark=0&ui_hint=0`;

    if (!open) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(true); }}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-sm hover:bg-primary/20 active:scale-95 transition-all w-fit"
            >
                <Box className="w-4 h-4" />
                {isAr ? "عرض المجسم ثلاثي الأبعاد" : "View 3D model"}
            </button>
        );
    }

    return (
        <div className="mt-4 rounded-2xl border border-[#F1F5F9] bg-white overflow-hidden">
            <div className="relative w-full" style={{ height: "320px" }}>
                <iframe
                    title={model.name || "3D anatomy model"}
                    src={src}
                    className="absolute inset-0 w-full h-full"
                    frameBorder={0}
                    allow="autoplay; fullscreen; xr-spatial-tracking"
                    allowFullScreen
                />
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 py-2 border-t border-slate-100">
                {model.name && <span className="text-slate-500">{model.name}</span>}
                {model.pageUrl && (
                    <a
                        href={model.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-3 h-3" />
                        {model.source || "Sketchfab"}
                    </a>
                )}
            </div>
        </div>
    );
}
