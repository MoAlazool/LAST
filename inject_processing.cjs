const fs = require('fs');

const path = 'm:\\LECTUREMATEPR-main\\client\\src\\pages\\lecture-view.tsx';
const content = fs.readFileSync(path, 'utf8');

const targetReturn = `  return (
    <AppLayout>
      <div className="space-y-8 pb-20">`;

const idx = content.indexOf(targetReturn);
if (idx === -1) {
    console.log("Could not find targetReturn. Maybe it was already updated or formatting differs.");
    process.exit(1);
}

const processingView = `  const isTaskComplete = (taskName: string) => {
    if (!lecture) return false;
    const progress = lecture.progress || 0;
    switch(taskName) {
      case 'transcript': return progress >= 40 || !!(lecture.transcript && lecture.transcript.length > 0);
      case 'summary': return progress >= 60 || !!(lecture.summary && lecture.summary.length > 0);
      case 'conceptMap': return progress >= 70 || !!lecture.conceptMap;
      case 'quiz': return progress >= 80 || !!(lecture.quiz_sets && Object.values(lecture.quiz_sets).some((s: any) => s.length > 0));
      case 'slides': return progress >= 90 || !!(lecture.slides && lecture.slides.length > 0);
      case 'flashcards': return progress >= 100 || !!(lecture.flashcards && lecture.flashcards.length > 0);
      case 'formulas': return progress >= 80 || !!(lecture.formulas && lecture.formulas.length > 0);
      case 'images': return progress >= 40 || !!(lecture.extractedImages && lecture.extractedImages.length > 0);
      default: return false;
    }
  };

  const completedTasksCount = [
    isTaskComplete('transcript'),
    isTaskComplete('summary'),
    isTaskComplete('conceptMap'),
    isTaskComplete('quiz'),
    isTaskComplete('slides'),
    isTaskComplete('formulas'),
    isTaskComplete('flashcards'),
    isTaskComplete('images')
  ].filter(Boolean).length;

  if (lecture.status === "processing") {
    return (
      <AppLayout>
        <main className="flex-1 p-4 lg:p-8 font-display bg-[#F8F9FA] dark:bg-background-dark min-h-screen">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                <a className="hover:text-primary transition-colors" href="#">Courses</a>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
                <span className="text-slate-500 uppercase">{lecture.category || "General"}</span>
              </nav>
              <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">AI Analysis Agent</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Processing: <span className="text-slate-900 dark:text-white font-bold">{lecture.title}</span></p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Processing
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Processing Content */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    Generation Tasks
                  </h2>
                  <span className="text-sm font-semibold text-slate-500">{completedTasksCount} of 8 Tasks Completed</span>
                </div>
                
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {/* Task 1: Transcript */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('transcript') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">description</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Smart Transcript</h3>
                        {isTaskComplete('transcript') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('transcript') ? "bg-emerald-500 w-full" : "bg-primary w-1/2 transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('transcript') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 2: AI Summary */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('summary') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">AI Summary</h3>
                        {isTaskComplete('summary') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('summary') ? "bg-emerald-500 w-full" : "bg-primary w-[60%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('summary') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 3: Mindmap */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('conceptMap') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">account_tree</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Interactive Mindmap</h3>
                        {isTaskComplete('conceptMap') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing... 65%</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('conceptMap') ? "bg-emerald-500 w-full" : "bg-primary w-[65%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('conceptMap') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 4: Quizzes */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('quiz') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">quiz</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Knowledge Check</h3>
                        {isTaskComplete('quiz') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('quiz') ? "bg-emerald-500 w-full" : "bg-primary w-[42%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('quiz') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 5: Slides */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('slides') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">present_to_all</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Lecture Slides</h3>
                        {isTaskComplete('slides') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('slides') ? "bg-emerald-500 w-full" : "bg-primary w-[10%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('slides') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 6: Formulas */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('formulas') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">functions</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Formulas & Equations</h3>
                        {isTaskComplete('formulas') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('formulas') ? "bg-emerald-500 w-full" : "bg-primary w-[5%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('formulas') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 7: Flashcards */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('flashcards') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">style</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Spaced Repetition</h3>
                        {isTaskComplete('flashcards') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('flashcards') ? "bg-emerald-500 w-full" : "bg-primary w-[2%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('flashcards') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>

                  {/* Task 8: Images */}
                  <div className={"p-6 flex items-center gap-6 " + (isTaskComplete('images') ? "" : "bg-slate-50/50 dark:bg-slate-800/20")}>
                    <div className="size-12 rounded-2xl bg-pink-50 dark:bg-pink-900/20 text-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-2xl">image</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 dark:text-white">Image Gallery</h3>
                        {isTaskComplete('images') ? (
                          <span className="text-xs font-bold text-emerald-500">COMPLETE</span>
                        ) : (
                          <span className="text-xs font-bold text-primary animate-pulse">Processing...</span>
                        )}
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={(isTaskComplete('images') ? "bg-emerald-500 w-full" : "bg-primary w-[20%] transition-all duration-1000")} style={{height: '100%'}}></div>
                      </div>
                    </div>
                    {isTaskComplete('images') ? (
                       <button className="px-5 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">VIEW</button>
                    ) : (
                       <div className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold text-sm cursor-not-allowed">WAIT</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar: Summary & Source */}
            <div className="lg:col-span-4 space-y-8">
              {/* Processing Quick Stats */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">speed</span>
                  Engine Status
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm font-semibold text-slate-500">Processing Speed</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{lecture.modelType === 'gpu' ? 'Ultra (GPU)' : 'Standard (API)'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-sm font-semibold text-slate-500">ETA Remaining</span>
                    <span className="text-sm font-bold text-primary">~{Math.max(1, Math.round((100 - (lecture.progress || 0)) / 20))} mins</span>
                  </div>
                  <button onClick={handleStopProcessing} disabled={isUpdating} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors">
                    <span className="material-symbols-outlined text-lg">cancel</span>
                    {isUpdating ? "Aborting..." : "Abort Analysis"}
                  </button>
                </div>
              </div>

              {/* Original Source */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">attachment</span>
                  Source Files
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="size-11 flex-shrink-0 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">
                        {lecture.title.match(/\\.pdf$/i) ? "picture_as_pdf" : "video_library"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{lecture.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Processing Source</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold">Activity Log</h2>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
                  {isTaskComplete('flashcards') && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1.5 size-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900"></div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Flashcards Generated</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Just now</p>
                    </div>
                  )}
                  {isTaskComplete('quiz') && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1.5 size-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900"></div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Quiz Extraction Finished</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Recently</p>
                    </div>
                  )}
                  {isTaskComplete('transcript') && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1.5 size-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900"></div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Transcript Processing Completed</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Earlier</p>
                    </div>
                  )}
                  <div className="relative">
                     <div className="absolute -left-6 top-1.5 size-3 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900"></div>
                     <p className="text-xs font-bold text-slate-400">Analysis Started</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    );
  }

` + targetReturn;

const newStr = content.replace(targetReturn, processingView);
fs.writeFileSync(path, newStr);
console.log('Lecture view processing state injected successfully.');
