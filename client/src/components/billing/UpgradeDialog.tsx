import { Link } from "wouter";
import { Clock, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { formatResetIn, type UsageStatus } from "@/hooks/useUsage";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usage?: UsageStatus | null;
}

/** Shown when a Free user has used all of today's analyses. */
export default function UpgradeDialog({ open, onOpenChange, usage }: UpgradeDialogProps) {
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";
  const resetIn = formatResetIn(usage?.resetAt, ar);
  const limit = usage?.limit ?? 3;

  const perks = ar
    ? ["تحليلات غير محدودة يوميًا", "جميع أدوات الدراسة والشرائح", "أولوية في المعالجة"]
    : ["Unlimited analyses every day", "All study tools and slide exports", "Priority processing"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-w-md rounded-3xl p-0 overflow-hidden gap-0">
        <DialogHeader className={cn("px-6 pt-7 pb-2", isRTL && "text-right sm:text-right")}>
          <DialogTitle className="text-xl font-extrabold tracking-tight">
            {ar ? "لقد استخدمت تحليلاتك المجانية اليوم" : "You've used today's free analyses"}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {ar
              ? `تتيح الخطة المجانية ${limit} تحليلات كل 24 ساعة. قم بالترقية إلى Pro للمتابعة الآن.`
              : `The Free plan includes ${limit} analyses every 24 hours. Upgrade to Pro to keep going now.`}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {resetIn && (
            <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                {ar ? `تتجدد محاولاتك المجانية خلال ${resetIn}` : `Your free analyses reset in ${resetIn}`}
              </span>
            </div>
          )}
          <ul className="space-y-2">
            {perks.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm font-medium text-on-surface">
                <span className="grid place-items-center h-5 w-5 rounded-full bg-primary/10 text-primary shrink-0">
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 px-6 pb-6 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1 py-3 rounded-2xl text-sm font-bold border border-border hover:bg-surface-container-low transition-colors"
          >
            {ar ? "لاحقًا" : "Maybe later"}
          </button>
          <Link
            href="/pricing"
            onClick={() => onOpenChange(false)}
            className="flex-[1.4] grid place-items-center py-3 rounded-2xl text-sm font-bold text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            {ar ? "الترقية إلى Pro" : "Upgrade to Pro"}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
