
import React from 'react';
import { InfoPageLayout } from '../InfoPageLayout';

export const TermsPage: React.FC = () => {
    return (
        <InfoPageLayout title="Termeni și Condiții">
            <p className="text-sm text-slate-500">Ultima actualizare: 21 Decembrie 2025</p>

            <h3>1. Acceptarea Termenilor</h3>
            <p>
                Prin accesarea și utilizarea platformei Pariază Inteligent, sunteți de acord să respectați acești Termeni și Condiții. Dacă nu sunteți de acord cu oricare dintre acești termeni, vă rugăm să nu utilizați serviciile noastre.
            </p>

            <h3>2. Natura Serviciului</h3>
            <p>
                Pariază Inteligent este un serviciu de consultanță și gestionare a fondurilor destinate pariurilor sportive. Nu suntem o casă de pariuri și nu garantăm profituri. Investițiile în pariuri sportive implică riscuri financiare, inclusiv pierderea totală a capitalului.
            </p>

            <h3>3. Eligibilitate</h3>
            <p>
                Trebuie să aveți cel puțin 18 ani (sau vârsta legală majoratului în jurisdicția dumneavoastră) pentru a utiliza serviciile noastre. Este responsabilitatea dumneavoastră să vă asigurați că participarea la astfel de activități este legală în țara de reședință.
            </p>

            <h3>4. Depuneri și Retrageri</h3>
            <p>
                Toate depunerile sunt finale odată intrate în circuitul de investiții. Retragerile pot fi solicitate oricând, însă pot fi supuse unor perioade de procesare de până la 48 de ore lucrătoare. Ne rezervăm dreptul de a solicita documente pentru verificarea identității (KYC) înainte de a procesa orice retragere.
            </p>

            <h3>5. Limitarea Răspunderii</h3>
            <p>
                Pariază Inteligent nu va fi răspunzătoare pentru nicio pierdere directă, indirectă sau incidentală rezultată din utilizarea serviciilor noastre. Performanțele trecute nu garantează rezultatele viitoare.
            </p>
        </InfoPageLayout>
    );
};
