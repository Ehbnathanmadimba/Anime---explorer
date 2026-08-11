# AI-LOG — AniVault (Anime Explorer)

**Vak:** Web Advanced
**Opleiding:** Toegepaste Informatica, Erasmushogeschool Brussel
**Student:** Nathan Madimba
**Project:** AniVault / Anime Explorer — SPA in Vanilla JavaScript (ES6+), Vite en de Kitsu API
**Periode:** 1 augustus – 10 augustus 2026
**Gebruikte AI:** Claude (Anthropic), als vraagbaak tijdens het bouwen

---

## Inleiding

Voor dit project heb ik AI gebruikt als hulp tijdens het maken van AniVault. Ik heb het vooral gebruikt wanneer ik vast zat, wanneer iets niet werkte zoals ik dacht, of wanneer ik wou weten of mijn aanpak wel de juiste was.

De bedoeling was niet dat AI alles maakt en dat ik het blind kopieer. Ik heb telkens eerst zelf een versie geschreven en dan pas een vraag gesteld over de code die er al stond. Alles wat ik terugkreeg heb ik hertypt in mijn eigen naamgeving (`haalOp`, `verwerkLijst`, `wisselFavoriet`) en daarna getest in de browser. Soms gaf AI een oplossing die ik te ingewikkeld vond, en dan heb ik ze simpeler gemaakt of gewoon niet gebruikt. Dat staat ook in dit document.

De belangrijkste chat die ik gebruikte staat hier:
`[link naar chat toevoegen]`

Hieronder staat dat gesprek, opgedeeld per fase, met per fase de commits die eruit kwamen en wat ik zelf getest heb.

---

## Fase 1 — Modulaire structuur opzetten

### Mijn vraag

> "Hoe zet ik die Vite structuur handig op in aparte bestanden zoals api.js, ui.js, form.js, storage.js en main.js?"

### Wat ik terugkreeg

Het antwoord begon met de bevestiging dat de structuur er in principe al stond, en gaf daarna de regel die het werkbaar houdt: **afhankelijkheden gaan één kant op.**

```
main.js      → importeert alles, houdt state (ruweLijst, filter, sort)
├─ api.js    → fetch + cache naar Kitsu   (importeert storage)
├─ ui.js     → render kaarten/tabel/modal (importeert storage)
├─ form.js   → form-elementen + validatie
└─ storage.js→ localStorage read/write + favorieten (importeert niks)
```

Zolang niemand terug naar `main.js` importeert, krijg je geen circulaire imports en blijft elk bestand apart te bekijken. Dat was voor mij het echte inzicht: ik dacht eerst dat "modulair" gewoon betekende dat je je code over meerdere bestanden verdeelt. Maar de richting van de imports is wat het onderhoudbaar maakt. `storage.js` importeert niets en is daardoor de enige module die ik in principe los zou kunnen testen.

Er kwamen ook twee kritische opmerkingen bij:

1. **DOM-queries op moduleniveau.** In `form.js` en `ui.js` doe ik `document.querySelector` meteen bij het importeren. Dat werkt bij mij omdat `<script type="module">` onderaan de `<body>` staat, maar het breekt zodra je een bestand in isolatie zou testen. Alternatief: een `initForm()` exporteren die de referenties binnen een functie ophaalt.
2. **`main.js` doet te veel.** 258 regels, en drie verschillende taken: state bijhouden, sorteren/filteren, en events koppelen. De suggestie was om `sorteer()` en `verwerkLijst()` ooit naar een `state.js` te verhuizen, omdat dat pure functies zijn zonder DOM.

### Wat ik ermee gedaan heb

De structuur zelf klopte al, dus daar heb ik niets aan veranderd. De twee opmerkingen heb ik bewust laten liggen voor deze oplevering — zie de sectie "Wat ik bewust níét heb gedaan".

### Commits uit deze fase

| Commit | Boodschap |
|---|---|
| `6d25ead` | init: basis setup van vite project en mappenstructuur |
| `95d17ed` | feat(config): update package.json met type module en dependencies |
| `aae8e6b` | feat(form): maak form.js aan voor invoercontrole |
| `21d461c` | feat(storage): maak storage.js aan voor browser data beheer |

### Zelf getest in de browser

`npm run dev` gestart, en in de console gecontroleerd dat er geen import-fouten kwamen. Daarna in het Sources-tabblad van DevTools gekeken of alle vijf de modules apart geladen werden — dat is voor mij het bewijs dat Vite de ES-modules echt als modules behandelt en niet alles in één bundel plakt tijdens development.

---

## Fase 2 — Van Jikan naar Kitsu, met caching en foutafhandeling

Dit is de fase waar ik het meeste tijd in heb verloren. Ik was begonnen met de Jikan API v4, maar ik kreeg om de haverklap `504 Gateway Timeout`. Niet altijd — dat was net het vervelende. Soms werkte het tien keer na elkaar, dan lag het weer plat.

### Wat ik gedaan heb

Ik ben overgestapt op **Kitsu** (`https://kitsu.io/api/edge`). Die is stabieler geweest tijdens mijn hele bouwperiode. Het datamodel is wel anders: bij Kitsu zit alles onder `data[].attributes`, dus alle velden die ik al had (`title`, `score`, `episodes`) moesten omgezet worden naar `canonicalTitle`, `averageRating`, `episodeCount`, `startDate`, `showType` en `posterImage.medium`. Dat was een saaie maar leerzame refactor.

De ophaal-functie heb ik daarna in één centrale `haalOp` gegoten, zodat `getTopAnime` en `searchAnime` allebei dezelfde foutafhandeling en caching krijgen:

```js
const haalOp = async (url, cacheSleutel) => {
  const uitCache = leesCache(cacheSleutel);

  if (uitCache) {
    console.log('Uit cache geladen:', cacheSleutel);
    return uitCache;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP fout ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    schrijfCache(cacheSleutel, data.data);
    return data.data;
  } catch (error) {
    console.error(`Ophalen mislukt (${cacheSleutel}):`, error);
    return [];
  }
};
```

Drie dingen die ik hieruit onthouden heb:

- **`try...catch` alleen is niet genoeg.** `fetch` gooit alleen een error bij een netwerkfout. Een 404 of een 500 komt gewoon binnen als een geslaagde belofte met `ok: false`. Vandaar de expliciete `if (!response.ok) throw`. Zonder die regel zou mijn `catch` bij een serverfout nooit afgaan en zou ik `.json()` proberen te lezen van een foutpagina.
- **Teruggeven van `[]` bij een fout.** Ik geef bewust een lege array terug in plaats van de error door te gooien. Daardoor hoeft `main.js` niet overal opnieuw te controleren of het resultaat wel een array is, en toont de UI netjes de lege-state-melding in plaats van te crashen.
- **Caching in localStorage.** Ik bewaar `{ data, tijd }` en beschouw de cache als verlopen na een uur (`CACHE_DUUR_MS`). De zoekcache krijgt een sleutel per zoekterm (`anime-explorer:cache:zoek:naruto`), zodat een tweede keer hetzelfde zoeken meteen resultaat geeft. Dat was ook een praktische oplossing voor de rate limits: tijdens het stylen herlaadde ik de pagina tientallen keren per uur.

### Commits uit deze fase

| Commit | Boodschap |
|---|---|
| `2a2547b` | feat(api): voeg try/catch foutafhandeling toe aan getTopAnime |
| `a11ef24` | feat(api): voeg searchAnime functie toe met encodeURIComponent |
| `f32f706` | refactor(api): Jikan vervangen door Kitsu wegens aanhoudende 504 fouten |
| `ef44db7` | fix(html): pas bronvermelding aan naar Kitsu API |
| `d16b964` | feat: api data cachen in localstorage |

### Zelf getest in de browser

- In het Network-tabblad gecontroleerd dat er bij een tweede keer laden **geen** nieuwe request naar Kitsu vertrekt, en dat er in de console `Uit cache geladen: anime-explorer:cache:top` verschijnt.
- Met "Offline" aangevinkt in DevTools de pagina herladen: geen witte pagina, geen error in de console die de app stillegt — de app blijft draaien en toont de lege state.
- De URL in `buildUrl` tijdelijk kapotgemaakt (`/animeXYZ`) om een 404 uit te lokken en te zien of mijn `response.ok`-check echt afgaat. Dat deed hij: `HTTP fout 404: Not Found` in de console.
- Gezocht op `one piece` (met een spatie) om te controleren dat `encodeURIComponent` zijn werk doet in de querystring.

---

## Fase 3 — HTML-semantiek nakijken

### Mijn vraag

> "En welke HTML-tags gebruik ik best in index.html voor de header, main en footer?"

### Wat ik terugkreeg

Ik gebruikte `<header>`, `<nav>`, `<main>`, `<section>`, `<article>` en `<footer>` al, dus dat zat goed. Maar er kwamen vier concrete verbeterpunten uit:

1. **Zoekformulier en filterbalk staan buiten `<main>`.** Ze zijn nu siblings tussen header en main, terwijl het bedieningselementen van de hoofdinhoud zijn. Ze horen ín `<main>`, zodat alleen `<header>`, `<main>` en `<footer>` directe kinderen van `#app` blijven.

2. **Mijn modal is een `<div>`.** Dat hoort `<dialog id="modal">` te zijn. Die geeft je gratis een focus-trap, sluiten met Escape, en `::backdrop` voor de achtergrond. Wel met een JS-wijziging erbij: `showModal()` en `close()` in plaats van mijn `.verborgen`-class. Dat maakt trouwens een deel van mijn eigen code overbodig — ik heb nu een aparte `keydown`-listener op `document` staan alleen om Escape af te vangen, en die kan dan weg.

3. **Statusregels zonder live region.** `#status-message` en `#search-error` veranderen via JavaScript, maar een screenreader krijgt dat niet mee omdat er geen focus naartoe gaat:

   ```html
   <p id="status-message" aria-live="polite"></p>
   <p id="search-error" role="alert"></p>
   ```

   `polite` wacht tot de gebruiker uitgesproken is, `alert` (dat impliciet `assertive` is) onderbreekt meteen. Dat verschil vond ik logisch: een laadmelding mag wachten, een foutmelding bij het zoeken niet.

4. **Toggle-knoppen missen hun toestand in de markup.** Mijn chips en navknoppen krijgen `class="actief"`, maar dat is styling, geen semantiek. Er hoort `aria-pressed="true|false"` bij, en `#filter-knoppen` verdient een `role="group"` met een `aria-label="Filter op type"`.

Plus een kleinigheid: de `<th>`'s in mijn tabel in `ui.js` mogen nog `scope="col"` krijgen.

### Wat ik ermee gedaan heb

Punten 1, 3 en 4 zijn puur HTML en breken niets — die kunnen in één commit, waarbij er visueel niets verandert. Punt 2 (`<dialog>`) raakt ook JavaScript en hoort dus in een aparte commit, omdat het echt een gedragswijziging is.

Op het moment van deze oplevering staan deze aanpassingen nog **niet** in de code. Ik heb ze bewust als volgende stap genoteerd in plaats van ze er vlak voor de deadline nog in te duwen — zie de laatste sectie.

### Commits uit deze fase

| Commit | Boodschap |
|---|---|
| `4a6d8a6` | HTML structuur opgebouwd op semantische wijze/manier |
| `a8901df` | feat(html): voeg formulier, main sectie en footer toe |

### Zelf getest in de browser

De pagina door de HTML-validator van W3C gehaald (geen fouten), en met de Accessibility-inspector in DevTools de boomstructuur bekeken. Daar zag ik goed wat er bedoeld werd met punt 4: mijn actieve filterchip is voor een screenreader niet te onderscheiden van de niet-actieve, want het verschil zit alleen in de CSS.

---

## Fase 4 — Sorteren met ontbrekende waardes

Dit was voor mij de leerzaamste vraag van het hele project, want ik dacht dat mijn sortering werkte.

### Het probleem

Mijn normalisatie zag er zo uit:

```js
const scoreVan = (anime) => Number(anime.attributes.averageRating ?? 0);
```

Een anime zonder score wordt dus `0`. Bij "score hoog → laag" zakken die netjes naar onder en ziet het er prima uit. Maar bij **"score laag → hoog"** staan al mijn scoreloze anime plots bovenaan, vóór een echte score van 12. Hetzelfde met `jaarVan`: bij "jaar oud → nieuw" krijg ik eerst een blok items uit "jaar 0". Ik had dat nooit gezien omdat ik altijd op de hoog-naar-laag-optie testte.

De oorzaak, letterlijk zoals ik hem kreeg: je vertaalt "onbekend" naar een getal, en daarmee wordt het een gewone waarde die gewoon meesorteert. De oplossing is het onbekende **apart afhandelen vóór je de richting toepast**:

```js
const vergelijk = (waardeVan, omgekeerd = false) => (a, b) => {
  const x = waardeVan(a);
  const y = waardeVan(b);

  if (x === null && y === null) return 0;
  if (x === null) return 1;   // a mist een waarde → altijd naar achteren
  if (y === null) return -1;  // b mist een waarde → a naar voren

  return omgekeerd ? y - x : x - y;
};
```

Die drie `null`-regels staan bewust bóven de `omgekeerd`-ternary. Daardoor zakken onbekenden naar de bodem in **beide** richtingen, wat precies is wat je wil. Belangrijk detail: dit werkt alleen als je normalisatie `null` teruggeeft in plaats van `0`, want anders kun je "onbekend" en "echt nul" niet meer uit elkaar houden.

Daarmee wordt mijn hele `if/else`-ketting van zeven takken een opzoektabel:

```js
const SORTEERDERS = {
  'score-hoog': vergelijk((anime) => anime.score, true),
  'score-laag': vergelijk((anime) => anime.score),
  'jaar-nieuw': vergelijk((anime) => anime.jaar, true),
  'jaar-oud':   vergelijk((anime) => anime.jaar),
  'titel-az':   (a, b) => a.titel.localeCompare(b.titel, 'nl', { numeric: true }),
  'titel-za':   (a, b) => b.titel.localeCompare(a.titel, 'nl', { numeric: true }),
  rang:         vergelijk((anime) => anime.rang),
};

const sorteer = (lijst) =>
  lijst.slice().sort(SORTEERDERS[sortSelect.value] ?? SORTEERDERS.rang);
```

### Twee dingen die ik erbij meepakte

**Mijn titelsortering was technisch stuk.** Ik had `(a, b) => (titelVan(a) > titelVan(b) ? 1 : -1)`. Die geeft nooit `0` terug, dus bij twee identieke titels beweert mijn comparator dat de ene vóór de andere komt. Dat is een inconsistente vergelijking. In de praktijk werkte het meestal toch, en dat is net het gevaarlijke eraan. `localeCompare` doet het correct én behandelt accenten fatsoenlijk, en met `numeric: true` komt "Season 2" vóór "Season 10" in plaats van erna.

**Oppassen met `NaN`.** Als `waardeVan` ooit `NaN` teruggeeft — `Number(undefined)` bijvoorbeeld — dan zijn álle vergelijkingen `false` en produceert `.sort()` stilletjes een willekeurige volgorde. Geen foutmelding, gewoon rommel. Dat is de reden om op `null` te testen en niet op falsy: `0` is een geldige score, `null` niet.

Wat ik zelf al goed had: de `lijst.slice()` vóór `.sort()`. `sort` muteert de originele array, en zonder die kopie zou ik mijn `ruweLijst` telkens herschikken en zou mijn filter na een paar klikken op een andere volgorde werken dan verwacht. Sinds ES2023 kan `lijst.toSorted(...)` dat trouwens in één stap.

### Commits uit deze fase

| Commit | Boodschap |
|---|---|
| `36578f3` | feat: sorteren op rang, score, titel en jaar |
| `080a66f` | feat: meer sorteeropties en fix van blijvende melding |

### Zelf getest in de browser

Ik heb per sorteeroptie bovenaan én onderaan de lijst gekeken, in beide richtingen. Zo vond ik het probleem ook echt terug: bij "score laag → hoog" stonden er een handvol kaarten met `?` als score bovenaan. Verder heb ik gecontroleerd of de sortering blijft kloppen nadat ik eerst een filter aanzet (filteren en dan sorteren, niet omgekeerd), en of de resultatenteller meebeweegt.

---

## Fase 5 — Lazy loading met IntersectionObserver

### Mijn vraag

> "Die IntersectionObserver voor lazy loading van afbeeldingen. Hoe gebruik ik dat?"

### De mechaniek

Je maakt één observer met een callback, je meldt elementen aan met `observe()`, en de browser roept je callback aan zodra een element de viewport binnen- of buitenschuift. Het detail dat ik verkeerd had: **de `entries`-array bevat alleen de elementen waarvan de toestand veranderde**, niet alles wat je observeert. Ik dacht dat ik telkens de volledige lijst terugkreeg.

### Drie dingen die beter kunnen aan mijn versie

**1. Ik maak bij elke render een nieuwe observer.** `startLazyLoading()` wordt aangeroepen in zowel `renderAnimeCards` als `renderFavorieten`, en die draaien bij elke filterklik, elke sortering, elke zoekopdracht en elke favoriet-toggle. Elke keer dus een verse `IntersectionObserver` die ik nooit `disconnect()`. Op moduleniveau zetten lost dat op:

```js
const lazyObserver = new IntersectionObserver(
  (entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }

      const afbeelding = entry.target;

      afbeelding.src = afbeelding.dataset.src;
      afbeelding.classList.remove('lazy');
      observer.unobserve(afbeelding);
    }
  },
  { rootMargin: '200px' }
);

const startLazyLoading = (container) => {
  for (const afbeelding of container.querySelectorAll('img.lazy')) {
    lazyObserver.observe(afbeelding);
  }
};
```

**2. `rootMargin: '200px'` is de grootste zichtbare winst.** Nu begint een afbeelding pas te laden op het moment dat ze in beeld komt, dus je ziet eerst een leeg vlak en dan een plop. Met die marge blaas je de detectiezone 200px op in alle richtingen, zodat het laden start net vóór de kaart in beeld schuift. Meestal is de afbeelding er dan al tegen de tijd dat je hem ziet. Dit is één woord code voor een merkbaar verschil in hoe vlot de app aanvoelt.

**3. Ik zoek met `document.querySelectorAll`, dus globaal.** Daardoor meldt `renderFavorieten` ook de kaarten in mijn resultatensectie opnieuw aan. De container meegeven — `startLazyLoading(animeContainer)` en `startLazyLoading(favoritesList)` — houdt elke render bij zijn eigen elementen.

Wat ik wel goed had staan: de `observer.unobserve(afbeelding)` in de callback. Zonder dat blijft de browser elementen volgen die al klaar zijn.

### De eerlijke kanttekening

Hier kreeg ik ook een tegenargument, en dat vond ik het waardevolste stuk: hiervoor bestaat sinds een paar jaar een ingebouwd alternatief. `<img loading="lazy" src="...">` doet precies hetzelfde zonder één regel JavaScript, en het werkt ook als je script faalt — bij mijn aanpak heeft de `<img>` helemaal geen `src` tot de observer hem invult. Voor Web Advanced is `IntersectionObserver` een expliciet leerdoel, dus die laat ik staan. Maar ik weet nu dat ik het bij een echt project met een attribuut zou oplossen.

### Commits uit deze fase

| Commit | Boodschap |
|---|---|
| `4c5de79` | feat(observer): implementeer IntersectionObserver voor lazy loading |
| `1dda3b5` | feat(ui): voeg laad-indicator toe tijdens het fetchen |

### Zelf getest in de browser

In het Network-tabblad gefilterd op `Img` en dan traag naar beneden gescrold: je ziet de requests één voor één binnenkomen in plaats van allemaal bij het laden van de pagina. Met throttling op "Slow 3G" is het effect het duidelijkst. Daarna heb ik het aantal requests bij het openen van de pagina vergeleken met de versie zonder observer — dat scheelde bij mij ongeveer twee derde van de afbeeldingen bij een viewport van één schermhoogte.

---

## Fase 6 — Afwerking en README

De laatste dagen gingen vooral naar styling en documentatie: het paarse kleurverloop, de kaarten met badge en scorebalk, de filters als pill-knoppen, media queries voor mobiel en tablet, en het onthouden van de themakeuze tussen sessies. Daar heb ik geen AI voor gebruikt — dat was gewoon CSS schrijven en herladen tot het klopte.

| Commit | Boodschap |
|---|---|
| `93f94de` | feat: modal herontwerp met favorietenknop en escape |
| `88454c4` | style: media queries voor mobiel en tablet |
| `6d49d97` | style: bredere layout en grotere hero |
| `577252d` | docs: voeg README en screenshots toe |

Getest op een echte gsm via het netwerkadres van Vite (`--host`), niet alleen in de responsive modus van DevTools. Dat was nuttig: de tabelweergave paste niet op een smal scherm en scrolt nu horizontaal.

---

## Wat ik bewust níét heb overgenomen

Niet elk advies is in de code beland, en dat is een keuze geweest:

- **`<dialog>` in plaats van mijn `<div class="verborgen">`.** Dit is duidelijk de betere oplossing, maar het raakt HTML, CSS én JavaScript tegelijk. Zo'n wijziging vlak voor een deadline doorvoeren is precies hoe je iets breekt dat werkte. Ik heb het als eerste punt op mijn to-do gezet.
- **De null-veilige `vergelijk`-functie en `localeCompare`.** Zelfde reden: het is een correcte fix van een echt probleem, maar het herschrijft mijn volledige `sorteer()`. Ik weet nu precies wat er mis is en waarom, en dat kan ik ook uitleggen bij de verdediging.
- **`aria-live`, `aria-pressed` en `scope="col"`.** Deze zijn wél risicoloos — puur markup, geen gedragswijziging. Dat is mijn eerstvolgende commit.
- **`initForm()` in plaats van DOM-queries op moduleniveau.** Het argument klopt, maar de winst is er pas als ik echt unit tests ga schrijven. Voor dit project zou het complexiteit toevoegen zonder dat er iets beter van wordt.
- **`sorteer()` en `verwerkLijst()` naar een `state.js`.** Mijn `main.js` is met 258 regels aan de grote kant, maar nog te overzien. Als het project verder zou groeien, is dit de eerste splitsing die ik zou maken.

Ik heb er ook één opmerking uit gekregen die niets met code te maken had maar wel klopte: mijn projectinstructies vermeldden nog Jikan v4 terwijl `api.js` al met Kitsu praatte. Dat soort inconsistentie tussen je documentatie en je code merk je zelf niet meer op na een week.

---

## Samenvatting AI-gebruik

| Onderdeel | AI gebruikt? | Waarvoor |
|---|---|---|
| Vite project opzetten | Nee | zelf gedaan met de lesstof |
| Modulaire structuur | Deels | uitleg over de richting van imports |
| HTML en CSS | Nee/deels | vooral zelf, soms een semantiek-vraag |
| Overstap naar Kitsu | Nee | zelf beslist na de 504-problemen bij Jikan |
| Fetch met try/catch | Ja/deels | uitleg over `response.ok` bij een 404 |
| Caching in localStorage | Deels | idee om `{ data, tijd }` te bewaren |
| Favorieten | Nee | zelf geschreven in storage.js |
| Filteren en sorteren | Ja | de bug met ontbrekende waardes |
| Modal en details | Deels | `<dialog>` als betere oplossing |
| IntersectionObserver | Ja | syntax en `rootMargin` |
| Toegankelijkheid | Ja | aria-live, aria-pressed, scope |
| Responsive design | Nee | zelf media queries geschreven |
| README en screenshots | Nee | zelf gemaakt |

---

## Conclusie

AI was vooral handig wanneer ik een vraag stelde over code die er al stond, en veel minder wanneer ik iets nieuws liet schrijven. De beste momenten waren die waar ik dacht dat alles goed zat. De sorteerbug bij "score laag → hoog" had ik zelf waarschijnlijk pas gevonden als iemand er tijdens de verdediging op geklikt had, want ik testte altijd op hoog naar laag.

Ik heb niet alles blind overgenomen. Twee keer kreeg ik er een tegenargument bij, en dat vond ik het nuttigste van heel het gesprek. Bij lazy loading dat `loading="lazy"` in een echt project eigenlijk de betere keuze is, en bij mijn titelsortering dat die "meestal toch werkt" maar technisch fout is. Dat leert je iets over de afweging en niet alleen over de syntax. Er zijn ook stukken advies die ik bewust laten liggen heb omdat ze te veel tegelijk zouden veranderen vlak voor de deadline. Die staan hierboven bij "Wat ik bewust níét heb gedaan", met de reden erbij.

Niet elk detail zou ik uit mijn hoofd opnieuw kunnen typen, maar ik weet wel waarvoor elk stuk in mijn project dient en waarom het er zo uitziet.
