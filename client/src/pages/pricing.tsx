import { Check, Clock } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useUsage, formatResetIn } from "@/hooks/useUsage";
import { cn } from "@/lib/utils";

/** Free vs Pro. Payments aren't wired yet — "Upgrade" explains how to get Pro for now. */
export default function Pricing() {
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";
  const { toast } = useToast();
  const { usage } = useUsage();
  const isPro = usage?.plan === "pro";
  const limit = usage?.limit ?? 3;

  const plans = [
    {
      key: "free",
      name: ar ? "المجانية" : "Free",
      price: ar ? "0$" : "$0",
      period: ar ? "دائمًا" : "forever",
      desc: ar ? "لتجربة LectureMate على محاضراتك." : "Try LectureMate on your own lectures.",
      features: ar
        ? [`${limit} تحليلات كل 24 ساعة`, "الملخص والبطاقات والاختبارات", "تحميل الشرائح بصيغة PowerPoint"]
        : [`${limit} analyses every 24 hours`, "Summaries, flashcards and quizzes", "PowerPoint slide downloads"],
      current: !isPro,
    },
    {
      key: "pro",
      name: "Pro",
      price: ar ? "قريبًا" : "Soon",
      period: "",
      desc: ar ? "للطلاب وأعضاء هيئة التدريس الذين يعملون يوميًا." : "For students and faculty who work with lectures daily.",
      features: ar
        ? ["تحليلات غير محدودة", "كل ما في الخطة المجانية", "أولوية في المعالجة", "دعم مباشر"]
        : ["Unlimited analyses", "Everything in Free", "Priority processing", "Direct support"],
      current: isPro,
    },
  ];

  const requestPro = () =>
    toast({
      title: ar ? "الدفع الإلكتروني قريبًا" : "Online payment is coming soon",
      description: ar
        ? "للترقية الآن، تواصل مع فريق LectureMate وسنفعّل خطة Pro لحسابك."
        : "To upgrade now, contact the LectureMate team and we'll enable Pro on your account.",
    });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto w-full py-4 sm:py-6" dir={isRTL ? "rtl" : "ltr"}>
        <header className={cn("mb-10", isRTL ? "text-right" : "text-left")}>
          <h1 className="text-3xl font-extrabold tracking-tight font-headline text-on-surface">
            {ar ? "الخطط" : "Plans"}
          </h1>
          <p className="text-on-surface-variant mt-2">
            {ar ? "اختر الخطة المناسبة لطريقة دراستك." : "Choose the plan that fits how you study."}
          </p>
          {usage && !isPro && usage.limit !== null && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface-container-low border border-border px-3.5 py-1.5 text-sm text-on-surface-variant">
              <Clock className="w-4 h-4" />
              {ar
                ? `متبقٍ ${usage.remaining} من ${usage.limit}${usage.resetAt ? ` · تتجدد خلال ${formatResetIn(usage.resetAt, ar)}` : ""}`
                : `${usage.remaining} of ${usage.limit} left${usage.resetAt ? ` · resets in ${formatResetIn(usage.resetAt, ar)}` : ""}`}
            </p>
          )}
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          {plans.map((p) => (
            <section
              key={p.key}
              className={cn(
                "rounded-3xl border bg-surface-container-lowest p-7 flex flex-col",
                p.key === "pro" ? "border-primary/40 shadow-[0_12px_40px_rgba(240,90,34,0.08)]" : "border-border",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-on-surface">{p.name}</h2>
                {p.current && (
                  <span className="text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-1 bg-surface-container-low text-on-surface-variant border border-border">
                    {ar ? "خطتك الحالية" : "Current plan"}
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold tracking-tight text-on-surface">{p.price}</span>
                {p.period && <span className="text-sm text-on-surface-variant">/ {p.period}</span>}
              </div>
              <p className="mt-2 text-sm text-on-surface-variant">{p.desc}</p>
              <ul className="mt-6 space-y-3 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-on-surface">
                    <Check className={cn("w-4 h-4 shrink-0", p.key === "pro" ? "text-primary" : "text-on-surface-variant")} strokeWidth={2.5} />
                    {f}
                  </li>
                ))}
              </ul>
              {p.key === "pro" && !isPro && (
                <button
                  type="button"
                  onClick={requestPro}
                  className="mt-8 w-full py-3 rounded-2xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
                >
                  {ar ? "الترقية إلى Pro" : "Upgrade to Pro"}
                </button>
              )}
            </section>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
