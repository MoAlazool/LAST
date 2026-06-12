import { Sidebar, SidebarContent } from "./Sidebar";
import { ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Video } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "wouter";

export function AppLayout({ children, currentTab }: { children: ReactNode, currentTab?: string }) {
  const { isRTL } = useLanguage();

  return (
    <div className={`flex min-h-screen bg-background font-sans ${isRTL ? "flex-row-reverse" : ""}`}>
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center justify-between p-4 border-b bg-sidebar ${isRTL ? "flex-row-reverse" : ""}`}>
          <Link href="/" className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""} cursor-pointer hover:opacity-80 transition-opacity`}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Video size={18} strokeWidth={3} />
            </div>
            <span className="font-bold text-lg tracking-tight">LectureMate</span>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-72 bg-sidebar border-sidebar-border" style={isRTL ? { borderLeft: "1px solid" } : { borderRight: "1px solid" }}>
              <SidebarContent currentTab={currentTab} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
