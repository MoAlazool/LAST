import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label,
} from "recharts";
import { FormulaGraph } from "@/lib/mockData";

const COLORS = ["#F05A22", "#2563eb", "#16a34a", "#9333ea", "#db2777", "#0891b2"];

/**
 * Interactive coordinate graph / function curve, plotted from AI-provided sample points.
 * Each series carries its own {x,y} points; a shared numeric X axis ties them together.
 * Renders nothing if there are no valid numeric points.
 */
export function MathGraph({ graph }: { graph: FormulaGraph }) {
    const series = useMemo(() => {
        return (graph?.series || [])
            .map((s) => ({
                label: s.label || s.expression || "",
                points: (s.points || []).filter(
                    (p) => p && Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y))
                ).map((p) => ({ x: Number(p.x), y: Number(p.y) })),
            }))
            .filter((s) => s.points.length >= 2);
    }, [graph]);

    if (series.length === 0) return null;

    return (
        <motion.figure
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-[#F1F5F9] bg-white p-4"
            dir="ltr"
        >
            {graph.title && (
                <figcaption className="text-sm font-bold text-slate-700 text-center mb-3">{graph.title}</figcaption>
            )}
            <div className="w-full" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            domain={["auto", "auto"]}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            stroke="#94a3b8"
                        >
                            {graph.xLabel && <Label value={graph.xLabel} position="insideBottom" offset={-12} style={{ fill: "#475569", fontSize: 12 }} />}
                        </XAxis>
                        <YAxis
                            type="number"
                            domain={["auto", "auto"]}
                            tick={{ fontSize: 12, fill: "#64748b" }}
                            stroke="#94a3b8"
                        >
                            {graph.yLabel && <Label value={graph.yLabel} angle={-90} position="insideLeft" style={{ fill: "#475569", fontSize: 12 }} />}
                        </YAxis>
                        <Tooltip
                            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                            labelFormatter={(v) => `x = ${v}`}
                        />
                        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
                        {series.map((s, i) => (
                            <Line
                                key={i}
                                data={s.points}
                                dataKey="y"
                                name={s.label || `Series ${i + 1}`}
                                type="monotone"
                                stroke={COLORS[i % COLORS.length]}
                                strokeWidth={2.5}
                                dot={s.points.length <= 12}
                                isAnimationActive={true}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.figure>
    );
}
