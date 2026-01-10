UPDATE league_tiers
SET benefits_json = '[{"icon":"✓","category":"access","description":"Acces la dashboard investitor","order":1},{"icon":"📊","category":"analytics","description":"Statistici lunare bază","order":2},{"icon":"💬","category":"support","description":"Suport email standard","order":3}]'
WHERE tier_code = 'ENTRY';
UPDATE league_tiers
SET benefits_json = '[{"icon":"⚡","category":"fees","description":"Discount 5% la comisioane retragere","order":1},{"icon":"📊","category":"analytics","description":"Rapoarte săptămânale detaliate","order":2},{"icon":"💬","category":"support","description":"Suport prioritar chat live","order":3},{"icon":"🎯","category":"priority","description":"Acces prioritar la oportunități noi","order":4}]'
WHERE tier_code = 'SILVER';
UPDATE league_tiers
SET benefits_json = '[{"icon":"💰","category":"fees","description":"Discount 10% la toate comisioanele","order":1},{"icon":"📈","category":"analytics","description":"Dashboard personalizat cu predicții AI","order":2},{"icon":"👨‍💼","category":"support","description":"Account manager dedicat","order":3},{"icon":"🚀","category":"priority","description":"Early access la produse noi","order":4},{"icon":"🎁","category":"rewards","description":"Bonus lunar pe bază de performance","order":5}]'
WHERE tier_code = 'GOLD';
UPDATE league_tiers
SET benefits_json = '[{"icon":"💎","category":"fees","description":"Discount 20% + cashback lunar 2%","order":1},{"icon":"🤖","category":"analytics","description":"AI trading signals în timp real","order":2},{"icon":"📞","category":"support","description":"Hotline 24/7 + WhatsApp direct","order":3},{"icon":"🏆","category":"priority","description":"Acces VIP la evenimente exclusive","order":4},{"icon":"💼","category":"consulting","description":"Consultanță strategică trimestrială","order":5},{"icon":"🎖️","category":"rewards","description":"Programe de loialitate premium","order":6}]'
WHERE tier_code = 'PRO';