# Nasazení na FORPSI

1. Spusťte `npm ci` a `npm run build:forpsi`.
2. Zálohujte aktuální obsah produkčního webového adresáře.
3. Nahrajte obsah `dist/forpsi/` do `/www`, včetně `.htaccess`, všech adresářů a `contact.php`.
4. Ověřte HTTPS a přesměrování na `https://www.growe.cz/`, obě jazykové verze, podstránky služeb a právní stránky.
5. Otevřete neexistující adresu a ověřte vlastní 404 i HTTP stav 404.
6. Po autorizaci odešlete zkušební poptávku a potvrďte skutečné doručení do `info@growe.cz` a možnost odpovědět zákazníkovi.

PHP 8+ musí mít dostupnou funkci `mail()` a zapisovatelný systémový dočasný adresář. Formulář používá pevného odesílatele Growe, zákazníkův e-mail jako Reply-To, ověření vstupů, ochranné pole a minutový limit. Úspěšná odpověď znamená předání hostingové poště; samotné doručení je nutné ověřit ve schránce.

Náhled sdílení je `/growe-share-v3.jpg`. Sociální aplikace mohou mít starší náhled uložený. Zkontrolujte i dostupnost obrázku na veřejné doméně.

Nenasazujte soubory `.env`, závislosti `node_modules` ani zdrojové podklady přímo do veřejného webového adresáře. Produkční balíček vytváří sestavení.
