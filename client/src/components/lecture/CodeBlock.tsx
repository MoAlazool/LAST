import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
    code: string;
    language?: string;
    title?: string;
}

// Map friendly language names to Prism language ids.
const LANG_MAP: Record<string, string> = {
    arduino: "cpp",
    ino: "cpp",
    "c++": "cpp",
    cpp: "cpp",
    c: "c",
    py: "python",
    python: "python",
    js: "javascript",
    javascript: "javascript",
    ts: "typescript",
};

/**
 * Syntax-highlighted code block with a copy button.
 * Mirrors the renderer used in AgentChatView.
 */
// Some models return code with literal "\n" instead of real line breaks (double-escaped JSON),
// which makes the whole program render on a single line. Only un-escape when the snippet has
// NO real newlines but DOES contain literal "\n" — otherwise leave genuine "\n" string literals alone.
export function normalizeCode(raw?: string): string {
    if (!raw) return "";
    if (!raw.includes("\n") && /\\n/.test(raw)) {
        return raw.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, "  ");
    }
    return raw;
}

export function CodeBlock({ code, language = "cpp", title }: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const lang = LANG_MAP[(language || "").toLowerCase()] || "cpp";
    const normalized = normalizeCode(code);
    const lineCount = normalized.split("\n").length;

    const handleCopy = () => {
        navigator.clipboard.writeText(normalized);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-2xl overflow-hidden border border-slate-700 bg-[#1E293B]" dir="ltr">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A] border-b border-slate-700">
                <span className="text-xs font-mono text-slate-400 truncate">{title || language || "code"}</span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all shrink-0"
                    title="Copy code"
                    type="button"
                >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
            </div>
            <div className="text-sm font-mono leading-relaxed overflow-x-auto custom-scrollbar">
                <SyntaxHighlighter
                    language={lang}
                    style={vscDarkPlus}
                    showLineNumbers={lineCount > 1}
                    lineNumberStyle={{ minWidth: "2.4em", paddingRight: "1em", color: "#475569", userSelect: "none" }}
                    customStyle={{ margin: 0, padding: "1.1rem", background: "#1E293B", fontSize: "0.85rem", lineHeight: "1.6" }}
                >
                    {normalized.replace(/\n$/, "")}
                </SyntaxHighlighter>
            </div>
        </div>
    );
}
