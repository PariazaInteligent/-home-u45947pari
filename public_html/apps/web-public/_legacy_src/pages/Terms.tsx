import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Menu, X } from 'lucide-react';

interface TermsProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

interface Section {
  id: string;
  title: string;
  content: { subtitle?: string; text: string }[];
}

export function Terms({ onBack, onNavigate }: TermsProps) {
  const [activeSection, setActiveSection] = useState('definitions');
  const [menuOpen, setMenuOpen] = useState(false);

  const sections: Section[] = [
    {
      id: 'definitions',
      title: '1. Definiții',
      content: [
        {
          text: 'Platforma = Pariază Inteligent, sistemul de investiție colectivă în value betting sportiv.',
        },
        {
          text: 'Operator = entitatea care gestionează fondul comun și execută deciziile de investiție.',
        },
        {
          text: 'Participant = persoană care contribuie capital la fondul comun.',
        },
        {
          text: 'Capital = sumele depuse de participanți în fondul comun.',
        },
        {
          text: 'Value betting = metodologie de identificare a pariurilor cu edge matematic pozitiv.',
        },
        {
          text: 'Pro-rata = distribuție proporțională a profitului/pierderii în funcție de contribuția la capital.',
        },
        {
          text: 'Edge = avantajul matematic estimat al unui pariu față de cota oferită.',
        },
      ],
    },
    {
      id: 'nature',
      title: '2. Natura serviciului',
      content: [
        {
          subtitle: 'Ce este platforma',
          text: 'Sistem de investiție colectivă bazat pe analiză matematică a cotelor sportive. Capital poolat, gestionat centralizat, cu distribuție transparentă a rezultatelor.',
        },
        {
          subtitle: 'Ce NU este platforma',
          text: 'Nu este un cazino. Nu este un site de gambling recreațional. Nu este o schemă de câștig rapid. Nu este un fond de investiții reglementat. Nu este o garanție de profit.',
        },
        {
          subtitle: 'Diferența explicită',
          text: 'Platforma aplică metodologii cantitative pentru identificarea oportunităților cu probabilitate favorabilă. Nu promite rezultate. Nu elimină riscul. Nu înlocuiește judecata personală.',
        },
      ],
    },
    {
      id: 'responsibility',
      title: '3. Responsabilitate',
      content: [
        {
          subtitle: 'Fără garanții',
          text: 'Niciun rezultat viitor nu este garantat. Performanța trecută nu indică rezultate viitoare. Orice metodologie poate eșua în circumstanțe nefavorabile.',
        },
        {
          subtitle: 'Fără promisiuni de profit',
          text: 'Platforma nu promite, nu implică, nu sugerează profit garantat. Orice investiție presupune risc real de pierdere parțială sau totală.',
        },
        {
          subtitle: 'Riscuri recunoscute',
          text: 'Participant recunoaște: (a) riscul de pierdere a capitalului; (b) caracterul probabilistic al metodologiei; (c) posibilitatea de perioade prelungite fără profit; (d) limitările inerente ale oricărei strategii bazate pe date.',
        },
        {
          subtitle: 'Decizie proprie',
          text: 'Participarea este o decizie personală, liberă, informată. Nicio presiune, nicio promisiune, nicio recomandare din partea operatorului. Participant investește doar capital pe care și-l permite să îl piardă.',
        },
      ],
    },
    {
      id: 'operation',
      title: '4. Funcționare',
      content: [
        {
          subtitle: 'Gestiunea capitalului',
          text: 'Capitalul este gestionat centralizat de operator. Deciziile de plasare a pariurilor sunt exclusive operatorului. Participantul nu are control individual asupra execuției.',
        },
        {
          subtitle: 'Criterii de selecție',
          text: 'Operator aplică criterii matematice predefinite: edge minim 3%, expunere maximă 6% din capital total, dimensionare bazată pe Kelly Criterion adaptat. Operator își rezervă dreptul de a nu plasa pariuri dacă nu există oportunități valide.',
        },
        {
          subtitle: 'Transparență',
          text: 'Toate pariurile sunt documentate cu timestamp, cotă, rezultat. Toate calculele pro-rata sunt verificabile. Toate datele sunt accesibile participanților. Nicio tranzacție ascunsă.',
        },
        {
          subtitle: 'Suspendare activitate',
          text: 'Operator poate suspenda temporar sau definitiv activitatea dacă: (a) condițiile pieței devin nefavorabile; (b) capitalul depășește capacitatea de management responsabil; (c) apar riscuri legale sau tehnice semnificative.',
        },
      ],
    },
    {
      id: 'user',
      title: '5. Utilizator',
      content: [
        {
          subtitle: 'Drepturi',
          text: 'Participant are dreptul: (a) la transparență completă asupra tranzacțiilor; (b) la retragere oricând (cu respectarea rundelor active); (c) la calcul pro-rata corect și verificabil; (d) la acces complet la istoric.',
        },
        {
          subtitle: 'Obligații',
          text: 'Participant este obligat: (a) să investească doar capital pe care și-l permite să îl piardă; (b) să nu solicite garanții sau promisiuni de rezultate; (c) să respecte regulile de funcționare; (d) să nu distribuie date confidențiale ale platformei.',
        },
        {
          subtitle: 'Fără pretenții nerealiste',
          text: 'Participant nu poate pretinde: (a) profit garantat; (b) recuperarea pierderilor; (c) modificarea regulilor în favoarea sa; (d) prioritate față de alți participanți; (e) intervenție în deciziile operatorului.',
        },
      ],
    },
    {
      id: 'limitations',
      title: '6. Limitări',
      content: [
        {
          subtitle: 'Acces restricționat',
          text: 'Operator își rezervă dreptul de a limita, suspenda sau refuza accesul oricărui participant, fără justificare obligatorie, dacă: (a) capacitatea de management este depășită; (b) comportamentul participantului creează risc pentru sistem; (c) există suspiciuni de abuz sau fraudă.',
        },
        {
          subtitle: 'Modificare reguli',
          text: 'Operator poate ajusta oricând: (a) criteriile de selecție; (b) metodologia de calcul; (c) limitele de expunere; (d) structura comisioanelor. Modificările se aplică cu notificare prealabilă de minimum 7 zile.',
        },
        {
          subtitle: 'Fără negociere individuală',
          text: 'Regulile sunt identice pentru toți participanții. Nu există tratament preferențial. Nu există excepții pe bază de volum sau vechime. Nu există condiții personalizate.',
        },
        {
          subtitle: 'Limitări tehnice',
          text: 'Platforma poate fi indisponibilă temporar din motive tehnice. Operatorul nu garantează uptime 100%. Erorile tehnice vor fi comunicate și remediate în timp util, fără compensații automate.',
        },
      ],
    },
    {
      id: 'changes',
      title: '7. Modificări ale termenilor',
      content: [
        {
          text: 'Acești termeni pot fi modificați unilateral de operator. Modificările intră în vigoare la 7 zile de la comunicare.',
        },
        {
          text: 'Continuarea utilizării platformei după modificare constituie acceptare implicită. Dacă nu accepți modificările, singura opțiune este retragerea completă.',
        },
        {
          text: 'Operatorul va comunica modificările semnificative prin email. Participant este responsabil pentru menținerea unei adrese de email valide.',
        },
      ],
    },
    {
      id: 'acceptance',
      title: '8. Acceptare',
      content: [
        {
          text: 'Folosind platforma, accepți acești termeni în totalitate, fără rezerve.',
        },
        {
          text: 'Dacă nu accepți vreun punct, nu folosești platforma. Nu există acceptare parțială.',
        },
        {
          text: 'Responsabilitatea pentru înțelegerea termenilor revine participantului. Operator nu oferă consiliere legală sau financiară.',
        },
      ],
    },
  ];

  // Scroll to section when active changes
  useEffect(() => {
    const element = document.getElementById(activeSection);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection]);

  // Update active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Background - ultra minimal */}
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAxKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 backdrop-blur-xl bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi</span>
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <FileText className="w-4 h-4" />
            <span>Termeni și condiții</span>
          </div>
        </div>
      </header>

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
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                {/* Navigation list */}
                <nav className="p-4 space-y-1">
                  {sections.map((section) => {
                    const isActive = activeSection === section.id;

                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          setMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${isActive
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                      >
                        {section.title}
                      </button>
                    );
                  })}
                </nav>

                {/* Meta info */}
                <div className="p-6 border-t border-slate-800 text-xs text-slate-500 space-y-1">
                  <p>Ultima actualizare:</p>
                  <p>Decembrie 2024</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main content - full width */}
        <main className="space-y-12">
          {/* Page header */}
          <div className="space-y-3 pb-6 border-b border-slate-800">
            <h1 className="text-3xl md:text-4xl">Termeni și condiții</h1>
            <p className="text-slate-400 leading-relaxed max-w-3xl">
              Documente clare. Limite explicite. Fără interpretări creative.
              Citește integral înainte de a utiliza platforma.
            </p>
          </div>

          {/* Sections */}
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="space-y-6">
                {/* Section title */}
                <h2 className="text-2xl md:text-3xl border-l-4 border-blue-500 pl-4">
                  {section.title}
                </h2>

                {/* Section content */}
                <div className="space-y-4 text-slate-300 leading-relaxed">
                  {section.content.map((item, index) => (
                    <div key={index} className="space-y-2">
                      {item.subtitle && (
                        <h3 className="text-lg text-white">{item.subtitle}</h3>
                      )}
                      <p className={item.subtitle ? 'pl-4 border-l-2 border-slate-700' : ''}>
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* Final notice */}
          <div className="mt-16 bg-slate-800/20 border border-slate-700/30 rounded-lg p-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg">Confirmare de înțelegere</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Folosind platforma Pariază Inteligent, confirmați că ați citit, înțeles și acceptat acești termeni în totalitate.
                  Dacă nu sunteți de acord cu oricare dintre puncte, nu folosiți platforma.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="pt-8 border-t border-slate-800 text-sm text-slate-500">
            <p>
              Întrebări despre termeni?{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">
                Contact
              </a>
            </p>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 mt-24 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© 2024 Pariază Inteligent. Document legal.</div>
          <div className="flex gap-6">
            <button onClick={() => onNavigate?.('privacy')} className="hover:text-slate-300 transition-colors">
              Confidențialitate
            </button>
            <button onClick={() => onNavigate?.('contact')} className="hover:text-slate-300 transition-colors">
              Contact
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}