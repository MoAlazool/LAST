const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'client', 'src', 'pages', 'lecture-view.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const newProcessingReturn = `
    return (
      <AppLayout>
        <main className="flex-1 p-6 lg:p-10 font-display bg-slate-50 dark:bg-[#121212] min-h-[calc(100vh-64px)] 2xl:min-h-screen">
          {/* Hero Section */}
          <div className="mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6 max-w-[1400px] mx-auto">
            <div>
              <span className="text-primary font-bold tracking-widest text-xs uppercase mb-2 block animate-[pulse_2s_ease-in-out_infinite]">
                Current Status
              </span>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 mb-4">
                AI Agent — Processing
              </h1>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed text-lg">
                Our AI agent is currently deconstructing your lecture: <span className="font-bold text-slate-900 dark:text-white">"{lecture.title}"</span>. Information is being curated into educational modules.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-5 py-2.5 rounded-full text-primary font-bold text-sm shrink-0 shadow-inner">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              System Active
            </div>
          </div>

          <div className="max-w-[1400px] mx-auto">
            {/* Bento Grid of Tasks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Task 1: Transcript */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('transcript') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">description</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('transcript') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('transcript') ? '100% Done' : 'Processing'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Transcript</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('transcript') ? 'Full text extraction complete' : 'Extracting audio to text...'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('transcript') ? 'w-full' : 'w-1/2'}\`}></div>
                  </div>
                  {isTaskComplete('transcript') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Listening...</div>
                  )}
                </div>
              </div>

              {/* Task 2: Summary */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('summary') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">summarize</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('summary') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('summary') ? '100% Done' : 'Processing'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Summary</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('summary') ? 'Key takeaway points distilled' : 'Analyzing core concepts...'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('summary') ? 'w-full' : 'w-[60%]'}\`}></div>
                  </div>
                  {isTaskComplete('summary') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Distilling knowledge...</div>
                  )}
                </div>
              </div>

              {/* Task 3: Mindmap */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('conceptMap') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">hub</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('conceptMap') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('conceptMap') ? '100% Done' : '75% Active'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Mindmap</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('conceptMap') ? 'Visual hierarchy generated' : 'Generating visual hierarchy'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('conceptMap') ? 'w-full' : 'w-[75%]'}\`}></div>
                  </div>
                  {isTaskComplete('conceptMap') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Processing concepts...</div>
                  )}
                </div>
              </div>

              {/* Task 4: Quiz */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('quiz') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">quiz</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('quiz') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('quiz') ? '100% Done' : '45% Active'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Quiz</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('quiz') ? 'Comprehension questions ready' : 'Drafting comprehension questions'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('quiz') ? 'w-full' : 'w-[45%]'}\`}></div>
                  </div>
                  {isTaskComplete('quiz') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Writing distractors...</div>
                  )}
                </div>
              </div>

              {/* Task 5: Slides */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('slides') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">slideshow</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('slides') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('slides') ? '100% Done' : '20% Active'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Slides</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('slides') ? 'Presentation ready' : 'Structuring visual presentation'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('slides') ? 'w-full' : 'w-[20%]'}\`}></div>
                  </div>
                  {isTaskComplete('slides') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Layout optimization...</div>
                  )}
                </div>
              </div>

              {/* Task 6: Formulas */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('formulas') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">functions</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('formulas') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('formulas') ? '100% Done' : '10% Active'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Formulas</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('formulas') ? 'LaTeX equations extracted' : 'Extracting mathematics'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('formulas') ? 'w-full' : 'w-[10%]'}\`}></div>
                  </div>
                  {isTaskComplete('formulas') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                      View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Scanning context...</div>
                  )}
                </div>
              </div>

              {/* Task 7: Flashcards */}
              <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('flashcards') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-700 opacity-90'}\`}>
                 <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-primary text-4xl">style</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('flashcards') ? 'text-primary bg-primary/10' : 'text-slate-500 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('flashcards') ? '100% Done' : '12% Active'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Flashcards</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('flashcards') ? 'Spaced Repetition cards ready' : 'Generating Spaced Repetition cards'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('flashcards') ? 'w-full' : 'w-[12%]'}\`}></div>
                  </div>
                  {isTaskComplete('flashcards') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                       View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Distilling definitions...</div>
                  )}
                </div>
              </div>

              {/* Task 8: Images */}
               <div className={\`bg-white dark:bg-slate-900 rounded-3xl p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group relative overflow-hidden h-[280px] border \${isTaskComplete('images') ? 'border-primary/20 shadow-sm' : 'border-dashed border-slate-300 dark:border-slate-800 opacity-60'}\`}>
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full group-hover:scale-150 transition-transform duration-700 ease-out"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-4xl">image</span>
                    <span className={\`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full \${isTaskComplete('images') ? 'text-primary bg-primary/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}\`}>
                      {isTaskComplete('images') ? '100% Done' : 'Queued'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Images</h3>
                  <p className="text-sm text-slate-500 font-medium">{isTaskComplete('images') ? 'Visual aids generated' : 'Pending transcript completion'}</p>
                </div>
                <div className="mt-4 relative z-10">
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full mb-6 overflow-hidden">
                    <div className={\`bg-primary h-full rounded-full transition-all duration-1000 \${isTaskComplete('images') ? 'w-full' : 'w-0'}\`}></div>
                  </div>
                  {isTaskComplete('images') ? (
                    <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2">
                       View <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </button>
                  ) : (
                    <div className="text-center text-xs font-bold text-slate-400 italic">Waiting in queue...</div>
                  )}
                </div>
              </div>
            </div>

            {/* Focus Fragment / Stats Overlap */}
            <div className="mt-12 flex flex-col xl:flex-row gap-8 items-stretch">
              {/* Processing Efficiency Pane */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 lg:p-12 flex-1 relative overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <span className="material-symbols-outlined text-slate-900 dark:text-white text-[180px] leading-none select-none">analytics</span>
                </div>
                <div className="relative z-10">
                  <h3 className="text-3xl font-extrabold mb-10 text-slate-900 dark:text-white">Processing Efficiency</h3>
                  <div className="grid grid-cols-2 gap-10 mb-10">
                    <div>
                      <p className="text-slate-500 font-bold mb-2 tracking-wide uppercase text-xs">Estimated Time Left</p>
                      <p className="text-5xl font-black text-primary tracking-tighter tabular-nums drop-shadow-sm">
                         0{Math.max(1, Math.round((100 - (lecture.progress || 0)) / 20))}:{(lecture.progress || 0) % 60 < 10 ? '0' : ''}{(lecture.progress || 0) % 60} <span className="text-xl font-bold uppercase tracking-widest text-slate-400">min</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 font-bold mb-2 tracking-wide uppercase text-xs">Tokens Parsed</p>
                      <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 drop-shadow-sm">
                        {Math.round((lecture.transcript?.length || 50000) / 4 / 1000)}k
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center gap-6 shadow-inner">
                      <div className="w-2 h-14 bg-primary rounded-full hidden sm:block shadow-[0_0_15px_rgba(236,91,19,0.5)] animate-pulse"></div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                          <span className="sm:hidden w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                          Currently Generating
                        </p>
                        <p className="text-base text-slate-600 dark:text-slate-300 font-medium">Building spatial relationships in the <span className="text-primary font-bold">Concept Mindmap</span> based on contextual topic sections.</p>
                      </div>
                  </div>
                </div>
              </div>

              {/* Master Your Materials Feature Box */}
              <div className="w-full xl:w-[480px] bg-gradient-to-br from-primary via-orange-600 to-orange-700 p-8 lg:p-12 rounded-[2.5rem] text-white shadow-[0_20px_50px_-12px_rgba(236,91,19,0.4)] relative flex flex-col justify-between overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000">
                   <span className="material-symbols-outlined text-white text-[200px] leading-none select-none">school</span>
                </div>
                
                <div className="relative z-10 mb-8 mt-2">
                  <h3 className="text-4xl font-black mb-6 leading-tight tracking-tight drop-shadow-md">Master your<br/>materials.</h3>
                  <p className="text-white/90 text-base font-medium leading-relaxed mb-4">
                      Once analysis is complete, all modules will be seamlessly synchronized to your Personal Library.
                  </p>
                </div>
                
                <div className="space-y-4 relative z-10 mt-auto">
                  <div className="flex items-center gap-5 bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-sm shadow-inner group/item hover:bg-white/20 transition-colors">
                    <div className="bg-white p-3 rounded-xl flex items-center justify-center shadow-md">
                      <span className="material-symbols-outlined text-primary text-2xl group-hover/item:animate-spin">sync</span>
                    </div>
                    <span className="text-base font-extrabold tracking-wide text-white">Auto-sync active</span>
                  </div>
                  
                  <div className="flex items-center gap-5 bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm opacity-80 mt-3">
                    <div className="bg-white/20 p-3 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl">share</span>
                    </div>
                    <span className="text-base font-bold tracking-wide text-white">Ready for multi-format export</span>
                  </div>
                  
                   <button onClick={handleStopProcessing} disabled={isUpdating} className="w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-xl bg-black/30 hover:bg-black/50 text-white font-extrabold text-sm transition-all border border-white/10 shadow-lg hover:shadow-xl active:scale-[0.98]">
                      <span className="material-symbols-outlined text-xl">cancel</span>
                      {isUpdating ? "Aborting Gracefully..." : "Abort Analysis"}
                    </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </AppLayout>
    );
`;

const startIndex = content.indexOf('if (lecture.status === "processing") {');
const matchEndRegex = /return\s*\(\s*<AppLayout>\s*<div className="space-y-8 pb-20">/;
const actualEndIndex = content.search(matchEndRegex);

if (startIndex > -1 && actualEndIndex > -1) {
    content = content.substring(0, startIndex) + "  if (lecture.status === \\\"processing\\\") {" + newProcessingReturn + "  }\\n\\n  " + content.substring(actualEndIndex);
    fs.writeFileSync(targetPath, content);
    console.log("Successfully replaced UI!");
} else {
    console.error("Could not find bounds", {startIndex, actualEndIndex});
}
