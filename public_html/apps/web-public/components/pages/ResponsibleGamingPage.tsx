
import React from 'react';
import { InfoPageLayout } from '../InfoPageLayout';
import { ShieldCheck } from 'lucide-react';

export const ResponsibleGamingPage: React.FC = () => {
    return (
        <InfoPageLayout title="Joc Responsabil (18+)">
            <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-lg mb-8 flex gap-4 items-start">
                <ShieldCheck className="w-8 h-8 text-red-400 flex-shrink-0" />
                <div>
                    <h3 className="text-red-400 font-bold text-lg mt-0 mb-2">Avertisment Important</h3>
                    <p className="text-red-200/80 mb-0">
                        Pariurile și investițiile speculative implică riscuri majore. Nu investiți niciodată bani pe care nu vă permiteți să-i pierdeți. Jocurile de noroc pot cauza dependență.
                    </p>
                </div>
            </div>

            <p>
                Deși noi transformăm pariurile în investiție prin disciplină și matematică, platforma se adresează exclusiv persoanelor majore (18+) și încurajăm un comportament responsabil.
            </p>

            <h3>Semne ale Dependenței</h3>
            <ul className="list-disc pl-6 space-y-2 mb-6">
                <li>Preocuparea excesivă pentru jocurile de noroc sau investiții.</li>
                <li>Nevoia de a crește mizele pentru a obține aceeași satisfacție.</li>
                <li>Iritabilitate sau neliniște atunci când încercați să stopați activitatea.</li>
                <li>„Vânarea” pierderilor (chasing losses) după o serie negativă.</li>
            </ul>

            <h3>Resurse de Ajutor</h3>
            <p>
                Dacă simțiți că pierdeți controlul, vă recomandăm să apelați la organizații specializate:
            </p>
            <ul>
                <li><strong>Joc Responsabil România:</strong> <a href="https://jocresponsabil.ro" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">jocresponsabil.ro</a></li>
                <li><strong>Gambling Therapy:</strong> <a href="https://www.gamblingtherapy.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300">gamblingtherapy.org</a></li>
            </ul>

            <h3>Unelte de Protecție pe Platformă</h3>
            <p>
                Oferim utilizatorilor posibilitatea de a seta limite voluntare:
            </p>
            <ul>
                <li>Limite de depunere (zilnice, săptămânale, lunare).</li>
                <li>Auto-excludere temporară sau permanentă.</li>
            </ul>
        </InfoPageLayout>
    );
};
