
import React from 'react';
import { InfoPageLayout } from '../InfoPageLayout';

export const MethodologyPage: React.FC = () => {
    return (
        <InfoPageLayout title="Metodologie">
            <h3>Abordarea Noastră: Value Betting</h3>
            <p>
                La baza strategiei Pariază Inteligent stă conceptul de <strong>Value Betting</strong>. Aceasta nu este o strategie de „noroc”, ci una pur matematică. Identificăm situațiile în care cotele oferite de casele de pariuri sunt mai mari decât probabilitatea reală a evenimentului.
            </p>
            <p>
                De exemplu, dacă o casă de pariuri oferă o cotă de 2.00 (50% probabilitate implicită) pentru un eveniment pe care modelul nostru îl estimează la o probabilitate reală de 55% (cotă corectă 1.82), am identificat o „valoare”. Pe termen lung, pariind constant pe astfel de oportunități, legea numerelor mari garantează profitabilitatea.
            </p>

            <h3>Gestionarea Riscului (Bankroll Management)</h3>
            <p>
                Protejarea capitalului este prioritatea #1. Folosim un sistem de staking dinamic, bazat pe <strong>Criteriul Kelly Fracționar</strong>, adaptat pentru a minimiza riscul de ruină și a maximiza creșterea compusă a fondului.
            </p>
            <ul>
                <li>Expunere maximă per pariu: 1-3% din bancă.</li>
                <li>Diversificare pe multiple sporturi și ligi.</li>
                <li>Stop-loss automatizat pentru serii negative.</li>
            </ul>

            <h3>Echipa și Tehnologia</h3>
            <p>
                Folosim algoritmi proprietari de Machine Learning care analizează zeci de mii de puncte de date în timp real (statistici echipe, accidentări, mișcări de cote pe piața asiatică) pentru a genera semnalele de investiție. Execuția este realizată manual de traderi profesioniști pentru a evita limitările automate ale caselor de pariuri.
            </p>
        </InfoPageLayout>
    );
};
