
import React from 'react';
import { InfoPageLayout } from '../InfoPageLayout';
import { Button3D } from '../ui/Button3D';

export const ReportsPage: React.FC = () => {
    return (
        <InfoPageLayout title="Rapoarte de Performanță">
            <p>
                Transparența este valoarea noastră fundamentală. Publicăm rapoarte detaliate despre performanța fondului, inclusiv istoricul complet al tranzacțiilor (anonimizat unde este necesar), evoluția NAV (Net Asset Value) și distribuirile de profit către investitori.
            </p>

            <h3>Rapoarte Lunare</h3>
            <div className="not-prose grid gap-4 mb-8">
                <div className="bg-slate-900 p-4 rounded border border-white/10 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-white">Raport Luna Noiembrie 2025</div>
                        <div className="text-sm text-slate-500">PDF • 2.4 MB</div>
                    </div>
                    <Button3D variant="cyan" size="sm" className="opacity-50 cursor-not-allowed">Descarcă</Button3D>
                </div>
                <div className="bg-slate-900 p-4 rounded border border-white/10 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-white">Raport Luna Octombrie 2025</div>
                        <div className="text-sm text-slate-500">PDF • 2.1 MB</div>
                    </div>
                    <Button3D variant="cyan" size="sm" className="opacity-50 cursor-not-allowed">Descarcă</Button3D>
                </div>
            </div>

            <h3>Audit Extern</h3>
            <p>
                Colaborăm cu auditori independenți pentru a verifica periodic concordanța dintre balanțele raportate și conturile reale de pariuri. Deși blockchain-ul oferă o imutabilitate a înregistrărilor interne, auditul extern confirmă existența fizică a fondurilor în conturile operatorilor.
            </p>
        </InfoPageLayout>
    );
};
