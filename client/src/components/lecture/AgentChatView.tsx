import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Bot, User, Copy, Check, X, Mic, Trash2, Paperclip, FileText, PanelLeftOpen, BookOpen, Link2 } from "lucide-react";
import { chatWithAgent } from "@/lib/aiService";
import { chatHistoryService, type ChatMessage } from "@/lib/chatHistoryService";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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
    const { language } = useLanguage();
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
                ? "أهلاً بك أيها الطالب المجتهد! بصفتي المنسق الأكاديمي، يسعدني أن أقوم بتحليل محتوى المحاضرة المعقد وتبسيطه لك خطوة بخطوة." 
                : "Welcome! As your Academic Curator, I am here to break down complex lecture concepts step-by-step.") 
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
    const viewerContainerRef = useRef<HTMLDivElement>(null);
    const panStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

    useEffect(() => {
        if (hasDocumentContext) {
            setShowDocument(true);
        }
    }, [hasDocumentContext]);

    // Initial message effect
    useEffect(() => {
        if (initialMessage && messages.length === 1) {
            const triggerInitialChat = async () => {
                const userMsg = { id: Date.now(), role: "user" as const, content: initialMessage };
                setMessages(prev => [...prev, userMsg]);
                setIsLoading(true);

                try {
                    const reply = await chatWithAgent(userMsg.content, transcript, [], mode);
                    setMessages(prev => [...prev, { id: Date.now(), role: "ai", content: reply }]);
                } catch (error) {
                    setMessages(prev => [...prev, { id: Date.now(), role: "ai", content: language === "ar" ? "عذراً، حدث خطأ." : "Sorry, an error occurred." }]);
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

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userMessage = { 
            id: Date.now(), 
            role: "user" as const, 
            content: input.trim(),
            image: selectedImage || undefined
        };
        setMessages(prev => [...prev, userMessage]);
        
        const currentInput = input.trim();
        const currentImage = selectedImage;
        
        setInput("");
        setSelectedImage(null);
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
            const response = await chatWithAgent(transcript, currentInput, history, mode, currentImage || undefined, relatedLecturesContext.length > 0 ? relatedLecturesContext : undefined);
            
            const aiMessage = { 
                id: Date.now() + 1, 
                role: "ai" as const, 
                content: response || (language === "ar" ? "عذراً، لم أستطع معالجة طلبك." : "Sorry, I couldn't process your request.") 
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = { 
                id: Date.now() + 1, 
                role: "ai" as const, 
                content: language === "ar" ? "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى." : "Connection error. Please try again." 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
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
                <h3 className="text-xl font-semibold mb-2">{language === "ar" ? "المنسق الأكاديمي غير متاح بعد" : "Academic Curator not available yet"}</h3>
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
                {/* Left Panel: Document Viewer */}
                {useMemo(() => (
                    <AnimatePresence mode="wait">
                        {showDocument && hasDocumentContext && (
                            <motion.div 
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 relative overflow-hidden w-full lg:w-1/2 h-[42vh] lg:h-full"
                            >
                                {/* Document Header */}
                                <div className="px-6 py-5 flex items-start justify-between gap-3">
                                    <div>
                                    <h3 className="text-slate-900 font-bold text-lg mb-1">
                                        {language === "ar" 
                                            ? (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "فيديو المحاضرة" : "مستندك المرفوع") 
                                            : (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "Lecture Video" : "Your Uploaded Document")}
                                    </h3>
                                    <p className="text-slate-500 text-xs">
                                        {language === "ar" 
                                            ? (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" 
                                                ? "يمكنك مشاهدة الفيديو والدردشة مع المنسق في نفس الوقت." 
                                                : "حدد أي نص في ملف الـ PDF لفتح خيارات الشرح أو الدردشة.") 
                                            : (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" 
                                                ? "You can watch the video and chat with the curator at the same time." 
                                                : "Highlight any text in the PDF to open the Explain or Chat options.")}
                                    </p>
                                    </div>
                                    <button
                                        onClick={() => setShowDocument(false)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                        title={language === "ar" 
                                            ? (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "إخفاء الفيديو" : "إخفاء المستند") 
                                            : (inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "Hide video" : "Hide document")}
                                        type="button"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* PDF View Container */}
                                <div className="flex-1 px-4 pb-4 overflow-hidden flex flex-col">
                                    <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col shadow-sm">
                                        {/* Mock PDF Toolbar */}
                                        <div className="h-10 border-b border-slate-200 bg-slate-50 flex items-center justify-between px-3">
                                            <div />
                                            {inferredDocumentKind === "office" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setPptViewerVariant((prev) => prev + 1)}
                                                        className="text-[10px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:text-[#F05A22] hover:border-[#F05A22]/30 transition-colors"
                                                        title={language === "ar" ? "إعادة المحاولة للانتقال للسلايد" : "Retry slide jump"}
                                                        type="button"
                                                    >
                                                        {language === "ar" ? "إعادة المحاولة" : "Retry"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actual Document Content */}
                                        <div className="flex-1 relative bg-slate-50 p-4 overflow-y-auto custom-scrollbar">
                                            {sourceUrl ? (
                                                <div
                                                    ref={viewerContainerRef}
                                                    className="w-full h-full overflow-auto rounded-lg bg-white relative"
                                                >
                                                    {isPanModifierActive && (
                                                        <div
                                                            className={cn(
                                                                "absolute inset-0 z-20",
                                                                isDraggingPan ? "cursor-grabbing" : "cursor-grab"
                                                            )}
                                                            onMouseDown={(e) => {
                                                                if (e.button !== 0) return;
                                                                const container = viewerContainerRef.current;
                                                                if (!container) return;
                                                                setIsDraggingPan(true);
                                                                panStartRef.current = {
                                                                    x: e.clientX,
                                                                    y: e.clientY,
                                                                    scrollLeft: container.scrollLeft,
                                                                    scrollTop: container.scrollTop,
                                                                };
                                                                e.preventDefault();
                                                            }}
                                                            onMouseMove={(e) => {
                                                                if (!isDraggingPan) return;
                                                                const container = viewerContainerRef.current;
                                                                if (!container) return;
                                                                const dx = e.clientX - panStartRef.current.x;
                                                                const dy = e.clientY - panStartRef.current.y;
                                                                container.scrollLeft = panStartRef.current.scrollLeft - dx;
                                                                container.scrollTop = panStartRef.current.scrollTop - dy;
                                                            }}
                                                            onMouseUp={() => setIsDraggingPan(false)}
                                                            onMouseLeave={() => setIsDraggingPan(false)}
                                                        />
                                                    )}
                                                    <div
                                                        className="w-full h-full origin-top-left transition-all duration-200 ease-out"
                                                    >
                                                        <iframe 
                                                            key={viewerFrameKey}
                                                            src={viewerSrc}
                                                            className="w-full h-full border-none rounded-lg shadow-sm bg-white"
                                                            title={inferredDocumentKind === "youtube" || inferredDocumentKind === "media" ? "Lecture Video" : "Lecture Document"}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full p-12 text-center">
                                                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                                        <X className="w-8 h-8 text-zinc-600" />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white mb-2">
                                                        {language === "ar" ? "رابط الملف غير متاح" : "Source Link Missing"}
                                                    </h4>
                                                    <p className="text-xs text-zinc-500 leading-relaxed max-w-[240px]">
                                                        {language === "ar" 
                                                            ? "هذا الملف تم رفعه قبل تحديث النظام. يرجى رفع ملف جديد للاستمتاع بخاصية العرض الجانبي." 
                                                            : "This file was uploaded before the system update. Please upload a new file to enable split-screen viewing."}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                ), [showDocument, hasDocumentContext, language, inferredDocumentKind, viewerFrameKey, viewerSrc, isPanModifierActive, isDraggingPan, pptViewerVariant, sourceUrl])}

                {/* Right Panel: Chat Interface */}
                <div className="flex-1 flex flex-col min-w-0 bg-white relative h-full">
                    {/* Chat Header */}
                    <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-slate-50">
                        <h3 className="text-slate-800 font-medium text-sm">
                            {language === "ar" ? "اسألني أي سؤال عن ملاحظاتك أو المحتوى!" : "Ask me any question about your notes or content!"}
                        </h3>
                        <div className="flex items-center gap-3">
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
                        {useMemo(() => messages.map((message) => (
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
                                    <div className={cn(
                                        "px-5 py-3 rounded-2xl text-[14px] leading-relaxed transition-all",
                                        message.role === "ai" 
                                            ? "bg-slate-50 text-slate-800 border border-slate-100" 
                                            : "bg-[#F05A22] text-white shadow-lg shadow-[#F05A22]/20"
                                    )}>
                                        {message.role === "ai" ? (
                                            <div className="markdown-content prose prose-slate prose-sm max-w-none">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        code: CodeBlock,
                                                        p: ({ children }) => <p dir="auto" className={`mb-3 leading-relaxed ${language === "ar" ? "text-right" : "text-left"}`}>{children}</p>,
                                                        li: ({ children }) => <li dir="auto" className={language === "ar" ? "text-right" : "text-left"}>{children}</li>
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
                                                {message.content && <div className="whitespace-pre-wrap" dir="auto">{message.content}</div>}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 px-1">
                                        {new Date(message.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </motion.div>
                        )), [messages, language])}
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

