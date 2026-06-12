import { Link } from "wouter";

const footLink =
  "hover:text-primary transition-colors no-underline text-inherit";

export default function Footer() {
  return (
    <footer className="mt-16 sm:mt-20 px-8 sm:px-12 py-12 bg-[#eceef1] rounded-t-[1.75rem] border-t border-outline-variant/40">
      <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b border-outline-variant/20 pb-12">
        <div className="max-w-xs">
          <h2 className="text-2xl font-extrabold text-primary mb-3 font-['Merriweather',Georgia,serif] tracking-tight">
            Lecture Mate
          </h2>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            The premier academic curator for the modern scholar. Transforming
            chaos into clarity, one lecture at a time.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center py-10 gap-6">
        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          © {new Date().getFullYear()} Lecture Mate Inc. All rights reserved.
        </p>

      </div>
    </footer>
  );
}
