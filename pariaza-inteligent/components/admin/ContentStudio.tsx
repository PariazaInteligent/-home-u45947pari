
import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  Video, 
  FileText, 
  BrainCircuit, 
  Plus, 
  Save, 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  Eye, 
  BarChart2, 
  Search,
  Filter,
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  Image as ImageIcon,
  PlayCircle
} from 'lucide-react';
import { TiltCard } from '../ui/TiltCard';
import { Button3D } from '../ui/Button3D';

interface ContentModule {
  id: string;
  title: string;
  category: 'Fundamental' | 'Math' | 'Psychology';
  type: 'video' | 'article' | 'quiz';
  status: 'published' | 'draft' | 'archived';
  views: number;
  duration: string;
  lastEdited: string;
}

export const ContentStudio: React.FC = () => {
  // --- STATE ---
  const [modules, setModules] = useState<ContentModule[]>([
    { id: 'MOD-01', title: 'Mindset de Investitor vs Jucător', category: 'Psychology', type: 'video', status: 'published', views: 1240, duration: '12 min', lastEdited: '2 days ago' },
    { id: 'MOD-02', title: 'Bankroll Management: Regula de 3%', category: 'Fundamental', type: 'video', status: 'published', views: 890, duration: '25 min', lastEdited: '5 days ago' },
    { id: 'MOD-03', title: 'Înțelegerea Cotelor și Probabilităților', category: 'Math', type: 'article', status: 'draft', views: 0, duration: '18 min', lastEdited: 'Today' },
    { id: 'MOD-04', title: 'Testare Cunoștințe: Value Betting', category: 'Math', type: 'quiz', status: 'archived', views: 45, duration: '10 min', lastEdited: '1 month ago' },
  ]);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'video' | 'article'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Fundamental',
    type: 'video',
    status: 'draft'
  });

  // --- DERIVED STATE ---
  const filteredModules = modules.filter(m => filterType === 'all' || m.type === filterType);
  const isEditing = selectedModuleId !== null;

  // --- EFFECT: Populate Form on Select ---
  useEffect(() => {
    if (selectedModuleId) {
      const mod = modules.find(m => m.id === selectedModuleId);
      if (mod) {
        setFormData({
          title: mod.title,
          description: 'Descriere simulată pentru conținut existent...', // Demo data hook
          category: mod.category,
          type: mod.type,
          status: mod.status
        });
      }
    } else {
      // Reset for create mode
      setFormData({
        title: '',
        description: '',
        category: 'Fundamental',
        type: 'video',
        status: 'draft'
      });
    }
  }, [selectedModuleId, modules]);

  // --- ACTIONS ---

  const handleSave = () => {
    if (isEditing && selectedModuleId) {
      // Update existing
      setModules(prev => prev.map(m => m.id === selectedModuleId ? {
        ...m,
        title: formData.title,
        category: formData.category as any,
        type: formData.type as any,
        status: formData.status as any,
        lastEdited: 'Just now'
      } : m));
    } else {
      // Create new
      const newMod: ContentModule = {
        id: `MOD-${Math.floor(Math.random() * 10000)}`,
        title: formData.title || 'Untitled Module',
        category: formData.category as any,
        type: formData.type as any,
        status: formData.status as any,
        views: 0,
        duration: '0 min',
        lastEdited: 'Just now'
      };
      setModules([newMod, ...modules]);
      setSelectedModuleId(newMod.id);
    }
  };

  const handleDelete = () => {
    if (selectedModuleId) {
      setModules(prev => prev.filter(m => m.id !== selectedModuleId));
      setSelectedModuleId(null);
    }
  };

  const handleUploadSim = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
        setUploadProgress(prev => {
            if (prev >= 100) {
                clearInterval(interval);
                setIsUploading(false);
                return 100;
            }
            return prev + 10;
        });
    }, 200);
  };

  const handleAiEnhance = () => {
      setIsAiGenerating(true);
      setTimeout(() => {
          setFormData(prev => ({
              ...prev,
              title: prev.title ? `[Optimized] ${prev.title}` : 'Mastering Variance in Sports Betting',
              description: 'Acest modul explorează conceptele avansate de varianță matematică, oferind strategii concrete pentru a gestiona downswing-urile inerente. Generat de AI Studio v2.'
          }));
          setIsAiGenerating(false);
      }, 1500);
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'published': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          case 'draft': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
          case 'archived': return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
          default: return 'text-white';
      }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-slate-500 text-xs uppercase font-bold">Total Modules</div>
                    <div className="text-2xl font-display font-bold text-white">{modules.length}</div>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <PenTool className="w-6 h-6 text-blue-400" />
                </div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-slate-500 text-xs uppercase font-bold">Total Views</div>
                    <div className="text-2xl font-display font-bold text-emerald-400">2.4k</div>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Eye className="w-6 h-6 text-emerald-400" />
                </div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-slate-500 text-xs uppercase font-bold">Avg. Engagement</div>
                    <div className="text-2xl font-display font-bold text-violet-400">8m 12s</div>
                </div>
                <div className="p-2 bg-violet-500/10 rounded-lg">
                    <BarChart2 className="w-6 h-6 text-violet-400" />
                </div>
            </div>
            <div className="bg-slate-900/50 border border-white/5 p-4 rounded-xl flex flex-col justify-center items-center cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setSelectedModuleId(null)}>
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center mb-2 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                    <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Create New</div>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 h-[650px]">
            
            {/* LEFT: LIBRARY LIST */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-white/10">
                    <button 
                        onClick={() => setFilterType('all')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${filterType === 'all' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilterType('video')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${filterType === 'video' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Video
                    </button>
                    <button 
                        onClick={() => setFilterType('article')}
                        className={`flex-1 py-2 text-xs font-bold uppercase rounded-md transition-all ${filterType === 'article' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-white'}`}
                    >
                        Text
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Search content..." 
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:border-cyan-500 outline-none"
                    />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {filteredModules.map(mod => (
                        <div 
                            key={mod.id}
                            onClick={() => setSelectedModuleId(mod.id)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer group ${
                                selectedModuleId === mod.id 
                                ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                : 'bg-slate-900/30 border-white/5 hover:border-white/20'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className={`p-1.5 rounded-lg ${mod.type === 'video' ? 'bg-violet-500/20 text-violet-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {mod.type === 'video' ? <Video className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                                </div>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getStatusColor(mod.status)}`}>
                                    {mod.status}
                                </span>
                            </div>
                            <h4 className={`font-bold text-sm mb-1 leading-tight ${selectedModuleId === mod.id ? 'text-cyan-300' : 'text-white'}`}>{mod.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                                <span>{mod.duration} • {mod.category}</span>
                                <span>Edited: {mod.lastEdited}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: EDITOR STUDIO */}
            <div className="lg:col-span-8 h-full">
                <TiltCard glowColor="cyan" noPadding className="h-full flex flex-col relative overflow-hidden">
                    {/* Editor Toolbar */}
                    <div className="h-16 border-b border-white/5 bg-slate-900/80 backdrop-blur flex items-center justify-between px-6 z-10">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${isEditing ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></div>
                            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                                {isEditing ? `EDITING: ${selectedModuleId}` : 'CREATING NEW MODULE'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {isEditing && (
                                <button 
                                    onClick={handleDelete}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" 
                                    title="Delete Module"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <div className="h-4 w-px bg-white/10"></div>
                            <Button3D variant="cyan" onClick={handleSave} className="text-xs px-4 py-2 h-auto">
                                <Save className="w-4 h-4 mr-2" /> {isEditing ? 'Save Changes' : 'Publish Module'}
                            </Button3D>
                        </div>
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Main Inputs */}
                            <div className="md:col-span-2 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Module Title</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors placeholder:text-slate-700"
                                            placeholder="Enter module title..."
                                        />
                                        <button 
                                            onClick={handleAiEnhance}
                                            disabled={isAiGenerating}
                                            className="px-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                                            title="AI Enhance Title"
                                        >
                                            {isAiGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Description / Script</label>
                                    <textarea 
                                        rows={6}
                                        value={formData.description}
                                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-cyan-500 outline-none transition-colors resize-none placeholder:text-slate-700 text-sm"
                                        placeholder="Module content description..."
                                    ></textarea>
                                </div>
                            </div>

                            {/* Sidebar Settings */}
                            <div className="space-y-4">
                                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                                        <select 
                                            value={formData.category}
                                            onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="Fundamental">Fundamental</option>
                                            <option value="Math">Math & Stats</option>
                                            <option value="Psychology">Psychology</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Content Type</label>
                                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                                            {['video', 'article', 'quiz'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setFormData({...formData, type: t as any})}
                                                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded transition-colors ${formData.type === t ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:text-white'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Visibility</label>
                                        <select 
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                                        >
                                            <option value="draft">Draft (Hidden)</option>
                                            <option value="published">Published (Live)</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Media Upload Zone */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Media Assets</label>
                            
                            <div 
                                onClick={handleUploadSim}
                                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${
                                    isUploading ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700 hover:border-cyan-500 hover:bg-cyan-500/5'
                                }`}
                            >
                                {isUploading ? (
                                    <div className="w-full max-w-xs text-center relative z-10">
                                        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
                                        <div className="text-sm font-bold text-emerald-400 mb-2">Processing Data Stream...</div>
                                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 transition-all duration-200" style={{ width: `${uploadProgress}%` }}></div>
                                        </div>
                                        <div className="text-[10px] text-emerald-600/70 font-mono mt-1">SCANNING FOR MALWARE...</div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                            <UploadCloud className="w-6 h-6 text-cyan-400" />
                                        </div>
                                        <div className="text-sm font-bold text-slate-300">Click to Upload or Drag Files</div>
                                        <div className="text-xs text-slate-500 mt-1">Supports MP4, MOV, PDF, MD (Max 2GB)</div>
                                    </>
                                )}
                            </div>

                            {/* Uploaded Files List (Mock) */}
                            {isEditing && !isUploading && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-white/10 group">
                                        <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white truncate">thumbnail_v1.png</div>
                                            <div className="text-[10px] text-slate-500">1.2 MB • Image</div>
                                        </div>
                                        <button className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    {formData.type === 'video' && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-white/10 group">
                                            <div className="w-10 h-10 bg-slate-900 rounded flex items-center justify-center">
                                                <PlayCircle className="w-5 h-5 text-cyan-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-bold text-white truncate">master_render_final.mp4</div>
                                                <div className="text-[10px] text-slate-500">450 MB • Video</div>
                                            </div>
                                            <button className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </TiltCard>
            </div>
        </div>
    </div>
  );
};
