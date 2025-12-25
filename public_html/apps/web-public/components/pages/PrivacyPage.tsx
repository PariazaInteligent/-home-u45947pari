
import React from 'react';
import { InfoPageLayout } from '../InfoPageLayout';

export const PrivacyPage: React.FC = () => {
    return (
        <InfoPageLayout title="Politica de Confidențialitate">
            <p>
                Confidențialitatea datelor dumneavoastră este esențială pentru noi. Această politică descrie modul în care colectăm, utilizăm și protejăm informațiile personale.
            </p>

            <h3>1. Date Colectate</h3>
            <p>
                Colectăm informații strict necesare pentru furnizarea serviciilor și respectarea obligațiilor legale (KYC/AML):
            </p>
            <ul>
                <li>Informații de contact (nume, email, telefon).</li>
                <li>Date financiare necesare procesării plăților.</li>
                <li>Informații tehnice (adresa IP, logs) pentru securitatea platformei.</li>
            </ul>

            <h3>2. Utilizarea Datelor</h3>
            <p>
                Datele dumneavoastră sunt utilizate exclusiv pentru:
            </p>
            <ul>
                <li>Operarea și îmbunătățirea platformei.</li>
                <li>Comunicarea actualizărilor și rapoartelor de performanță.</li>
                <li>Prevenirea fraudei și asigurarea securității conturilor.</li>
            </ul>

            <h3>3. Partajarea Datelor</h3>
            <p>
                Nu vindem și nu închiriem datele dumneavoastră personale către terți. Putem partaja date cu procesatorii de plăți sau autoritățile legale, doar atunci când este strict necesar și obligatoriu prin lege.
            </p>

            <h3>4. Securitatea Datelor</h3>
            <p>
                Implementăm măsuri tehnice și organizatorice avansate (criptare, autentificare în doi pași, acces limitat) pentru a proteja integritatea datelor dumneavoastră.
            </p>
        </InfoPageLayout>
    );
};
