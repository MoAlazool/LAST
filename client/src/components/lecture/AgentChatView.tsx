import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User, Copy, Check, X, Mic, Trash2, Paperclip, FileText, PanelLeftOpen, BookOpen, Link2, Film, Sparkles } from "lucide-react";
import { chatWithAgent } from "@/lib/aiService";
import { chatHistoryService, type ChatMessage } from "@/lib/chatHistoryService";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import PdfReader, { type PdfAskPayload } from "./PdfReader";
import LectureVideo, { type VideoMomentPayload } from "./LectureVideo";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";


// Custom renderer for code blocks in markdown
const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const languageMatch = match ? match[1] : "";
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const text = typeof children === 'string' ? children : String(children);
        navigator.clipboard.writeText(text.replace(/\n$/, ""));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!inline) {
        return (
            <div className="my-6 rounded-xl overflow-hidden border border-slate-200 bg-[#1E293B] shadow-lg max-w-full" dir="ltr">
                <div className="flex items-center justify-between px-4 py-2 bg-[#0F172A] border-b border-white/5">
                    <span className="text-xs font-mono font-medium text-slate-400 capitalize flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#F05A22]"></span>
                        {languageMatch || "code"}
                    </span>
                    <button
                        onClick={handleCopy}
                        className="p-1.5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                        title="Copy code"
                        type="button"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
                <div className="text-sm font-mono leading-relaxed overflow-x-auto custom-scrollbar">
                    <SyntaxHighlighter
                        language={languageMatch || 'javascript'}
                        style={vscDarkPlus}
                        customStyle={{
                            margin: 0,
                            padding: '1.25rem',
                            background: '#1E293B',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                        }}
                    >
                        {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    }

    // Inline code styling
    return (
        <code className={`px-1.5 py-0.5 mx-0.5 rounded-md bg-primary/10 text-primary text-[0.85em] font-mono border border-primary/20 ${className || ""}`} {...props}>
            {children}
        </code>
    );
};


export function AgentChatView({ 
    transcript, 
    title, 
    lectureId, 
    mode = "api", 
    minimal = false, 
    initialMessage, 
    onClose,
    sourceUrl,
    documentPageCount,
    userId,
    lectureSourceType,
    relatedLectures,
}: { 
    transcript: string, 
    title: string, 
    lectureId?: string, 
    mode?: "gpu" | "api", 
    minimal?: boolean, 
    initialMessage?: string, 
    onClose?: () => void,
    sourceUrl?: string,
    documentPageCount?: number,
    userId?: string,
    lectureSourceType?: string,
    relatedLectures?: { id: string; title: string; summary?: string | string[]; category?: string; sourceType?: string }[],
}) {
    const { language, isRTL } = useLanguage();
    const isAr = language === "ar";
    const hasDocumentContext = !!sourceUrl || /\.(pdf|pptx?|docx?|doc)$/i.test(title || "");
    const [showDocument, setShowDocument] = useState(hasDocumentContext);

    // Resolve storage key — prefer userId+lectureId for multi-user isolation
    const storageKey = userId && lectureId
        ? undefined  // Will use chatHistoryService
        : `luminary_chat_${lectureId || title?.replace(/\s+/g, '_')}`;

    const inferredLectureType = chatHistoryService.inferLectureType(lectureSourceType, title);

    const defaultGreeting: ChatMessage = { 
        id: 1, 
        role: "ai" as const,
        timestamp: Date.now(),
        content: minimal 
            ? (language === "ar" ? "اسألني أي أسئلة وسأقوم بالإجابة عليها بالتفصيل!" : "Ask me anything and I will explain it in detail!") 
            : (language === "ar"
                ? "أهلاً بك! أنا الـ AI Agent الخاص بك. حدّد أي نص في الـ PDF أو أوقف الفيديو عند أي لحظة لتسألني عنها مباشرة."
                : "Hi! I'm your AI Agent. Highlight any text in the PDF or pause the video at any moment to ask me about it directly.")
    };

    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        // Priority 1: userId-scoped service (new)
        if (userId && lectureId) {
            const session = chatHistoryService.getSession(userId, lectureId);
            if (session && session.messages.length > 0) return session.messages;
        }
        // Priority 2: legacy per-key localStorage
        if (storageKey) {
            try {
                const raw = localStorage.getItem(storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (parsed.length > 0) {
                        // Migrate legacy data to new format
                        const migrated = parsed.map((m: any) => ({ ...m, timestamp: m.timestamp ?? m.id }));
                        return migrated;
                    }
                }
            } catch {}
        }
        return [defaultGreeting];
    });

    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pptViewerVariant, setPptViewerVariant] = useState(0);
    const suggestions = useMemo(() => {
        const cleanTitle = title?.replace(/\.(pdf|pptx?|ppsx|docx?|doc|mp4|webm|mov|avi|mp3|wav|ogg)$/i, "") || "";
        
        if (language === "ar") {
            return [
                `هل يمكنك تلخيص المفاهيم الأساسية في "${cleanTitle}"؟`,
                `ما هي أهم النقاط التي يجب أن أركز عليها في هذه المحاضرة؟`,
                `اشرح لي أهم المصطلحات العلمية الواردة في "${cleanTitle}".`
            ];
        }
        return [
            `Can you summarize the core concepts in "${cleanTitle}"?`,
            `What are the most important points I should focus on in this lecture?`,
            `Explain the key technical terms mentioned in "${cleanTitle}".`
        ];
    }, [title, language]);
    const [isPanModifierActive, setIsPanModifierActive] = useState(false);
    const [isDraggingPan, setIsDraggingPan] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    type PendingContext =
        | { kind: "selection"; text: string; page?: number }
        | { kind: "moment"; time: string; seconds?: number; nearbyText?: string }
        | null;
    const [pendingContext, setPendingContext] = useState<PendingContext>(null);
    const [pdfFallback, setPdfFallback] = useState(false);
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

    useEffect(() => {
        if (hasDocumentContext) {
            setShowDocument(true);
        }
    }, [hasDocumentContext]);

    // Reset the PDF interactive/fallback state whenever the source changes.
    useEffect(() => {
        setPdfFallback(false);
    }, [sourceUrl]);

    // Initial message effect
    useEffect(() => {
        if (initialMessage && messages.length === 1) {
            const triggerInitialChat = async () => {
                const userMsg = { id: Date.now(), role: "user" as const, content: initialMessage, timestamp: Date.now() };
                setMessages(prev => [...prev, userMsg]);
                setIsLoading(true);

                try {
                    const reply = await chatWithAgent(transcript, userMsg.content, [], mode);
                    setMessages(prev => [...prev, { id: Date.now(), role: "ai" as const, content: reply, timestamp: Date.now() }]);
                } catch (error) {
                    setMessages(prev => [...prev, { id: Date.now(), role: "ai" as const, content: language === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred.", timestamp: Date.now() }]);
                } finally {
                    setIsLoading(false);
                }
            };
            triggerInitialChat();
        }
    }, [initialMessage, transcript, mode, language, messages.length]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isLoading]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                setIsPanModifierActive(true);
            }
        };

        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "Shift") {
                setIsPanModifierActive(false);
                setIsDraggingPan(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    // Persist to chatHistoryService whenever messages change
    useEffect(() => {
        if (userId && lectureId) {
            chatHistoryService.saveMessages(userId, lectureId, title, inferredLectureType, messages);
        } else if (storageKey) {
            // Legacy localStorage fallback
            localStorage.setItem(storageKey, JSON.stringify(messages));
        }
    }, [messages, userId, lectureId, title, inferredLectureType, storageKey]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert(language === "ar" ? "حجم الصورة يجب أن يكون أقل من 5 ميجابايت" : "Image size should be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const truncate = (s: string, n = 160) => (s.length > n ? s.slice(0, n).trim() + "…" : s);

    // Core sender used by the input box and the PDF-selection / video-moment shortcuts.
    const sendMessage = async (opts: {
        aiText: string;
        displayContent: string;
        image?: string | null;
        extra?: {
            selection?: { text: string; page?: number };
            videoMoment?: { time: string; seconds?: number; nearbyText?: string };
        };
    }) => {
        if (isLoading) return;
        const userMessage = {
            id: Date.now(),
            role: "user" as const,
            content: opts.displayContent,
            image: opts.image || undefined,
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const history = messages.filter(m => m.id !== 1).map(m => ({ role: m.role, content: m.content }));
            const relatedLecturesContext = (relatedLectures || []).map(l => ({
                id: l.id,
                title: l.title,
                summary: typeof l.summary === 'string' ? l.summary.substring(0, 500) : Array.isArray(l.summary) ? l.summary.slice(0, 4).join(' ') : '',
                category: l.category,
                sourceType: l.sourceType,
            }));
            const response = await chatWithAgent(
                transcript,
                opts.aiText,
                history,
                mode,
                opts.image || undefined,
                relatedLecturesContext.length > 0 ? relatedLecturesContext : undefined,
                opts.extra,
            );
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: "ai" as const,
                content: response || (isAr ? "عذراً، لم أستطع معالجة طلبك." : "Sorry, I couldn't process your request."),
                timestamp: Date.now(),
            }]);
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: "ai" as const,
                content: isAr ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." : "Connection error. Please try again.",
                timestamp: Date.now(),
            }]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!input.trim() && !selectedImage && !pendingContext) || isLoading) return;

        const typed = input.trim();
        let aiText = typed;
        let display = typed;
        let extra: { selection?: { text: string; page?: number }; videoMoment?: { time: string; seconds?: number; nearbyText?: string } } | undefined;

        if (pendingContext?.kind === "selection") {
            extra = { selection: { text: pendingContext.text, page: pendingContext.page } };
            const ref = isAr
                ? `📄 بخصوص تحديد من صفحة ${pendingContext.page ?? "?"}:\n"${truncate(pendingContext.text)}"`
                : `📄 Re: selection (p.${pendingContext.page ?? "?"}):\n"${truncate(pendingContext.text)}"`;
            display = typed ? `${ref}\n\n${typed}` : ref;
            if (!aiText) aiText = isAr ? "اشرح هذا المقطع المحدد بالتفصيل." : "Explain this selected passage in detail.";
        } else if (pendingContext?.kind === "moment") {
            extra = { videoMoment: { time: pendingContext.time, seconds: pendingContext.seconds, nearbyText: pendingContext.nearbyText } };
            const ref = isAr ? `🎬 بخصوص اللحظة ${pendingContext.time}` : `🎬 Re: moment ${pendingContext.time}`;
            display = typed ? `${ref}\n\n${typed}` : ref;
            if (!aiText) aiText = isAr ? "اشرح ما الذي يُشرح في هذه اللحظة من الفيديو." : "Explain what's being covered at this moment in the video.";
        }

        const img = selectedImage;
        setInput("");
        setSelectedImage(null);
        setPendingContext(null);
        await sendMessage({ aiText, displayContent: display, image: img, extra });
    };

    // PDF selection — "Explain" answers immediately; "Ask about this" stages the passage for a typed question.
    const handleAskSelection = ({ text, page, kind }: PdfAskPayload) => {
        if (kind === "explain") {
            const display = isAr
                ? `📄 اشرح هذا المقطع (صفحة ${page}):\n"${truncate(text)}"`
                : `📄 Explain this passage (p.${page}):\n"${truncate(text)}"`;
            const aiText = isAr
                ? `اشرح بالتفصيل هذا المقطع المحدد من صفحة ${page}.`
                : `Explain in detail this highlighted passage from page ${page}.`;
            sendMessage({ aiText, displayContent: display, extra: { selection: { text, page } } });
        } else {
            setPendingContext({ kind: "selection", text, page });
            inputRef.current?.focus();
        }
    };

    // Video moment — stage the timestamp so the student can type a specific question about it.
    const handleAskMoment = ({ time, seconds, nearbyText }: VideoMomentPayload) => {
        setPendingContext({ kind: "moment", time, seconds, nearbyText });
        inputRef.current?.focus();
    };

    const clearChat = () => {
        if (confirm(language === "ar" ? "هل أنت متأكد من مسح محادثات الإيجنت؟" : "Are you sure you want to clear the chat history?")) {
            setMessages([{ ...defaultGreeting, id: 1, timestamp: Date.now() }]);
            if (userId && lectureId) {
                chatHistoryService.clearSession(userId, lectureId);
            } else if (storageKey) {
                localStorage.removeItem(storageKey);
            }
        }
    };

    const inferredDocumentKind = (() => {
        const reference = `${sourceUrl || ""} ${title || ""}`.toLowerCase();
        let normalizedPath = "";

        if (sourceUrl) {
            try {
                // Handles absolute URLs with query strings (e.g., Firebase links).
                normalizedPath = decodeURIComponent(new URL(sourceUrl, window.location.origin).pathname).toLowerCase();
            } catch {
                normalizedPath = sourceUrl.toLowerCase().split("?")[0];
            }
        }

        const detectorText = `${reference} ${normalizedPath}`;
        if (detectorText.includes("youtube.com") || detectorText.includes("youtu.be")) return "youtube";
        if (/\.(pdf)\b/.test(detectorText)) return "pdf";
        if (/\.(pptx?|ppsx|docx?|doc)\b/.test(detectorText)) return "office";
        if (/\.(mp4|webm|mov|avi|mp3|wav|ogg)\b/.test(detectorText)) return "media";
        if (/\.(jpg|jpeg|png|gif|webp)\b/.test(detectorText)) return "image";
        return "unknown";
    })();

    const isVideoKind = inferredDocumentKind === "youtube" || inferredDocumentKind === "media";
    const isYouTube = inferredDocumentKind === "youtube" || /youtube\.com|youtu\.be/i.test(sourceUrl || "");

    const currentPage = 1;

    // Determine PDF/PPT/Video URL for viewer
    const getViewerUrl = (url: string) => {
        if (!url) return '';
        const lowerUrl = url.toLowerCase();
        
        // Handle YouTube
        if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
            let videoId = '';
            if (lowerUrl.includes('v=')) {
                videoId = url.split('v=')[1].split('&')[0];
            } else {
                videoId = url.split('/').pop() || '';
            }
            return `https://www.youtube.com/embed/${videoId}`;
        }

        if (inferredDocumentKind === "pdf" || (inferredDocumentKind === "unknown" && hasDocumentContext && !lowerUrl.match(/\.(pptx?|ppsx|docx?|doc)$/i))) {
            return `${url}#page=1&zoom=100`;
        }
        if (inferredDocumentKind === "office" && lowerUrl.match(/\.(pptx?|ppsx|docx?|doc)/i)) {
            const encoded = encodeURIComponent(url);
            const slideZeroBased = 0;
            const slideOneBased = 1;
            const variants = [
                `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}&wdSlideIndex=${slideZeroBased}`,
                `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}&wdSlideIndex=${slideOneBased}`,
                `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}&wdStartOn=${slideOneBased}`,
                `https://view.officeapps.live.com/op/embed.aspx?src=${encoded}&wdSlideIndex=${slideZeroBased}&wdStartOn=${slideOneBased}`,
            ];
            return variants[pptViewerVariant % variants.length];
        }
        if (lowerUrl.match(/\.(mp4|webm|mov|avi|mp3|wav|ogg)$/i)) return url; 
        if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return url;
        
        // For other Office-like files, use Google Docs Viewer
        return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true&page=${currentPage}`;
    };

    const viewerSrc = useMemo(() => {
        if (!sourceUrl) return "";
        return getViewerUrl(sourceUrl);
    }, [sourceUrl, pptViewerVariant, inferredDocumentKind, hasDocumentContext]);

    const viewerFrameKey = useMemo(() => {
        if (inferredDocumentKind === "pdf") {
            // Force remount for PDF so hash zoom/page changes are applied reliably.
            return `pdf-${viewerSrc}`;
        }
        return `viewer-${viewerSrc}`;
    }, [inferredDocumentKind, viewerSrc]);

    if (!transcript || transcript.length < 50) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[400px] border border-dashed rounded-xl bg-card/30">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "الـ AI Agent غير متاح بعد" : "AI Agent not available yet"}</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                    {language === "ar"
                        ? "ميزة المحادثة الذكية تعمل فقط بعد أن يتم استخراج نص المحاضرة."
                        : "The smart agent only works when the lecture transcript is available."}
                </p>
                {onClose && (
                    <Button variant="ghost" onClick={onClose} className="mt-4">
                        {language === "ar" ? "إغلاق" : "Close"}
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className={cn(
            "flex flex-col bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all duration-500",
            minimal ? "fixed inset-0 z-[100] h-full" : "h-full w-full",
            showDocument && hasDocumentContext ? "w-full" : "max-w-5xl mx-auto w-full"
        )}>
            <div className="flex flex-1 overflow-hidden h-full flex-col lg:flex-row">
                {/* Left Panel: Document / Video Viewer */}
                <AnimatePresence mode="wait">
                    {showDocument && hasDocumentContext && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.2 }}
                            className="flex flex-col bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 relative overflow-hidden w-full lg:w-1/2 h-[42vh] lg:h-full"
                        >
                            {/* Viewer Header */}
                            <div className="px-5 py-3.5 flex items-start justify-between gap-3 border-b border-slate-100 bg-white shrink-0">
                                <div className="min-w-0">
                                    <h3 className="text-slate-900 font-bold text-sm mb-0.5 flex items-center gap-2">
                                        {isVideoKind ? <Film className="w-4 h-4 text-[#F05A22]" /> : <FileText className="w-4 h-4 text-[#F05A22]" />}
                                        {isVideoKind ? (isAr ? "فيديو المحاضرة" : "Lecture Video") : (isAr ? "مستندك" : "Your Document")}
                                    </h3>
                                    <p className="text-slate-400 text-[11px] truncate">
                                        {isVideoKind
                                            ? (isAr ? "أوقف عند أي لحظة واسأل عنها" : "Pause at any moment and ask about it")
                                            : inferredDocumentKind === "pdf"
                                                ? (pdfFallback
                                                    ? (isAr ? "عرض أساسي — التحديد غير متاح لهذا الملف" : "Basic view — selection unavailable")
                                                    : (isAr ? "ظلّل أي نص لتسأل عنه" : "Highlight any text to ask about it"))
                                                : (isAr ? "اعرض مستندك بجانب المحادثة" : "View your document beside the chat")}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowDocument(false)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                                    title={isAr ? "إخفاء" : "Hide"}
                                    type="button"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Viewer Body */}
                            <div className="flex-1 overflow-hidden">
                                {!sourceUrl ? (
                                    <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                                            <FileText className="w-7 h-7 text-slate-300" />
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-700 mb-2">
                                            {isAr ? "رابط الملف غير متاح" : "Source link missing"}
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
                                            {isAr
                                                ? "هذا الملف رُفع قبل تحديث النظام. ارفع ملفاً جديداً لتفعيل العرض الجانبي."
                                                : "This file predates the update. Upload a new file to enable the side-by-side viewer."}
                                        </p>
                                    </div>
                                ) : inferredDocumentKind === "pdf" ? (
                                    <PdfReader url={sourceUrl} language={language} isRTL={isRTL} onAsk={handleAskSelection} onFallback={() => setPdfFallback(true)} />
                                ) : isVideoKind ? (
                                    <LectureVideo
                                        url={sourceUrl}
                                        isYouTube={isYouTube}
                                        transcript={transcript}
                                        language={language}
                                        isRTL={isRTL}
                                        onAskMoment={handleAskMoment}
                                    />
                                ) : (
                                    /* Office / other formats — embedded viewer (no in-place selection) */
                                    <div className="flex flex-col h-full bg-white">
                                        <div className="h-9 border-b border-slate-200 bg-slate-50 flex items-center justify-end px-3 shrink-0">
                                            <button
                                                onClick={() => setPptViewerVariant((prev) => prev + 1)}
                                                className="text-[10px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:text-[#F05A22] hover:border-[#F05A22]/30 transition-colors"
                                                type="button"
                                            >
                                                {isAr ? "إعادة المحاولة" : "Retry"}
                                            </button>
                                        </div>
                                        <iframe
                                            key={viewerFrameKey}
                                            src={viewerSrc}
                                            className="flex-1 w-full border-none bg-white"
                                            title="Lecture Document"
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Right Panel: Chat Interface */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
                    {/* Chat Header */}
                    <div className={cn("px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100", isRTL && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-3 min-w-0", isRTL && "flex-row-reverse")}>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#F05A22] to-[#f5793f] flex items-center justify-center shadow-lg shadow-[#F05A22]/20 shrink-0">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div className={cn("min-w-0", isRTL ? "text-right" : "text-left")}>
                                <h3 className="text-slate-900 font-black text-sm leading-tight flex items-center gap-2">
                                    AI Agent
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {isAr ? "متصل" : "Online"}
                                    </span>
                                </h3>
                                <p className="text-[11px] text-slate-400 truncate">
                                    {isAr ? "مساعدك الذكي لهذه المحاضرة" : "Your smart assistant for this lecture"}
                                </p>
                            </div>
                        </div>
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                            {hasDocumentContext && !showDocument && (
                                <button
                                    onClick={() => setShowDocument(true)}
                                    className="text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-lg border bg-slate-50 border-slate-200 text-slate-500 hover:text-[#F05A22] hover:border-[#F05A22]/30 hover:bg-[#F05A22]/5 transition-all flex items-center gap-2"
                                    title={language === "ar" 
                                        ? (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "إظهار الفيديو" : "إظهار المستند") 
                                        : (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "Show video" : "Show document")}
                                    type="button"
                                >
                                    <PanelLeftOpen className="w-3.5 h-3.5" />
                                    <span>
                                        {language === "ar" 
                                            ? (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "عرض الفيديو" : "عرض المستند") 
                                            : (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "View Video" : "View Document")}
                                    </span>
                                </button>
                            )}
                            <button onClick={clearChat} className="p-2 text-slate-400 hover:text-slate-600 transition-colors" title="Clear Chat">
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {onClose && (
                                <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Messages Area */}
                    <div 
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar scroll-smooth"
                    >
                        {useMemo(() => messages.map((message) => {
                            // Direction follows the message's OWN content, not the site language,
                            // so mixed Arabic/English chats stay readable and properly aligned.
                            const msgIsAr = /[؀-ۿ]/.test(message.content || "");
                            const dir = msgIsAr ? "rtl" : "ltr";
                            const alignText = msgIsAr ? "text-right" : "text-left";
                            return (
                            <motion.div
                                key={message.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "flex gap-4",
                                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "flex flex-col gap-1.5 max-w-[90%]",
                                    message.role === "user" ? "items-end" : "items-start"
                                )}>
                                    <div
                                        dir={dir}
                                        className={cn(
                                        "px-5 py-3 rounded-2xl text-[14px] leading-relaxed transition-all",
                                        message.role === "ai"
                                            ? "bg-slate-50 text-slate-800 border border-slate-100"
                                            : "bg-[#F05A22] text-white shadow-lg shadow-[#F05A22]/20"
                                    )}>
                                        {message.role === "ai" ? (
                                            <div className={cn("markdown-content prose prose-slate prose-sm max-w-none", alignText)} dir={dir}>
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        code: CodeBlock,
                                                        p: ({ children }) => <p dir={dir} className={cn("mb-3 leading-relaxed", alignText)}>{children}</p>,
                                                        li: ({ children }) => <li dir={dir} className={alignText}>{children}</li>
                                                    }}
                                                >
                                                    {message.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-3">
                                                {message.image && (
                                                    <div className="rounded-xl overflow-hidden border border-white/20 shadow-inner max-w-sm">
                                                        <img src={message.image} alt="User upload" className="w-full h-auto object-contain bg-black/5" />
                                                    </div>
                                                )}
                                                {message.content && <div className={cn("whitespace-pre-wrap", alignText)} dir={dir}>{message.content}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 px-1">
                                        {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                            );
                        }), [messages, language])}
                        {isLoading && (
                            <div className="flex gap-4">
                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#F05A22]/60 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#F05A22]/60 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#F05A22]/60 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Input Area */}
                    <div className="px-8 pb-8 pt-4">
                        {/* Prompt Suggestions */}
                        {!messages.some(m => m.role === "user") && (
                            <div className="flex flex-col gap-2 mb-6">
                                {suggestions.map((suggestion, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setInput(suggestion)}
                                        className="w-full py-3.5 px-6 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium text-center border border-slate-200 transition-all active:scale-[0.99]"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Pending context chip (PDF selection / video moment) */}
                        <AnimatePresence>
                            {pendingContext && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    className={cn(
                                        "mb-3 flex items-start gap-2.5 rounded-2xl border border-[#F05A22]/20 bg-[#F05A22]/5 px-4 py-2.5",
                                        isRTL && "flex-row-reverse text-right"
                                    )}
                                >
                                    <div className="w-7 h-7 rounded-xl bg-[#F05A22]/15 flex items-center justify-center shrink-0 text-[#F05A22]">
                                        {pendingContext.kind === "moment" ? <Film className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-wider text-[#F05A22]">
                                            {pendingContext.kind === "moment"
                                                ? (isAr ? `لحظة الفيديو · ${pendingContext.time}` : `Video moment · ${pendingContext.time}`)
                                                : (isAr ? `تحديد · صفحة ${pendingContext.page ?? "?"}` : `Selection · page ${pendingContext.page ?? "?"}`)}
                                        </p>
                                        <p className="text-xs text-slate-600 truncate leading-snug">
                                            {pendingContext.kind === "selection"
                                                ? `"${truncate(pendingContext.text, 90)}"`
                                                : (isAr ? "اكتب سؤالك عن هذه اللحظة" : "Type your question about this moment")}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPendingContext(null)}
                                        className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white transition-colors shrink-0"
                                        title={isAr ? "إزالة" : "Remove"}
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Box */}
                        <form onSubmit={handleSend} className="relative">
                            <AnimatePresence>
                                {selectedImage && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute bottom-full mb-4 left-0 p-3 bg-white rounded-2xl border border-slate-200 shadow-xl flex items-center gap-3 z-30"
                                    >
                                        <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-100 bg-slate-50">
                                            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => setSelectedImage(null)}
                                                className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <div className="pr-4">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {language === "ar" ? "صورة مرفقة" : "Attached Image"}
                                            </p>
                                            <p className="text-xs text-slate-600 font-medium truncate max-w-[120px]">
                                                {language === "ar" ? "جاهزة للتحليل..." : "Ready for analysis..."}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <input
                                type="file"
                                ref={imageInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                            />

                            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-2 focus-within:border-[#F05A22]/30 focus-within:bg-white transition-all shadow-sm">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={language === "ar" ? "اكتب سؤالك هنا..." : "Type a question here..."}
                                    className="w-full bg-transparent border-none focus:ring-0 text-slate-900 py-4 px-4 text-sm placeholder:text-slate-400"
                                    dir="auto"
                                />
                                <div className="flex items-center justify-end p-2 gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => imageInputRef.current?.click()}
                                        className={cn(
                                            "p-2 transition-colors rounded-lg",
                                            selectedImage ? "text-[#F05A22] bg-[#F05A22]/10" : "text-slate-400 hover:text-[#F05A22]"
                                        )}
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={(!input.trim() && !selectedImage) || isLoading}
                                        className="bg-[#F05A22] hover:bg-[#D44A1B] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-[#F05A22]/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

