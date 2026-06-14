import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock, User, GraduationCap, Briefcase, Presentation, Sparkles, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/auth/AuthShell";

type Role = "student" | "educator" | "professional" | "learner";

export default function SignUp() {
  const { signUp, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1); // 1 = about you, 2 = credentials
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const calcStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (pwd.length >= 12) s++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^a-zA-Z\d]/.test(pwd)) s++;
    return Math.min(s, 4);
  };

  const t = {
    step: language === "ar" ? "الخطوة" : "Step",
    of: language === "ar" ? "من" : "of",
    // step 1
    aboutTitle: language === "ar" ? "لنبدأ بالتعرّف عليك" : "Let's get to know you",
    aboutSub: language === "ar" ? "نخصّص تجربتك بناءً على هدفك من التعلّم." : "We'll tailor your experience to how you learn.",
    firstName: language === "ar" ? "الاسم الأول" : "First name",
    lastName: language === "ar" ? "اسم العائلة" : "Last name",
    roleQuestion: language === "ar" ? "أيهما يصفك أكثر؟" : "What best describes you?",
    roles: {
      student: language === "ar" ? "طالب" : "Student",
      educator: language === "ar" ? "معلّم" : "Educator",
      professional: language === "ar" ? "محترف" : "Professional",
      learner: language === "ar" ? "متعلّم ذاتي" : "Lifelong learner",
    } as Record<Role, string>,
    continue: language === "ar" ? "متابعة" : "Continue",
    // step 2
    accountTitle: language === "ar" ? "أنشئ حسابك" : "Create your account",
    accountSub: language === "ar" ? "خطوة أخيرة لتبدأ رحلتك مع LectureMate." : "One last step to start with LectureMate.",
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    password: language === "ar" ? "كلمة المرور" : "Password",
    createAccount: language === "ar" ? "إنشاء الحساب" : "Create account",
    creating: language === "ar" ? "جاري الإنشاء..." : "Creating account...",
    back: language === "ar" ? "رجوع" : "Back",
    pwStrength: language === "ar" ? "قوة كلمة المرور:" : "Password strength:",
    pwLabels: [
      "",
      language === "ar" ? "ضعيفة" : "Weak",
      language === "ar" ? "متوسطة" : "Fair",
      language === "ar" ? "جيدة" : "Good",
      language === "ar" ? "قوية" : "Strong",
    ],
    orContinue: language === "ar" ? "أو سجّل عبر" : "or sign up with",
    haveAccount: language === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?",
    signIn: language === "ar" ? "تسجيل الدخول" : "Sign in",
    success: language === "ar" ? "تم إنشاء حسابك! 🎉" : "Account created! 🎉",
    successDesc: language === "ar" ? "أهلاً بك في LectureMate." : "Welcome to LectureMate.",
    error: language === "ar" ? "خطأ" : "Error",
    errorDesc: language === "ar" ? "فشل إنشاء الحساب. حاول مرة أخرى." : "Failed to create account. Please try again.",
    fillStep1: language === "ar" ? "أدخل اسمك واختر ما يصفك." : "Enter your name and pick what describes you.",
  };

  const roleOptions: { id: Role; icon: React.ReactNode }[] = [
    { id: "student", icon: <GraduationCap className="w-5 h-5" /> },
    { id: "educator", icon: <Presentation className="w-5 h-5" /> },
    { id: "professional", icon: <Briefcase className="w-5 h-5" /> },
    { id: "learner", icon: <Sparkles className="w-5 h-5" /> },
  ];

  const goToStep2 = () => {
    if (!firstName.trim() || !role) {
      toast({ title: t.error, description: t.fillStep1, variant: "destructive" });
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const displayName = `${firstName} ${lastName}`.trim();
      await signUp(email, password, displayName || undefined);
      try {
        localStorage.setItem("lecturemate_onboarding", JSON.stringify({ role, firstName: firstName.trim() }));
      } catch { /* ignore */ }
      toast({ title: t.success, description: t.successDesc });
    } catch (error: any) {
      toast({ title: t.error, description: error.message || t.errorDesc, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      if (role) {
        try { localStorage.setItem("lecturemate_onboarding", JSON.stringify({ role, firstName: firstName.trim() })); } catch { /* ignore */ }
      }
      toast({ title: t.success, description: t.successDesc });
    } catch (error: any) {
      toast({ title: t.error, description: error.message || t.errorDesc, variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const strengthColor = passwordStrength <= 1 ? "bg-red-500" : passwordStrength === 2 ? "bg-yellow-500" : passwordStrength === 3 ? "bg-blue-500" : "bg-green-500";
  const strengthText = passwordStrength <= 1 ? "text-red-500" : passwordStrength === 2 ? "text-yellow-500" : passwordStrength === 3 ? "text-blue-500" : "text-green-500";

  return (
    <AuthShell>
      <div className={cn(isRTL ? "text-right" : "text-left")}>
        {/* Progress */}
        <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t.step} {step} {t.of} 2</span>
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <motion.div className="h-full rounded-full bg-[#F05A22]" animate={{ width: `${step * 50}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: isRTL ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 16 : -16 }} transition={{ duration: 0.25 }}>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.aboutTitle}</h1>
              <p className="text-slate-500 mt-2 font-medium">{t.aboutSub}</p>

              <div className="mt-7 grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">{t.firstName}</Label>
                  <div className="relative">
                    <User className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRTL ? "right-3.5" : "left-3.5")} />
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={language === "ar" ? "محمد" : "John"} dir={isRTL ? "rtl" : "ltr"} className={cn("h-12 rounded-xl border-slate-200 focus-visible:ring-[#F05A22]/30 focus-visible:border-[#F05A22]", isRTL ? "pr-10" : "pl-10")} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">{t.lastName}</Label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={language === "ar" ? "أحمد" : "Doe"} dir={isRTL ? "rtl" : "ltr"} className="h-12 rounded-xl border-slate-200 focus-visible:ring-[#F05A22]/30 focus-visible:border-[#F05A22]" />
                </div>
              </div>

              <div className="mt-6">
                <Label className="text-sm font-bold text-slate-700">{t.roleQuestion}</Label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {roleOptions.map((r) => {
                    const active = role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={cn(
                          "relative flex items-center gap-3 p-3.5 rounded-2xl border-2 text-sm font-bold transition-all text-start",
                          active ? "border-[#F05A22] bg-[#F05A22]/5 text-[#F05A22]" : "border-slate-200 text-slate-600 hover:border-slate-300",
                          isRTL && "flex-row-reverse text-right",
                        )}
                      >
                        <span className={cn("shrink-0", active ? "text-[#F05A22]" : "text-slate-400")}>{r.icon}</span>
                        <span className="flex-1">{t.roles[r.id]}</span>
                        {active && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={goToStep2} className="mt-7 w-full h-12 rounded-xl bg-slate-900 hover:bg-[#F05A22] text-white font-black text-[15px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99]">
                <span className="flex items-center gap-2">
                  {t.continue}
                  <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                </span>
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider"><span className="bg-[#FAFAF8] px-3 text-slate-400 font-bold">{t.orContinue}</span></div>
              </div>

              <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isGoogleLoading} className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-bold text-slate-700">
                {isGoogleLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <span className={cn("flex items-center gap-2.5", isRTL && "flex-row-reverse")}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {language === "ar" ? "Google" : "Google"}
                  </span>
                )}
              </Button>

              <p className="text-sm text-slate-500 mt-6 text-center font-medium">
                {t.haveAccount}{" "}
                <Link href="/sign-in" className="text-[#F05A22] hover:underline font-bold">{t.signIn}</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: isRTL ? -16 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isRTL ? 16 : -16 }} transition={{ duration: 0.25 }}>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {t.accountTitle}{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-slate-500 mt-2 font-medium">{t.accountSub}</p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">{t.email}</Label>
                  <div className="relative">
                    <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRTL ? "right-3.5" : "left-3.5")} />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={language === "ar" ? "example@email.com" : "you@example.com"} required dir={isRTL ? "rtl" : "ltr"} className={cn("h-12 rounded-xl border-slate-200 focus-visible:ring-[#F05A22]/30 focus-visible:border-[#F05A22]", isRTL ? "pr-10" : "pl-10")} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-bold text-slate-700">{t.password}</Label>
                  <div className="relative">
                    <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRTL ? "right-3.5" : "left-3.5")} />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setPasswordStrength(calcStrength(e.target.value)); }}
                      placeholder="••••••••"
                      required
                      dir={isRTL ? "rtl" : "ltr"}
                      className={cn("h-12 rounded-xl border-slate-200 focus-visible:ring-[#F05A22]/30 focus-visible:border-[#F05A22]", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors", isRTL ? "left-3.5" : "right-3.5")}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className={cn("flex items-center justify-between text-xs", isRTL && "flex-row-reverse")}>
                        <span className="text-slate-400 font-medium">{t.pwStrength}</span>
                        <span className={cn("font-bold", strengthText)}>{t.pwLabels[passwordStrength]}</span>
                      </div>
                      <div className="flex gap-1 h-1.5">
                        {[1, 2, 3, 4].map((lvl) => (
                          <div key={lvl} className={cn("flex-1 rounded-full transition-all", lvl <= passwordStrength ? strengthColor : "bg-slate-200")} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={cn("flex gap-3", isRTL && "flex-row-reverse")}>
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-12 px-5 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50">
                    <ArrowLeft className={cn("w-4 h-4", isRTL && "rotate-180")} />
                    {t.back}
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1 h-12 rounded-xl bg-slate-900 hover:bg-[#F05A22] text-white font-black text-[15px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99]">
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                        {t.creating}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {t.createAccount}
                        <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
                      </span>
                    )}
                  </Button>
                </div>
              </form>

              <p className="text-sm text-slate-500 mt-6 text-center font-medium">
                {t.haveAccount}{" "}
                <Link href="/sign-in" className="text-[#F05A22] hover:underline font-bold">{t.signIn}</Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AuthShell>
  );
}
