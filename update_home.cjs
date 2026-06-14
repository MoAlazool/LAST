const fs = require('fs');
const path = 'client/src/pages/home.tsx';
const content = fs.readFileSync(path, 'utf-8');
const startIdx = content.indexOf('return (');
if (startIdx === -1) throw new Error('return not found');
const before = content.substring(0, startIdx);

const newReturn = `return (
    <AppLayout>
      <main className="relative pt-10 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        </div>
        
        <div className={"max-w-7xl mx-auto px-6 lg:px-20 " + (language === 'ar' ? 'rtl' : 'ltr')}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className={"text-center " + (language === 'ar' ? 'lg:text-right' : 'lg:text-left')}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                {t.heroBadge}
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
                {t.heroTitleLine1} <span className="text-primary block">{t.heroTitleLine2}</span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {t.heroSubtitle}
              </p>
              
              <div className={"flex flex-wrap justify-center gap-4 " + (language === 'ar' ? 'lg:justify-end' : 'lg:justify-start')}>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <Star className="text-primary w-5 h-5 fill-primary" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <span className="text-green-500 text-xl font-bold">✓</span>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Start for free</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-primary/10 shadow-2xl p-8 relative z-10">
                <form onSubmit={handleAnalyze} className="space-y-6">
                  
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    <button 
                      type="button"
                      onClick={() => setSelectedModel('api')}
                      className={"px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap " + (selectedModel === 'api' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary')}
                    >
                      {t.modelApi}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedModel('gpu')}
                      className={"px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap " + (selectedModel === 'gpu' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary')}
                    >
                      {t.modelGpu}
                    </button>
                  </div>
                  
                  <div 
                    onClick={handleUploadClick}
                    className="group cursor-pointer relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-10 text-center transition-all hover:border-primary/40 hover:bg-primary/5"
                  >
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{t.uploadFile}</h3>
                    <p className="text-slate-500 text-sm mb-6 font-medium">Supports PDF, PPT, and MP3 (Max 50MB)</p>
                    
                    {uploadedFile && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold truncate">
                        ✓ {uploadedFile.name}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest leading-6">
                      <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">OR PASTE LINK</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <div className={"absolute inset-y-0 flex items-center pointer-events-none text-red-500 " + (language === 'ar' ? 'right-0 pr-4' : 'left-0 pl-4')}>
                        <Youtube className="w-6 h-6" />
                      </div>
                      <input 
                        type="text"
                        className={"block w-full py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/50 transition-all outline-none placeholder-slate-400 font-medium " + (language === 'ar' ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left')}
                        placeholder={t.inputPlaceholder}
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (e.target.value) setUploadedFile(null);
                        }}
                        disabled={!!uploadedFile}
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={isAnalyzing || isCreating}
                      className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-xl shadow-primary/20 hover:brightness-110 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                      {isAnalyzing || isCreating ? (
                         <div className="flex items-center gap-2">
                           <Sparkles className="w-5 h-5 animate-spin" />
                           {language === 'ar' ? 'جاري التحليل...' : 'Processing...'}
                         </div>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          {t.analyzeNow}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
            </div>
            
          </div>
        </div>
      </main>
      
      <section className="py-16 bg-white dark:bg-slate-900 border-y border-primary/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-black text-primary">10k+</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Students</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-blue-500">1M+</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notes Generated</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-primary">95%</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accuracy Rate</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-black text-blue-500">200+</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Universities</div>
            </div>
          </div>
        </div>
      </section>
      
    </AppLayout>
  );
}
`;

fs.writeFileSync(path, before + newReturn);
console.log('Update complete!');
