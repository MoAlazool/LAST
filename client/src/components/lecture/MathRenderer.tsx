import { useRef, useEffect } from "react";
import katex from "katex";
import { cn } from "@/lib/utils";
import "katex/dist/katex.min.css";

/**
 * Renders a single LaTeX formula using KaTeX.
 */
export function KaTeXMath({ formula, displayMode = false, className = "" }: { formula: string, displayMode?: boolean, className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        const cleaned = sanitizeLatex(formula || "");

        katex.render(cleaned, containerRef.current, {
          displayMode,
          throwOnError: false,
          errorColor: "#ef4444",
          strict: false,
          trust: true,
          output: "htmlAndMathml",
        });
      } catch (error) {
        console.error("KaTeX rendering error:", error);
        containerRef.current.textContent = formula; 
      }
    }
  }, [formula, displayMode]);

  if (displayMode) {
    return <div ref={containerRef} className={`text-xl lg:text-2xl font-serif text-slate-900 my-4 ${className}`} />;
  }

  return <span ref={containerRef} className={`text-base inline-block !font-serif ${className}`} dir="ltr" />;
}

/**
 * Fixes broken LaTeX where backslashes are missing.
 * Handles: vecAB→\vec{AB}, textXYZ→\text{XYZ}, sqrt→\sqrt, equiv→\equiv, etc.
 */
export function sanitizeLatex(tex: string): string {
  if (!tex) return tex;
  let s = tex.trim();

  // 1) Auto-wrap common English words and phrases in \text{}
  // This prevents the "red text" error when AI writes "classify x to omega"
  const wordsToFix = ['If', 'if', 'then', 'Then', 'else', 'Else', 'classify', 'Classify', 'to', 'for', 'For', 'when', 'When', 'where', 'Where', 'and', 'And', 'or', 'Or', 'given', 'Given'];
  for (const word of wordsToFix) {
    // Match word NOT preceded by \ and NOT inside {}
    const re = new RegExp(`(?<!\\\\|\\{)\\b${word}\\b(?!\\})`, 'g');
    s = s.replace(re, `\\text{${word}} `);
  }

  // 2) Fix missing backslashes for common commands
  const commands = [
    'vec', 'overrightarrow', 'hat', 'bar', 'tilde', 'dot', 'overline', 'underline',
    'sqrt', 'frac', 'text', 'textbf', 'mathbf', 'unit', 'omega', 'sigma', 'alpha', 'beta',
    'gamma', 'delta', 'theta', 'lambda', 'mu', 'pi', 'phi', 'psi', 'rho', 'tau',
    'equiv', 'iff', 'land', 'lor', 'implies', 'to', 'approx', 'neq', 'leq', 'geq',
    'cdot', 'times', 'div', 'sum', 'int', 'lim', 'infty', 'partial', 'nabla'
  ];
  
  for (const cmd of commands) {
    const re = new RegExp(`(?<!\\\\)\\b${cmd}\\b`, 'g');
    s = s.replace(re, `\\${cmd}`);
  }

  // 3) Special fix for vecAB -> \vec{AB}
  s = s.replace(/(?<!\\)vec([A-Z][A-Za-z0-9]*)/g, '\\vec{$1}');

  // 4) Clean up all multi-backslashes to a single one
  s = s.replace(/\\\\+/g, '\\');
  
  // 5) Ensure braces around commands that need them if not present (heuristic)
  s = s.replace(/\\text\s+([^{}\s]+)/g, '\\text{$1}');

  return s;
}

export function TextWithMath({ text, className = "" }: { text: string, className?: string }) {
  if (!text) return null;

  // 1. Extreme sanitation: Pre-clean the entire string
  let cleanText = text
    .replace(/\\\\+/g, '\\')       // \\\\ -> \
    .replace(/\\+\$/g, '$')        // \$ -> $
    .replace(/\$(\s+)/g, '$')      // $ math -> $math
    .replace(/(\s+)\$/g, '$')      // math $ -> math$
    .replace(/\\{/g, '{')          // \{ -> {
    .replace(/\\}/g, '}');         // \} -> }

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let counter = 0;

  function processMarkdown(str: string, key: number) {
    return (
      <span key={key}>
        {str.split(/(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|_.*?_)/g).map((sub, j) => {
          if (sub.startsWith('***')) return <strong key={j} className="font-extrabold italic text-slate-800">{sub.slice(3, -3)}</strong>;
          if (sub.startsWith('**')) return <strong key={j} className="font-extrabold text-slate-800">{sub.slice(2, -2)}</strong>;
          if (sub.startsWith('*') || sub.startsWith('_')) return <em key={j} className="italic text-slate-700">{sub.slice(1, -1)}</em>;
          return sub;
        })}
      </span>
    );
  }

  // Improved regex to handle $ math $ or $math$ or $$math$$
  const regex = /\$\$?([^\$]+)\$\$?/g;
  let match;

  while ((match = regex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processMarkdown(cleanText.substring(lastIndex, match.index), counter++));
    }

    const formula = match[1].trim();
    
    // Protection for acronyms (e.g. $AI$, $Pe$)
    if (/^[a-zA-Z]{1,2}$/.test(formula) && !['a', 'x', 'y', 'n', 'i', 'j', 'k'].includes(formula.toLowerCase())) {
        parts.push(<span key={`math-acro-${match.index}`} className="font-bold text-slate-800">{formula}</span>);
    } else {
        parts.push(<KaTeXMath key={`math-ka-${match.index}`} formula={formula} />);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < cleanText.length) {
    parts.push(processMarkdown(cleanText.substring(lastIndex), counter++));
  }

  return (
    <span className={cn("leading-relaxed text-slate-600 block", className)} dir="auto">
      {parts}
    </span>
  );
}
