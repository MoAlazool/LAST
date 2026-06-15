import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AuthShell } from "@/components/auth/AuthShell";

export default function SignIn() {
  const { signIn, signInWithGoogle, user } = useAuth();
  const { toast } = useToast();
  const { language, isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Once authenticated, leave the auth screens.
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const t = {
    welcome: language === "ar" ? "مرحباً بعودتك 👋" : "Welcome back 👋",
    description: language === "ar" ? "سجّل الدخول لمتابعة دراستك الذكية." : "Sign in to continue your smart study journey.",
    email: language === "ar" ? "البريد الإلكتروني" : "Email",
    password: language === "ar" ? "كلمة المرور" : "Password",
    forgotPassword: language === "ar" ? "نسيت كلمة المرور؟" : "Forgot password?",
    signIn: language === "ar" ? "تسجيل الدخول" : "Sign In",
    signingIn: language === "ar" ? "جاري تسجيل الدخول..." : "Signing in...",
    orContinue: language === "ar" ? "أو تابع باستخدام" : "or continue with",
    noAccount: language === "ar" ? "ليس لديك حساب؟" : "Don't have an account?",
    signUp: language === "ar" ? "أنشئ حساباً" : "Create one",
    success: language === "ar" ? "أهلاً بك!" : "Welcome!",
    successDesc: language === "ar" ? "تم تسجيل الدخول بنجاح." : "You've been signed in successfully.",
    error: language === "ar" ? "خطأ" : "Error",
    errorDesc: language === "ar" ? "فشل تسجيل الدخول. تحقق من بياناتك." : "Failed to sign in. Check your details.",
    googleError: language === "ar" ? "فشل تسجيل الدخول عبر Google." : "Failed to sign in with Google.",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signIn(email, password);
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
      toast({ title: t.success, description: t.successDesc });
    } catch (error: any) {
      toast({ title: t.error, description: error.message || t.googleError, variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className={cn(isRTL ? "text-right" : "text-left")}>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t.welcome}</h1>
        <p className="text-slate-500 mt-2 font-medium">{t.description}</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-bold text-slate-700">{t.email}</Label>
            <div className="relative">
              <Mail className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRTL ? "right-3.5" : "left-3.5")} />
              <Input
                id="email"
                type="email"
                placeholder={language === "ar" ? "example@email.com" : "you@example.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir={isRTL ? "rtl" : "ltr"}
                className={cn("h-12 rounded-xl border-slate-200 focus-visible:ring-[#F05A22]/30 focus-visible:border-[#F05A22]", isRTL ? "pr-10" : "pl-10")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className={cn("flex items-center justify-between")}>
              <Label htmlFor="password" className="text-sm font-bold text-slate-700">{t.password}</Label>
              <Link href="#" className="text-xs font-bold text-[#F05A22] hover:underline">{t.forgotPassword}</Link>
            </div>
            <div className="relative">
              <Lock className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400", isRTL ? "right-3.5" : "left-3.5")} />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                dir={isRTL ? "rtl" : "ltr"}
                className={cn("h-12 rounded-xl border-slate-200 focus-visible:ring-[#F05A22]/30 focus-visible:border-[#F05A22]", isRTL ? "pr-10 pl-10" : "pl-10 pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors", isRTL ? "left-3.5" : "right-3.5")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full h-12 rounded-xl bg-slate-900 hover:bg-[#F05A22] text-white font-black text-[15px] shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                {t.signingIn}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                {t.signIn}
                <ArrowRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
              </span>
            )}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#FAFAF8] px-3 text-slate-400 font-bold">{t.orContinue}</span>
          </div>
        </div>

        <Button
          variant="outline"
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full h-12 rounded-xl border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-bold text-slate-700"
        >
          {isGoogleLoading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <span className={cn("flex items-center gap-2.5")}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {language === "ar" ? "المتابعة عبر Google" : "Continue with Google"}
            </span>
          )}
        </Button>

        <p className={cn("text-sm text-slate-500 mt-7 text-center font-medium")}>
          {t.noAccount}{" "}
          <Link href="/sign-up" className="text-[#F05A22] hover:underline font-bold">{t.signUp}</Link>
        </p>
      </div>
    </AuthShell>
  );
}
