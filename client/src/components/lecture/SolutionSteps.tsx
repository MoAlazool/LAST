import { motion } from "framer-motion";
import { SolutionStep } from "@/lib/mockData";
import { KaTeXMath, TextWithMath } from "./MathRenderer";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Numbered, vertical "timeline" of a worked solution / derivation.
 * Each step renders its LaTeX (display) + an explanation with inline math.
 */
export function SolutionSteps({ steps }: { steps: SolutionStep[] }) {
    const { language } = useLanguage();
    const isAr = language === "ar";
    const valid = (steps || []).filter((s) => s && (s.math || s.explanation || s.title));
    if (valid.length === 0) return null;

    return (
        <div className={`space-y-4 ${isAr ? "text-right" : "text-left"}`} dir={isAr ? "rtl" : "ltr"}>
            {valid.map((s, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.35 }}
                    className="flex items-start gap-4"
                >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-black shrink-0">
                        {i + 1}
                    </span>
                    <div className="flex-1 min-w-0 rounded-2xl border border-[#F1F5F9] bg-white p-4 shadow-sm">
                        {s.title && <h4 className="font-bold text-slate-800 mb-2">{s.title}</h4>}
                        {s.math && (
                            <div className="overflow-x-auto py-2 flex justify-center bg-[#F8FAFC] rounded-xl border border-[#F1F5F9] mb-2" dir="ltr">
                                <KaTeXMath formula={s.math} displayMode={true} />
                            </div>
                        )}
                        {s.explanation && (
                            <div className="text-sm text-slate-600 leading-relaxed font-medium">
                                <TextWithMath text={s.explanation} />
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
