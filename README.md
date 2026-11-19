# Growe

Web digitálního studia [Growe](https://www.growe.cz/): služby, portfolio, reference, orientační ceník a nezávazná poptávka. Česká a anglická verze, vlastní stránka 404, favicony a obrázek pro sdílení. Součástí jsou informace o ochraně osobních údajů, cookies a provozovateli.

## Spuštění

Vyžaduje Node.js 20.19+ nebo 22.12+ a npm.

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

## Sestavení pro FORPSI

```sh
npm run build:forpsi
npm run test:launch
npm run test:sites
npm run test:motion
```

Obsah složky `dist/forpsi/` se nahrává do webového adresáře `/www` na FORPSI. Nahrajte také skrytý soubor `.htaccess`. Server musí mít PHP 8+ a funkční odesílání přes `mail()`. V repozitáři jsou zdrojové soubory; sestavení a závislosti se vytvářejí těmito příkazy a nejsou verzované.

Formulář posílá údaje přímo na `/contact.php` do `info@growe.cz`, včetně nepovinného telefonu. Nepotřebuje API klíč. Výchozí endpoint je součástí aplikace; pro jeho změnu lze použít vzor `.env.forpsi.example`. Na statickém lokálním náhledu bez PHP skutečné odeslání nefunguje. Ověření doručení vyžaduje test na hostingu. Testy skutečné e-maily neposílají.

Volitelné testy PHP, pokud je PHP dostupné v systému:

```sh
npm run test:forpsi
```

Po sestavení lze web prohlédnout přes `npm run preview`. Pro lokální náhled se skutečnou chybovou stránkou 404 je k dispozici také `python3 scripts/preview-local.py` na portu 4177.

## Struktura

- `src/page.html`: obsah hlavní stránky; `src/App.jsx`: interakce a odeslání poptávky.
- `src/content.en.json`: anglické překlady; `en/index.html`: anglický vstup.
- `src/services.json` a `scripts/service-pages.mjs`: české a anglické podstránky služeb a sitemap.
- `public/`: obrázky, písma, maskoti, favicony, náhled sdílení, 404 a právní stránky.
- `hosting/forpsi/`: PHP formulář a pravidla Apache.
- `design-inputs/`: údaje projektů, pracovní podklady ceníku a původ vizuálních podkladů.
- `tests/`: kontroly sestavení, odkazů, jazyků, navigace a formuláře.
- `worker/` a `.openai/hosting.json`: doplňkové balení pro statický hosting Sites. Produkční formulář je určený pro FORPSI s PHP.

## Provoz

Web neobsahuje analytické ani reklamní sledování. Kontaktní údaje a dokumenty jsou připravené pro Patrika Mácu, IČO 17738750. Neuskutečněné poptávky se podle potvrzených pravidel uchovávají nejvýše 12 měsíců od poslední komunikace; mazání ve schránce není automatizované tímto webem.

Před změnou produkčního webu zálohujte stávající soubory. Po nahrání ověřte HTTPS, přesměrování, podstránky, skutečné HTTP 404 a doručení poptávky. Nahrání do GitHubu samo o sobě neprovádí nasazení na FORPSI.
