export interface EmailTemplate {
    id: string;
    name: string;
    emoji: string;
    category: 'welcome' | 'update' | 'education' | 'promotion' | 'engagement';
    design: 'celebration' | 'standard' | 'premium' | 'alert' | 'newsletter';
    filterRule: 'new_users' | 'active_users' | 'vip_opportunities' | 'all_active' | 'beginners' | 'forgot_checkin' | 'streak_at_risk' | 'upsell_targets' | 'loyal_users' | 'custom';
    subject: string;
    message: string;
    description: string;
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'welcome',
        name: 'Bun Venit - Investitori Noi',
        emoji: '🎉',
        category: 'welcome',
        design: 'celebration',
        filterRule: 'new_users', // 🎯 Doar utilizatori noi (< 3 zile)
        subject: '🎉 Bun Venit la Pariază Inteligent! Hai să începem!',
        description: 'Mesaj de întâmpinare cu pașii următori pentru conturile noi.',
        message: `<p>Bună ziua!</p>
<p>Suntem încântați să te avem alături! 🦉</p>
<p>Contul tău este acum activ și poți începe să investești imediat. Iată ce te așteaptă:</p>
<p><strong>✨ Primul Pas: Fă Check-in Zilnic</strong><br>
Primești puncte bonus pentru fiecare zi consecutivă de activitate!</p>
<p><strong>📊 Explorează Dashboard-ul</strong><br>
Vezi investițiile tale în timp real și urmărește creșterea portofoliului.</p>
<p><strong>🎁 Sistem de Recompense</strong><br>
Acumulezi beneficii pe măsură ce investești - reduceri, acces prioritar și multe altele!</p>
<p><strong>💡 Avem Nevoie de Ajutor?</strong><br>
Echipa noastră de suport este mereu aici pentru tine.</p>
<p>Mult succes în călătoria ta de investiții!</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'weekly_recap',
        name: 'Rezultate Săptămânale',
        emoji: '📊',
        category: 'update',
        design: 'newsletter',
        filterRule: 'active_users', // 🎯 Utilizatori activi (logați în ultimele 7 zile)
        subject: '📊 Rezultatele Săptămânii: Vezi cum ne-am descurcat!',
        description: 'Sumar al performanței și câștigurilor din săptămâna anterioară.',
        message: `<p>Salutare, investitorilor! 👋</p>
<p>Săptămâna aceasta a fost una plină de acțiune! Iată cum au arătat cifrele:</p>
<ul>
<li><strong>🟢 Profit Generat:</strong> [XX]%</li>
<li><strong>📈 Număr Pariuri Câștigătoare:</strong> [XX]</li>
<li><strong>🏆 Cel Mai Bun Bilet:</strong> Cota [X.XX]</li>
</ul>
<p>Am reușit să atingem obiectivele propuse și continuăm să optimizăm strategiile pentru săptămâna viitoare.</p>
<p>Verifică dashboard-ul tău pentru a vedea detaliile complete ale performanței tale personale!</p>
<p>Spor la câștiguri! 💰</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'opportunity',
        name: 'Oportunitate Mare',
        emoji: '🚀',
        category: 'education',
        design: 'premium',
        filterRule: 'vip_opportunities', // 🎯 VIP (PRO/WHALE sau Clearance >= 3)
        subject: '🚀 Oportunitate de Investiție: Nu rata șansa!',
        description: 'Alertă pentru o oportunitate sau un pont important.',
        message: `<p>Atenție, investitori! 🦉</p>
<p>Am identificat o oportunitate excelentă pe piață pe care vrem să o împărtășim cu voi.</p>
<p><strong>🔥 Detalii Oportunitate:</strong></p>
<ul>
<li><strong>Eveniment:</strong> [Nume Eveniment]</li>
<li><strong>Potențial:</strong> Ridicat 📈</li>
<li><strong>Timp rămas:</strong> Limitat ⏳</li>
</ul>
<p>Analiștii noștri au studiat datele și considerăm că acesta este momentul ideal pentru a acționa.</p>
<p>Intră în platformă acum pentru a vedea detaliile complete și recomandarea noastră!</p>
<p>Să fie verde! ✅</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'rewards_new',
        name: 'Sistem Nou Recompense',
        emoji: '🎁',
        category: 'update',
        design: 'celebration',
        filterRule: 'all_active', // 🎯 Toți utilizatorii activi
        subject: '🎁 NOU: Sistemul de Recompense este Aici!',
        description: 'Anunț despre lansarea sau actualizarea programului de loialitate.',
        message: `<p>Veste extraordinară! 🎉</p>
<p>Tocmai am lansat noul nostru sistem de recompense, creat special pentru a te răsplăti pentru fidelitate!</p>
<p><strong>Ce primești?</strong></p>
<ul>
<li>💎 Puncte pentru fiecare investiție</li>
<li>🔥 Bonusuri pentru streak-uri zilnice</li>
<li>🏷️ Reduceri la comisioane pentru utilizatorii activi</li>
</ul>
<p><strong>Cum funcționează?</strong><br>
Simplu: Fii activ, investește inteligent și urcă în rang! Cu cât ești mai sus, cu atât beneficiile sunt mai mari.</p>
<p>Verifică noua secțiune "Recompense" din profilul tău!</p>
<p>Cu drag,<br>
Echipa Pariază Inteligent</p>`
    },
    {
        id: 'platform_update',
        name: 'Update Platformă',
        emoji: '⚡',
        category: 'update',
        design: 'newsletter',
        filterRule: 'all_active', // 🎯 Toți utilizatorii activi
        subject: '⚡ Update Platformă: Funcții Noi Disponibile!',
        description: 'Notificare despre îmbunătățiri tehnice sau feature-uri noi.',
        message: `<p>Salutare! 🛠️</p>
<p>Lucrăm constant să facem Pariază Inteligent mai bun pentru tine. Azi am lansat câteva îmbunătățiri importante:</p>
<ul>
<li>✅ <strong>[Funcție Nouă 1]</strong> - Acum poți...</li>
<li>✅ <strong>[Funcție Nouă 2]</strong> - Vezi mai ușor...</li>
<li>🚀 <strong>Performanță Îmbunătățită</strong> - Totul se încarcă mai rapid!</li>
</ul>
<p>Mulțumim pentru feedback-ul vostru continuu. Voi ne ajutați să construim cea mai bună platformă de investiții sportive!</p>
<p>Explorează noutățile acum!</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'tips_strategy',
        name: 'Sfaturi Investiție',
        emoji: '📚',
        category: 'education',
        design: 'newsletter',
        filterRule: 'beginners', // 🎯 Începători (ENTRY sau Clearance <= 2)
        subject: '📚 Sfatul Zilei: Cum să-ți maximizezi profitul',
        description: 'Conținut educațional despre strategii de pariere/investiție.',
        message: `<p>Bună! 🦉</p>
<p>Știai că managementul riscului este cheia succesului pe termen lung?</p>
<p><strong>💡 Sfatul Săptămânii:</strong><br>
Nu investi niciodată mai mult de [X]% din potul tău pe un singur eveniment, indiferent cât de sigur pare.</p>
<p>Strategia "Smart Staking" te ajută să treci peste perioadele mai puțin bune și să profiți maxim de seriile câștigătoare.</p>
<p>Vrei să afli mai multe? Avem o secțiune dedicată de educație în platformă!</p>
<p>Investește inteligent, nu emoțional! 🧠</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'daily_checkin',
        name: 'Reminder Check-in',
        emoji: '🔥',
        category: 'engagement',
        design: 'standard',
        filterRule: 'forgot_checkin', // 🎯 Au uitat check-in azi dar sunt activi
        subject: '🔥 Nu uita de Check-in! Bonusul te așteaptă',
        description: 'Reminder prietenos pentru menținerea streak-ului zilnic.',
        message: `<p>Salut! 👋</p>
<p>Nu am văzut check-in-ul tău astăzi!</p>
<p>Amintește-ți că zilnic poți colecta puncte gratuite doar intrând în platformă. Aceste puncte te ajută să avansezi în nivel și să deblochezi beneficii.</p>
<p><strong>🕒 Doar câteva secunde durează!</strong><br>
👉 Intră acum și apasă butonul de Check-in.</p>
<p>Păstrează-ți streak-ul activ! 🔥</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'streak_loss',
        name: 'Alertă Pierdere Streak',
        emoji: '⚠️',
        category: 'engagement',
        design: 'alert',
        filterRule: 'streak_at_risk', // 🎯 Streak la risc (> 0 streak, n-au check-in de > 20h)
        subject: '⚠️ Atenție! Ești pe cale să-ți pierzi streak-ul!',
        description: 'Un ultim avertisment înainte de resetarea streak-ului.',
        message: `<p>Oh nu! 😨</p>
<p>Duo a observat că nu ai intrat în ultimele 24 de ore. Streak-ul tău impresionant este în pericol să fie resetat la zero!</p>
<p><strong>💔 Nu lăsa efortul tău să se piardă!</strong></p>
<p>Intră în platformă în următoarele ore pentru a-ți salva progresul și a păstra bonusurile active.</p>
<p>Salvează-ți streak-ul acum! 🏃‍♂️💨</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'promo_limited',
        name: 'Ofertă Limitată',
        emoji: '💎',
        category: 'promotion',
        design: 'premium',
        filterRule: 'upsell_targets', // 🎯 Ținte upsell (INVESTOR tier)
        subject: '💎 Ofertă Limitată: Bonus special pentru tine!',
        description: 'Promoție limitată în timp cu call-to-action clar.',
        message: `<p>Salutare! 🌟</p>
<p>Avem o surpriză specială, dar trebuie să te grăbești!</p>
<p><strong>Doar pentru următoarele [48 de ore], oferim:</strong></p>
<ul>
<li>🎁 [Detaliu Ofertă - ex: 0% Comisioane la Depunere]</li>
<li>🎁 [Detaliu Ofertă - ex: Bonus 10% la Investiție]</li>
</ul>
<p><strong>Cum profiți?</strong><br>
Intră în cont, accesează secțiunea Promocii și activează oferta.</p>
<p>⏳ Timpul trece! Nu rata șansa.</p>
<p>Profită acum!</p>
<p>Echipa Pariază Inteligent</p>`
    },
    {
        id: 'thank_you',
        name: 'Mulțumire Activitate',
        emoji: '💙',
        category: 'engagement',
        design: 'standard',
        filterRule: 'loyal_users', // 🎯 Utilizatori fideli (Streak > 10 SAU Loyalty > 500)
        subject: '💙 Mulțumim că ești alături de noi!',
        description: 'Mesaj de apreciere pentru utilizatorii activi.',
        message: `<p>Dragă investitor,</p>
<p>Vrem doar să luăm un moment să-ți mulțumim. 🙏</p>
<p>Faptul că ești activ, participi la creșterea comunității și investești inteligent ne motivează să fim mai buni în fiecare zi.</p>
<p>Ești un membru valoros al Elitei Pariază Inteligent și apreciem încrederea ta.</p>
<p>Continuăm să construim viitorul investițiilor sportive împreună! 🚀</p>
<p>Cu recunoștință,<br>
Echipa Pariază Inteligent</p>`
    }
];
