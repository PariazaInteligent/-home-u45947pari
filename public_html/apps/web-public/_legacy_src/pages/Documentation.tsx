import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, FileText, Shield, TrendingDown, PieChart, Eye, Menu, X } from 'lucide-react';

interface DocumentationProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  content: {
    intro: string;
    points: { title: string; text: string }[];
  };
}

export function Documentation({ onBack, onNavigate }: DocumentationProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedPoints, setExpandedPoints] = useState<Record<string, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const sections: Section[] = [
    {
      id: 'overview',
      title: 'Prezentare generală',
      icon: FileText,
      content: {
        intro: 'Sistem de investiție colectivă în value betting sportiv. Capital poolat, decizii centralizate, distribuție transparentă.',
        points: [
          {
            title: 'Structură',
            text: 'Fond comun gestionat de un operator unic. Toți participanții contribuie la același capital. Nicio entitate individuală nu poate plasa pariuri pe cont propriu.',
          },
          {
            title: 'Obiectiv',
            text: 'Creștere constantă bazată pe edge matematic. Nu maximizare de volum. Nu promisiuni de profit garantat. Doar execuție disciplinată a unei strategii definite.',
          },
          {
            title: 'Tehnologie',
            text: 'Tracking automat. Calcul pro-rata în timp real. Audit trail complet pentru fiecare tranzacție. Zero intervenție manuală în distribuție.',
          },
        ],
      },
    },
    {
      id: 'rules',
      title: 'Reguli de funcționare',
      icon: Shield,
      content: {
        intro: 'Ce este permis, ce nu există, ce nu se negociază.',
        points: [
          {
            title: 'CE ESTE PERMIS',
            text: 'Contribuție liberă la fond. Retragere oricând (cu respectarea rundelor active). Transparență completă asupra deciziilor. Acces la istoricul complet de pariuri.',
          },
          {
            title: 'CE NU EXISTĂ',
            text: 'Pariuri individuale. Promisiuni de ROI. Garanții de capital. Costuri ascunse. Comisioane variabile. Prioritizare între participanți.',
          },
          {
            title: 'CE NU SE NEGOCIAZĂ',
            text: 'Metodologia de selecție (doar value betting). Calculul pro-rata (strict proporțional). Transparența (toate datele sunt vizibile). Ieșirea din sistem (oricând, fără penalități).',
          },
        ],
      },
    },
    {
      id: 'risk',
      title: 'Management de risc',
      icon: TrendingDown,
      content: {
        intro: 'Cum se decide miza. De ce nu se forțează. De ce uneori nu se pariază.',
        points: [
          {
            title: 'Dimensionarea mizei',
            text: 'Kelly Criterion adaptat. Maximum 2% din capital per pariu. Maximum 6% din capital total expus simultan. Fără excepții, indiferent de „siguranța" percepută.',
          },
          {
            title: 'Selecția oportunităților',
            text: 'Minim 3% edge matematic demonstrabil. Verificare cross-platform pentru evitarea arbitrajului. Ignorare completă a volumelor mari fără edge real.',
          },
          {
            title: 'Zile fără activitate',
            text: 'Dacă nu există value real, nu se pariază. Forțarea volumului distruge edge-ul. Disciplina înseamnă și să spui „nu" când condițiile nu sunt favorabile.',
          },
        ],
      },
    },
    {
      id: 'distribution',
      title: 'Distribuție & evidență',
      icon: PieChart,
      content: {
        intro: 'Cum se calculează pro-rata. Cum se urmărește fiecare rundă. Logica înainte de emoție.',
        points: [
          {
            title: 'Calcul pro-rata',
            text: 'Profit / pierdere se distribuie exact proporțional cu contribuția. 10% capital = 10% din profit/pierdere. Fără rotunjiri în favoarea operatorului. Fără preferințe pentru early adopters.',
          },
          {
            title: 'Tracking în timp real',
            text: 'Fiecare pariu e înregistrat cu timestamp. Fiecare rezultat e verificat automat. Fiecare rundă e documentată complet. Acces instant la dashboard personal.',
          },
          {
            title: 'Cicluri de reconciliere',
            text: 'Verificare zilnică a balanței. Reconciliere săptămânală completă. Raportare lunară cu breakdown detaliat. Zero discrepanțe netratate.',
          },
        ],
      },
    },
    {
      id: 'transparency',
      title: 'Transparență',
      icon: Eye,
      content: {
        intro: 'Ce se vede. Ce nu se promite. Ce rămâne verificabil.',
        points: [
          {
            title: 'Date accesibile',
            text: 'Istoric complet de pariuri. Rezultate reale, nemodificate. Calculul exact al distribuției. Metrici de performanță fără cherry-picking.',
          },
          {
            title: 'Date care nu există',
            text: 'Proiecții de profit viitor. Garanții de performanță. Rate de succes „garantate". Promisiuni despre consistență.',
          },
          {
            title: 'Verificabilitate',
            text: 'Toate pariurile sunt verificabile pe platformele externe. Toate calculele sunt auditable. Toate deciziile au justificare documentată. Zero „black box".',
          },
        ],
      },
    },
  ];

  const currentSection = sections.find(s => s.id === activeSection)!;

  const togglePoint = (pointTitle: string) => {
    setExpandedPoints(prev => ({
      ...prev,
      [pointTitle]: !prev[pointTitle],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background effects - subtle */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40 pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b border-slate-800 backdrop-blur-xl bg-slate-900/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi</span>
          </button>
          <div className="text-sm text-slate-500">Documentație tehnică</div>
        </div>
      </motion.header>

      {/* Main layout */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Floating navigation button */}
        <motion.button
          onClick={() => setMenuOpen(true)}
          className="fixed left-6 top-24 z-40 w-12 h-12 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </motion.button>

        {/* Navigation overlay */}
        <AnimatePresence>
          {menuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />

              {/* Menu panel */}
              <motion.div
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed left-0 top-0 bottom-0 w-80 bg-slate-900 border-r border-slate-700 z-50 overflow-y-auto"
              >
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                      Navigare
                    </div>
                    <div className="text-lg">Secțiuni</div>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Navigation list */}
                <nav className="p-4 space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${isActive
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{section.title}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Meta info */}
                <div className="p-6 border-t border-slate-800 text-xs text-slate-500 space-y-1">
                  <p>Ultima actualizare:</p>
                  <p>Decembrie 2024</p>
                  <p className="mt-3 text-slate-600">
                    Documentație MVP. Subiect la modificări pe măsură ce sistemul evoluează.
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content - full width */}
        <motion.main
          key={activeSection}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-8"
        >
          {/* Section header */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <currentSection.icon className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-3xl md:text-4xl">{currentSection.title}</h1>
            </div>
            <p className="text-lg text-slate-400 leading-relaxed max-w-3xl">
              {currentSection.content.intro}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-800" />

          {/* Content points */}
          <div className="space-y-4">
            {currentSection.content.points.map((point, index) => {
              const isExpanded = expandedPoints[point.title];

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-colors"
                >
                  <button
                    onClick={() => togglePoint(point.title)}
                    className="w-full flex items-center justify-between p-6 text-left group"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-medium group-hover:text-blue-400 transition-colors">
                        {point.title}
                      </h3>
                      {!isExpanded && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                          {point.text}
                        </p>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </motion.div>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: isExpanded ? 'auto' : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-2">
                      <div className="border-t border-slate-700/50 pt-4">
                        <p className="text-slate-300 leading-relaxed">
                          {point.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Section footer note */}
          {activeSection === 'transparency' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 bg-slate-800/20 border border-slate-700/30 rounded-xl p-8 space-y-4"
            >
              <h3 className="text-xl">Notă de responsabilitate</h3>
              <div className="space-y-3 text-slate-400 text-sm leading-relaxed">
                <p>
                  Această documentație prezintă sistemul în forma sa actuală. Nu constituie promisiune de performanță viitoare.
                </p>
                <p>
                  Value betting presupune risc real de pierdere. Nicio metodologie nu elimină riscul complet. Investește doar capital pe care îl poți permite să îl pierzi.
                </p>
                <p>
                  Citește, înțelege, apoi decizi.
                </p>
              </div>
            </motion.div>
          )}
        </motion.main>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 mt-24 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© 2024 Pariază Inteligent. Documentație MVP.</div>
          <div className="flex gap-6">
            <button onClick={() => onNavigate?.('terms')} className="hover:text-slate-300 transition-colors">Termeni</button>
            <button onClick={() => onNavigate?.('privacy')} className="hover:text-slate-300 transition-colors">Confidențialitate</button>
            <button onClick={() => onNavigate?.('contact')} className="hover:text-slate-300 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}