import { Cpu, Globe, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface ProcessingModeSelectorProps {
  selectedMode: "gpu" | "api";
  onChange: (mode: "gpu" | "api") => void;
  disabled?: boolean;
}

export default function ProcessingModeSelector({
  selectedMode,
  onChange,
  disabled,
}: ProcessingModeSelectorProps) {
  const { language, isRTL } = useLanguage();

  const modes = {
    api: {
      icon: Globe,
      name: language === "ar" ? "API الذكي" : "Smart API",
      desc: language === "ar" ? "سحابي · موصى به" : "Cloud · Recommended",
    },
    gpu: {
      icon: Cpu,
      name: language === "ar" ? "GPU المحلي" : "Local GPU",
      desc: language === "ar" ? "أداء عالٍ · محلي" : "High performance · Local",
    },
  } as const;

  const current = modes[selectedMode];
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "group inline-flex items-center gap-2 rounded-full border border-outline-variant/70 bg-surface-container-low pl-2.5 pr-2 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-high disabled:opacity-50",
            isRTL && "flex-row-reverse",
          )}
        >
          <span className="grid place-items-center h-5 w-5 rounded-full bg-[#F05A22]/10 text-[#F05A22]">
            <CurrentIcon size={12} strokeWidth={2.5} />
          </span>
          <span className="whitespace-nowrap">{current.name}</span>
          <ChevronDown size={14} className="text-on-surface-variant" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-60 p-1.5">
        {(["api", "gpu"] as const).map((key) => {
          const m = modes[key];
          const Icon = m.icon;
          const active = selectedMode === key;
          return (
            <DropdownMenuItem
              key={key}
              onSelect={() => onChange(key)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 cursor-pointer",
                active && "bg-[#F05A22]/[0.06]",
              )}
            >
              <span
                className={cn(
                  "grid place-items-center h-8 w-8 rounded-lg shrink-0",
                  active ? "bg-[#F05A22]/15 text-[#F05A22]" : "bg-surface-container-high text-on-surface-variant",
                )}
              >
                <Icon size={16} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-on-surface">{m.name}</span>
                <span className="block text-[11px] text-on-surface-variant">{m.desc}</span>
              </span>
              {active && <Check size={16} className="text-[#F05A22] shrink-0" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
