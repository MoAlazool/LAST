import LectureMateStudioShell from "@/components/lecture-mate-studio/LectureMateStudioShell";

export default function Dashboard() {
  return (
    <div className="lecture-mate-dashboard-ui min-h-screen bg-surface text-on-surface font-sans antialiased selection:bg-primary/10 selection:text-primary">
      <LectureMateStudioShell />
    </div>
  );
}
