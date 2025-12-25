import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Menu, X } from 'lucide-react';

interface PrivacyProps {
  onBack: () => void;
}

interface Section {
  id: string;
  title: string;
  content: { subtitle?: string; text: string; list?: string[] }[];
}

export function Privacy({ onBack }: PrivacyProps) {
  const [activeSection, setActiveSection] = useState('collected');
  const [menuOpen, setMenuOpen] = useState(false);

  const sections: Section[] = [
    {
      id: 'collected',
      title: '1. Date colectate',
      content: [
        {
          subtitle: 'Ce colectăm',
          text: 'Minimum necesar pentru funcționarea platformei:',
          list: [
            'Email — pentru crearea contului și comunicare',
            'Date tehnice de bază — browser, sistem de operare, device type',
            'Istoric tranzacții — depuneri, retrageri, participare la runde',
            'Interacțiuni cu platforma — login, navigare, acțiuni majore',
          ],
        },
        {
          subtitle: 'Ce NU colectăm',
          text: 'Nu păstrăm date inutile:',
          list: [
            'Informații bancare complete — doar referințe minime necesare',
            'Locație precisă — IP-ul e folosit doar pentru securitate',
            'Date comportamentale granulare — fără pixel tracking excesiv',
            'Informații personale sensibile — vârstă, gen, religie, opțiuni politice',
          ],
        },
      ],
    },
    {
      id: 'purpose',
      title: '2. Scopul folosirii',
      content: [
        {
          subtitle: 'De ce avem nevoie de datele tale',
          text: 'Fiecare dată are un scop explicit:',
          list: [
            'Email — autentificare, notificări esențiale despre cont și runde',
            'Date tehnice — compatibilitate, securitate, prevenirea fraudei',
            'Istoric tranzacții — transparență completă, calcule pro-rata corecte',
            'Interacțiuni — îmbunătățirea experienței, debugging, suport tehnic',
          ],
        },
        {
          subtitle: 'Ce nu facem niciodată',
          text: 'Linii roșii clare:',
          list: [
            'Nu vindem date către terți',
            'Nu creăm profiluri de marketing',
            'Nu folosim datele pentru publicitate targetată',
            'Nu partajăm email-ul cu nimeni fără consimțământ explicit',
          ],
        },
      ],
    },
    {
      id: 'storage',
      title: '3. Stocare și protecție',
      content: [
        {
          subtitle: 'Unde sunt păstrate',
          text: 'Datele sunt stocate în servere cloud securizate, în zone geografice conforme GDPR. Nu sunt păstrate pe device-uri locale decât temporar pentru funcționare (cache).',
        },
        {
          subtitle: 'Cât timp',
          text: 'Păstrăm datele atât timp cât contul e activ, plus perioada minimă legală pentru istoricul tranzacțiilor (conform reglementărilor financiare). După ștergerea contului, datele personale sunt șterse în maximum 30 de zile, cu excepția celor necesare pentru arhivare legală.',
        },
        {
          subtitle: 'Măsuri de protecție',
          text: 'Standard industry pentru securitate:',
          list: [
            'Criptare în tranzit (HTTPS/TLS) și în repaus',
            'Acces restricționat pe bază de rol — doar personal autorizat',
            'Backup-uri regulate cu criptare',
            'Monitorizare continuă pentru activitate suspectă',
            'Actualizări de securitate prompte',
          ],
        },
      ],
    },
    {
      id: 'third-party',
      title: '4. Acces terți',
      content: [
        {
          subtitle: 'Cine poate avea acces',
          text: 'Doar parteneri esențiali, cu contract strict:',
          list: [
            'Procesatori de plăți — pentru depuneri și retrageri (nu păstrăm date bancare complete)',
            'Furnizori de infrastructură cloud — pentru hosting și stocare',
            'Servicii de email — pentru trimiterea notificărilor',
            'Servicii de analiză minimă — doar date anonimizate pentru performanță tehnică',
          ],
        },
        {
          subtitle: 'În ce condiții',
          text: 'Orice partener trebuie să respecte: (a) GDPR și reglementări locale; (b) să folosească datele doar pentru scopul specificat; (c) să nu vândă sau să distribuie datele mai departe; (d) să raporteze orice breach de securitate imediat.',
        },
        {
          subtitle: 'Ce nu se întâmplă niciodată',
          text: 'Garanții explicite:',
          list: [
            'Nu vindem datele către brokeri de date',
            'Nu partajăm cu advertisers pentru reclame',
            'Nu oferim acces agențiilor de stat fără mandat legal valid',
            'Nu folosim datele pentru training AI extern fără consimțământ',
          ],
        },
      ],
    },
    {
      id: 'user-rights',
      title: '5. Drepturile utilizatorului',
      content: [
        {
          subtitle: 'Ai control complet',
          text: 'Drepturile tale clare, aplicabile imediat:',
          list: [
            'Acces — poți solicita o copie a tuturor datelor tale (export JSON)',
            'Corectare — poți actualiza informațiile incorecte',
            'Ștergere — poți cere ștergerea contului și a datelor (cu excepția arhivei legale)',
            'Restricționare — poți limita anumite tipuri de procesare',
            'Portabilitate — poți lua datele și să le muți',
            'Opoziție — poți refuza anumite procesări (dacă nu sunt esențiale)',
          ],
        },
        {
          subtitle: 'Cum exerciți aceste drepturi',
          text: 'Simplu: contactează echipa de suport cu cererea ta. Răspuns în maximum 7 zile lucrătoare. Fără justificare necesară. Fără costuri.',
        },
        {
          subtitle: 'Limitări rezonabile',
          text: 'Nu putem șterge date dacă: (a) sunt necesare legal pentru arhivare; (b) sunt implicate în dispute active; (c) sunt esențiale pentru securitatea altor utilizatori. Te vom informa transparent despre orice limitare.',
        },
      ],
    },
    {
      id: 'cookies',
      title: '6. Cookie-uri',
      content: [
        {
          subtitle: 'Ce folosim',
          text: 'Minimum necesar pentru funcționare:',
          list: [
            'Cookie-uri de sesiune — pentru autentificare și navigare',
            'Cookie-uri de securitate — pentru prevenirea atacurilor CSRF',
            'Cookie-uri de preferințe — pentru setări locale (limbă, temă)',
          ],
        },
        {
          subtitle: 'Ce NU folosim',
          text: 'Zero tracking agresiv:',
          list: [
            'Nu folosim cookie-uri de advertising',
            'Nu folosim tracking cross-site',
            'Nu folosim fingerprinting ascuns',
            'Nu partajăm cookie-uri cu terți pentru marketing',
          ],
        },
        {
          subtitle: 'Controlul tău',
          text: 'Poți gestiona cookie-urile din browser. Ștergerea cookie-urilor de sesiune va necesita re-autentificare. Cookie-urile esențiale nu pot fi dezactivate fără a afecta funcționarea platformei.',
        },
      ],
    },
    {
      id: 'changes',
      title: '7. Modificări ale politicii',
      content: [
        {
          text: 'Această politică poate fi actualizată periodic. Orice modificare semnificativă va fi comunicată prin email cu minimum 14 zile înainte de intrarea în vigoare.',
        },
        {
          text: 'Vei avea opțiunea de a accepta noile termeni sau de a-ți șterge contul înainte de aplicarea lor. Modificările minore (corectări, clarificări) vor fi comunicate prin notificare în platformă.',
        },
        {
          text: 'Ultima actualizare: Decembrie 2024',
        },
      ],
    },
    {
      id: 'contact',
      title: '8. Contact pentru date',
      content: [
        {
          subtitle: 'Întrebări despre datele tale?',
          text: 'Echipa de protecție a datelor este disponibilă pentru orice întrebare legată de confidențialitate, acces, sau ștergere.',
        },
        {
          text: 'Email: privacy@pariazainteligent.ro',
        },
        {
          text: 'Timp de răspuns: maximum 7 zile lucrătoare. Pentru urgențe de securitate, răspunsul e în 24 ore.',
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
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAxKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]  opacity-50 pointer-events-none" />

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
            <Shield className="w-4 h-4" />
            <span>Confidențialitate</span>
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
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                          isActive
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
            <h1 className="text-3xl md:text-4xl">Politica de confidențialitate</h1>
            <p className="text-slate-400 leading-relaxed max-w-3xl">
              Datele tale. Controlul tău. Fără ascunzișuri. Fără surprize.
              Citește calm — aici inspiri liniște, nu suspiciune.
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
                <div className="space-y-6 text-slate-300 leading-relaxed">
                  {section.content.map((item, index) => (
                    <div key={index} className="space-y-3">
                      {item.subtitle && (
                        <h3 className="text-lg text-white">{item.subtitle}</h3>
                      )}
                      <p className={item.subtitle ? 'pl-4 border-l-2 border-slate-700' : ''}>
                        {item.text}
                      </p>
                      {item.list && (
                        <ul className="space-y-2 pl-8">
                          {item.list.map((listItem, listIndex) => (
                            <li key={listIndex} className="relative before:content-['•'] before:absolute before:-left-4 before:text-blue-400">
                              {listItem}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ))}

          {/* Final notice */}
          <div className="mt-16 bg-slate-800/20 border border-slate-700/30 rounded-lg p-8 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg">Ai control complet</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Dacă după ce ai citit această pagină simți că ai control asupra datelor tale,
                  am făcut treaba bine. Dacă ai încă întrebări sau suspiciuni, scrie-ne — suntem aici.
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="pt-8 border-t border-slate-800 text-sm text-slate-500 space-y-2">
            <p>
              Întrebări despre datele tale?{' '}
              <a href="mailto:privacy@pariazainteligent.ro" className="text-blue-400 hover:text-blue-300 transition-colors">
                privacy@pariazainteligent.ro
              </a>
            </p>
            <p className="text-xs">Răspuns garantat în maximum 7 zile lucrătoare.</p>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 mt-24 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© 2024 Pariază Inteligent. Datele tale, controlul tău.</div>
          <div className="flex gap-6">
            <button onClick={onBack} className="hover:text-slate-300 transition-colors">
              Înapoi acasă
            </button>
            <a href="mailto:privacy@pariazainteligent.ro" className="hover:text-slate-300 transition-colors">
              Contact date personale
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
