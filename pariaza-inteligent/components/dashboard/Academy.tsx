import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  PlayCircle, 
  CheckCircle2, 
  Lock, 
  Download, 
  Award, 
  ChevronRight,
  GraduationCap,
  FileText,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';
import { GoogleGenAI } from "@google/genai";

interface Module {
  id: number;
  title: string;
  duration: string;
  type: 'video' | 'article' | 'tool';
  status: 'completed' | 'active' | 'locked';
  category: 'Fundamental' | 'Math' | 'Psychology';
  description: string;
}

export const Academy: React.FC = () => {
  const [activeModuleId, setActiveModuleId] = useState<number>(2);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  const modules: Module[] = [
    { 
        id: 1, 
        title: 'Mindset de Investitor vs Jucător', 
        duration: '12 min', 
        type: 'video', 
        status: 'completed', 
        category: 'Fundamental',
        description: 'Diferențele psihologice critice dintre un parior amator și un investitor profesionist. Disciplina emoțională și viziunea pe termen lung.'
    },
    { 
        id: 2, 
        title: 'Bankroll Management: Regula de 3%', 
        duration: '25 min', 
        type: 'video', 
        status: 'active', 
        category: 'Fundamental',
        description: 'Cum să îți protejezi capitalul folosind regula de aur a investițiilor sportive. Calcularea mizei optime și evitarea falimentului.'
    },
    { 
        id: 3, 
        title: 'Înțelegerea Cotelor și Probabilităților', 
        duration: '18 min', 
        type: 'article', 
        status: 'locked', 
        category: 'Math',
        description: 'Matematica din spatele cotelor. Cum convertim cotele în probabilități implicite și cum identificăm valoarea reală.'
    },
    { 
        id: 4, 
        title: 'Discipline & Tilt Control', 
        duration: '30 min', 
        type: 'video', 
        status: 'locked', 
        category: 'Psychology',
        description: 'Tehnici de control emoțional pentru a evita deciziile impulsive (Tilt) după o serie de pierderi.'
    },
    { 
        id: 5, 
        title: 'Value Betting: Cum găsim avantajul', 
        duration: '45 min', 
        type: 'video', 
        status: 'locked', 
        category: 'Math',
        description: 'Identificarea discrepanțelor dintre cotele caselor de pariuri și probabilitatea reală a evenimentului.'
    },
    { 
        id: 6, 
        title: 'Configurarea Excel-ului de Tracking', 
        duration: 'N/A', 
        type: 'tool', 
        status: 'locked', 
        category: 'Fundamental',
        description: 'Ghid pas cu pas pentru crearea propriului sistem de monitorizare a performanței.'
    },
  ];

  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0];

  // Reset video state when changing modules
  useEffect(() => {
    setVideoUrl(null);
    setIsGenerating(false);
    setLoadingStatus("");
  }, [activeModuleId]);

  const handleGenerateVideo = async () => {
    if (activeModule.type !== 'video') return;

    try {
        // API Key Selection for Veo Models
        if ((window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
                // Check again after dialog potentially closes
                if (!await (window as any).aistudio.hasSelectedApiKey()) return;
            }
        }

        setIsGenerating(true);
        setLoadingStatus("Inițializare Veo-3 AI...");

        // Initialize SDK with the selected key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        setLoadingStatus("Generare scenariu video...");
        
        // Call Veo model
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `Cinematic educational video intro about: ${activeModule.title}. Visual style: Abstract futuristic data visualization, financial graphs, cybernetic interface, dark background with neon accents. High quality, 4k.`,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        setLoadingStatus("Randare video cu Veo (estimat: 1 min)...");

        // Poll for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({operation: operation});
            setLoadingStatus("Procesare frame-uri AI...");
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        
        if (videoUri) {
            setLoadingStatus("Descărcare stream...");
            // Fetch the actual video bytes using the API key
            const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setVideoUrl(url);
        } else {
            throw new Error("Nu s-a primit URI pentru video.");
        }

    } catch (error) {
        console.error("Video generation error:", error);
        alert("A apărut o eroare la generarea video-ului AI. Verificați consola.");
    } finally {
        setIsGenerating(false);
        setLoadingStatus("");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header & Gamification */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6">
        <div>
           <h2 className="text-2xl font-display font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-cyan-400" /> Academie & Resurse
           </h2>
           <p className="text-slate-400 text-sm mt-1">Stăpânește matematica din spatele pariurilor sportive.</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center gap-6 min-w-[300px]">
           <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-900">
                 <Award className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="absolute top-0 right-0 w-5 h-5 bg-cyan-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white">
                 1
              </div>
           </div>
           <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                 <span className="text-slate-300 font-bold uppercase">Nivel: Inițiat</span>
                 <span className="text-cyan-400 font-mono">15%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                 <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 w-[15%] shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Următorul nivel: Strateg (3 module rămase)</div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
         {/* Left Sidebar: Course Curriculum */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
               <div className="p-4 bg-slate-950/50 border-b border-white/5 font-bold text-slate-300 uppercase text-xs tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Curriculum
               </div>
               <div className="divide-y divide-white/5">
                  {modules.map((module) => (
                     <div 
                        key={module.id} 
                        onClick={() => module.status !== 'locked' && setActiveModuleId(module.id)}
                        className={`p-4 transition-all cursor-pointer group ${
                           activeModuleId === module.id ? 'bg-cyan-900/10 border-l-2 border-cyan-500' : 
                           module.status === 'locked' ? 'opacity-50 cursor-not-allowed bg-slate-950/30' : 'hover:bg-white/5 border-l-2 border-transparent'
                        }`}
                     >
                        <div className="flex justify-between items-start mb-1">
                           <div className="flex items-center gap-2">
                              {module.status === 'completed' ? (
                                 <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : module.status === 'locked' ? (
                                 <Lock className="w-4 h-4 text-slate-600 flex-shrink-0" />
                              ) : (
                                 <PlayCircle className={`w-4 h-4 ${activeModuleId === module.id ? 'text-cyan-400' : 'text-slate-400'} flex-shrink-0`} />
                              )}
                              <span className={`text-sm font-bold ${activeModuleId === module.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                                 {module.title}
                              </span>
                           </div>
                        </div>
                        <div className="flex items-center gap-3 pl-6 text-[10px] text-slate-500 uppercase tracking-wider">
                           <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {module.duration}
                           </span>
                           <span className={`px-1.5 py-0.5 rounded border ${
                              module.category === 'Fundamental' ? 'border-emerald-500/20 text-emerald-500' :
                              module.category === 'Math' ? 'border-violet-500/20 text-violet-500' :
                              'border-yellow-500/20 text-yellow-500'
                           }`}>{module.category}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            <div className="bg-gradient-to-br from-violet-900/20 to-slate-900 border border-violet-500/20 p-6 rounded-xl relative overflow-hidden">
               <div className="relative z-10">
                  <h4 className="font-bold text-white text-sm mb-2">Comunitate VIP</h4>
                  <p className="text-xs text-slate-400 mb-4">Discută strategiile învățate cu mentorii și alți investitori de top.</p>
                  <button className="text-xs text-violet-300 font-bold hover:text-white flex items-center gap-1 transition-colors">
                     Mergi la Chat <ChevronRight className="w-3 h-3" />
                  </button>
               </div>
               <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-violet-500/10 rounded-full blur-xl"></div>
            </div>
         </div>

         {/* Right Main Content: Video/Article Player */}
         <div className="lg:col-span-8">
            <TiltCard glowColor="cyan" className="h-full flex flex-col" noPadding>
               {/* Video Player Area */}
               <div className="relative aspect-video bg-black rounded-t-xl overflow-hidden group">
                  {activeModule.type === 'video' ? (
                     videoUrl ? (
                         // Actual Video Player
                         <video 
                             src={videoUrl} 
                             controls 
                             autoPlay 
                             className="w-full h-full object-cover"
                         />
                     ) : (
                         // Placeholder / Generator UI
                         <>
                            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                               {isGenerating ? (
                                   <div className="text-center space-y-4 z-10">
                                       <div className="relative w-16 h-16 mx-auto">
                                           <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                           <div className="absolute inset-0 border-4 border-t-cyan-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                           <Loader2 className="w-8 h-8 text-cyan-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-white animate-pulse">GENERARE VIDEO AI</p>
                                           <p className="text-xs text-cyan-400 font-mono mt-1">{loadingStatus}</p>
                                       </div>
                                   </div>
                               ) : (
                                   <div className="text-center space-y-6 z-10" onClick={handleGenerateVideo}>
                                      <div className="w-24 h-24 rounded-full border-2 border-cyan-500/30 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform cursor-pointer shadow-[0_0_30px_rgba(6,182,212,0.2)] bg-slate-900/50 backdrop-blur-sm">
                                         <Sparkles className="w-10 h-10 text-cyan-400 ml-1" />
                                      </div>
                                      <div>
                                          <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Veo-3 AI Generator</p>
                                          <p className="text-xs text-slate-400 max-w-xs mx-auto">
                                              Generează un preview video unic pentru acest modul folosind inteligența artificială Google Veo.
                                          </p>
                                          <button className="mt-4 px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-full transition-colors shadow-lg shadow-cyan-900/50">
                                              GENEREAZĂ PREVIEW
                                          </button>
                                      </div>
                                   </div>
                               )}
                            </div>
                            
                            {/* Decorative Elements for Placeholder */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                               <div className="h-full bg-cyan-500 w-[0%]"></div>
                            </div>
                         </>
                     )
                  ) : (
                     <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                        <FileText className="w-20 h-20 text-slate-700" />
                     </div>
                  )}
                  
                  {/* Overlay Gradient (only visible when not playing video) */}
                  {!videoUrl && <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 pointer-events-none"></div>}
                  
                  <div className="absolute top-4 left-4 z-20">
                     <span className="bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                        Modulul {activeModule.id}
                     </span>
                  </div>
               </div>

               <div className="p-8 space-y-8 flex-1 bg-slate-900/50">
                  <div>
                     <h1 className="text-2xl font-display font-bold text-white mb-2">{activeModule.title}</h1>
                     <p className="text-slate-400 leading-relaxed">
                        {activeModule.description}
                     </p>
                  </div>

                  {/* Key Takeaways */}
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4" /> Obiective
                        </h4>
                        <ul className="text-xs text-slate-400 space-y-2 list-disc pl-4">
                           <li>Definirea unei unități de pariere</li>
                           <li>Calcularea riscului de ruină</li>
                           <li>Strategia Flat Stake vs Proportional</li>
                        </ul>
                     </div>
                     <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl">
                        <h4 className="text-sm font-bold text-violet-400 mb-2 flex items-center gap-2">
                           <Download className="w-4 h-4" /> Resurse
                        </h4>
                        <div className="space-y-2">
                           <button className="w-full flex items-center justify-between text-xs text-slate-300 bg-white/5 hover:bg-white/10 p-2 rounded transition-colors border border-transparent hover:border-violet-500/30">
                              <span>Calculator_Bankroll.xlsx</span>
                              <Download className="w-3 h-3" />
                           </button>
                           <button className="w-full flex items-center justify-between text-xs text-slate-300 bg-white/5 hover:bg-white/10 p-2 rounded transition-colors border border-transparent hover:border-violet-500/30">
                              <span>CheatSheet_Mize.pdf</span>
                              <Download className="w-3 h-3" />
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                      <Button3D variant="cyan" className="text-sm px-8 py-3">
                         Marchează ca Finalizat & Continuă
                      </Button3D>
                  </div>
               </div>
            </TiltCard>
         </div>
      </div>
    </div>
  );
};