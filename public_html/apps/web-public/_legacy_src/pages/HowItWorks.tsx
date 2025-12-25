import { motion } from 'motion/react';
import { ArrowLeft, Users, Target, Activity, PieChart, Check } from 'lucide-react';

interface HowItWorksProps {
  onBack: () => void;
  onNavigate?: (page: string) => void;
}

export function HowItWorks({ onBack, onNavigate }: HowItWorksProps) {
  const steps = [
    {
      number: '01',
      icon: Users,
      title: 'Capital comun',
      subtitle: 'Bancă comună, nu bilete individuale',
      description: 'Toți contribuie la un fond centralizat. Nimeni nu pariază pe cont propriu. E ca un fond de investiții: capital poolat, risc distribuit.',
      details: [
        'Contribui exact cât vrei',
        'Capitalul rămâne al tău',
        'Ieși când vrei, fără penalități',
      ],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      number: '02',
      icon: Target,
      title: 'Selecție disciplinată',
      subtitle: 'Value betting, nu volum',
      description: 'Doar pariuri cu edge matematic demonstrabil. Fără „sisteme". Fără intuiții. Puține decizii, toate justificate cu date.',
      details: [
        'Analiză probabilistică riguroasă',
        'Minim 3% edge confirmat',
        'Maximum 2-3 pariuri/zi',
      ],
      color: 'from-cyan-500 to-emerald-500',
    },
    {
      number: '03',
      icon: Activity,
      title: 'Execuție & tracking',
      subtitle: 'Totul urmărit, nimic ascuns',
      description: 'Pariurile sunt plasate centralizat. Fiecare tranzacție e documentată. Fiecare rezultat e înregistrat. Acces complet la istoric.',
      details: [
        'Timestamp pentru fiecare pariu',
        'Raportare zilnică automată',
        'Audit trail complet',
      ],
      color: 'from-emerald-500 to-blue-500',
    },
    {
      number: '04',
      icon: PieChart,
      title: 'Distribuție pro-rata',
      subtitle: 'Profit proporțional, fără șmecherii',
      description: 'Profitul se împarte exact proporțional cu contribuția. 10% capital = 10% profit. Zero avantaje ascunse. Zero comisioane surpriză.',
      details: [
        'Calcul transparent, verificabil',
        'Retragere oricând',
        'Fără costuri ascunse',
      ],
      color: 'from-blue-500 to-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Background effects - same as landing */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none" />
      <div className="fixed inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30 pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative border-b border-slate-800 backdrop-blur-xl bg-slate-900/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Înapoi</span>
          </button>
        </div>
      </motion.header>

      {/* Main content */}
      <section className="relative py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20 space-y-4"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl">
              Cum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">funcționează</span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Patru pași. Zero magie. Doar mecanism.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-cyan-500/50 to-transparent" />

            {/* Steps */}
            <div className="space-y-16">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative pl-24"
                >
                  {/* Node */}
                  <motion.div
                    className="absolute left-0 top-8"
                    whileHover={{ scale: 1.1 }}
                  >
                    <div className="relative">
                      {/* Outer ring */}
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} opacity-20 blur-md`} />
                      </motion.div>

                      {/* Main node */}
                      <div className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg shadow-blue-500/20`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>

                      {/* Number badge */}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center text-xs">
                        {step.number}
                      </div>
                    </div>
                  </motion.div>

                  {/* Content card */}
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="group"
                  >
                    <div className="relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 transition-all duration-300 group-hover:border-blue-500/50">
                      {/* Glow effect on hover */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />

                      {/* Content */}
                      <div className="relative space-y-4">
                        <div>
                          <h3 className="text-2xl md:text-3xl mb-2">{step.title}</h3>
                          <p className="text-blue-400">{step.subtitle}</p>
                        </div>

                        <p className="text-slate-300 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Details list */}
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          whileHover={{ height: 'auto', opacity: 1 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-slate-700/50 space-y-2">
                            {step.details.map((detail, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm text-slate-400">
                                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Summary section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-24 text-center"
          >
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-12 space-y-6">
              <h2 className="text-3xl">
                Asta e tot.
              </h2>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Patru pași mecanici. Zero promisiuni. Zero hype.
                Doar capital poolat, selecție disciplinată, execuție transparentă, distribuție corectă.
              </p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="pt-6 space-y-4"
              >
                <button className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40">
                  <span className="flex items-center gap-2">
                    Intră pe listă de așteptare
                  </span>
                </button>
                <p className="text-sm text-slate-500">
                  Acces beta. Fără costuri. Fără date sensibile.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-slate-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
          <div>© 2024 Pariază Inteligent. Toate drepturile rezervate.</div>
          <div className="flex gap-6">
            <button
              onClick={() => onNavigate?.('terms')}
              className="hover:text-slate-300 transition-colors"
            >
              Termeni
            </button>
            <button onClick={() => onNavigate?.('privacy')} className="hover:text-slate-300 transition-colors">Confidențialitate</button>
            <button onClick={() => onNavigate?.('contact')} className="hover:text-slate-300 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}