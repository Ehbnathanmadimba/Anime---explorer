# Chatlog AI — AniVault (Anime Explorer)

Geëxporteerd op 11 augustus 2026 uit het Cowork-gesprek "ChatlogAI".
Vak: Web Advanced — Erasmushogeschool Brussel.

Dit is de volledige inhoud van het gesprek, in de oorspronkelijke volgorde.

---

## 1. Vite-structuur in aparte bestanden

**Vraag:** Hoe zet ik die Vite structuur handig op in aparte bestanden zoals api.js, ui.js, form.js, storage.js en main.js?

**Antwoord (samengevat):**

```
main.js      → importeert alles, koppelt events, houdt state (ruweLijst, filter, sort)
  ├─ api.js    → fetch + cache naar Kitsu    (importeert storage)
  ├─ ui.js     → render kaarten/tabel/modal  (importeert storage)
  ├─ form.js   → form-elementen + validatie
  └─ storage.js→ localStorage read/write + favorieten
```

De regel die dit werkbaar houdt: **afhankelijkheden gaan één kant op.** `main.js` mag alles importeren, `api/ui/form` mogen alleen `storage` importeren, en `storage.js` importeert niks. Zolang niemand terug naar `main.js` importeert, geen circulaire imports en blijft elk bestand los testbaar.

Twee aanscherpingen:

1. **DOM-queries op moduleniveau.** `form.js` en `ui.js` doen `document.querySelector` bij het importeren. Werkt nu, maar breekt zodra je een bestand in isolatie test. Alternatief: exporteer een `initForm()` die de refs binnen een functie ophaalt.
2. **`main.js` is 258 regels** en doet drie dingen: state, sorteren/filteren, event-binding. `sorteer()`/`verwerkLijst()` zijn de logische eerste kandidaat om naar een `state.js` te verhuizen — pure functies, geen DOM.

---

## 2. Semantische HTML-tags in index.html

**Vraag:** Welke HTML-tags gebruik ik best in index.html voor de header, main en footer?

**Antwoord:** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` staan er al. Vier verbeterpunten:

1. **Zoekform en filterbalk staan buiten `<main>`.** Het zijn bedieningselementen van de hoofdinhoud, dus verplaatsen naar binnen:

```html
<main>
  <form id="search-form">…</form>
  <div id="filter-balk">…</div>
  <section id="favorites-section">…</section>
  <section id="results-section">…</section>
</main>
```

2. **De modal is een `<div>`.** Dat hoort `<dialog id="modal">` te zijn — gratis focus-trap, Escape-sluiten en `::backdrop`.

3. **Statusregels zonder live region:**

```html
<p id="status-message" aria-live="polite"></p>
<p id="search-error" role="alert"></p>
```

4. **Toggle-knoppen missen hun state in de markup.** `class="actief"` is styling, geen semantiek. Zet er `aria-pressed="true|false"` bij, en geef `#filter-knoppen` een `role="group"` met `aria-label="Filter op type"`. In de tabel mogen de `<th>`'s nog `scope="col"`.

---

## 3. Footer onderaan houden met CSS

**Vraag:** Hoe zorg ik ervoor in CSS dat de footer netjes onderaan blijft staan en niet ergens in het midden zweeft als er nog geen content is?

**Antwoord:**

```css
#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
}

#site-footer {
  margin-top: auto;
  padding: 32px 0 24px;
}
```

`margin-top: auto` op een flex-item slurpt alle overgebleven vrije ruimte op, dus de footer wordt naar beneden geduwd. Is er wél veel content, dan is er geen vrije ruimte over en schuift hij gewoon mee omlaag.

Drie details:

- **`min-height` en niet `height`** — met `height: 100dvh` zou de inhoud uit de container lopen zodra er meer dan één scherm aan kaarten is.
- **Twee keer `min-height`** is opzet: browsers die `dvh` niet kennen negeren de tweede regel en houden `100vh`. Op mobiel voorkomt `dvh` een scrollbar van ~60px door de adresbalk.
- **Waarom niet `main { flex: 1 }`** — dat werkt ook, maar `#app` heeft zes directe kinderen. `margin-top: auto` werkt ongeacht welke siblings ervoor staan. `#modal` is `position: fixed` en telt niet mee als flex-item.

---

## 4. Jikan of Kitsu?

**Vraag:** Is Jikan of Kitsu een goede API om te gebruiken?

**Antwoord:**

**Jikan v4** is een community-wrapper rond MyAnimeList — de grootste catalogus, actief onderhouden, geen API-key, 60 requests/minuut (max 3/seconde). Platte JSON: `anime.title`, `anime.score`, `anime.images.jpg.image_url`.

**Kitsu** doet JSON:API met genest `data.attributes`. Werkt vandaag prima, maar de Kitsu-app verdween in 2024 uit de Play Store en de ontwikkeling ligt sindsdien grotendeels stil. Geen officiële deprecation, maar wel een project waar niemand meer aan trekt — een klein risico voor een eindwerk dat je nog moet verdedigen.

Doorslaggevend: **de projectspec zegt Jikan v4.**

De nette oplossing voor de overstap — een normalisatiefunctie in `api.js`:

```js
const normaliseer = (item) => ({
  id: String(item.mal_id),
  titel: item.title,
  type: item.type ?? '?',
  afleveringen: item.episodes ?? null,
  score: item.score ?? null,
  jaar: item.year ?? null,
  status: item.status ?? '?',
  poster: item.images?.jpg?.image_url ?? '',
  synopsis: item.synopsis ?? '',
});
```

`ui.js` weet dan niet meer welke API erachter zit. Wissel je later van bron, dan verander je één functie in plaats van vijf bestanden.

**Bronnen:** [Jikan REST API v4 Docs](https://docs.api.jikan.moe/) · [Jikan v4.0 release notes](https://www.patreon.com/posts/jikan-v4-0-60604773) · [Kitsu API docs](https://kitsu.docs.apiary.io/) · [MyAnimeList vs AniList vs Kitsu (2026)](https://www.achriom.com/blog/myanimelist-vs-anilist-vs-kitsu/) · [Comparison of Anime Library APIs](https://taiga.moe/api.html)

---

## 5. `.then()` versus `async/await`, en waarom `try...catch` + `response.ok`

**Vraag:** Wat is nu het echte verschil tussen .then() en async/await, en waarom moet ik try...catch en response.ok gebruiken in api.js?

**Antwoord:** Onder de motorkap is er geen verschil — `await` is syntax rond dezelfde Promise. Deze twee doen letterlijk hetzelfde:

```js
fetch(url).then((r) => r.json()).then((data) => console.log(data));

const r = await fetch(url);
const data = await r.json();
console.log(data);
```

Het verschil zit in wat je ermee kan schrijven. `await` pauzeert alleen de `async`-functie waarin het staat; de rest van je pagina blijft draaien. Binnen die functie loopt de code van boven naar beneden, dus je kan normale `if`, `for` en `try` gebruiken. In een `.then()`-keten moet je voor elke vertakking een nieuwe callback maken, en resultaten uit stap 1 zijn niet meer bereikbaar in stap 3. Bijkomend: stack traces bij `await` wijzen naar jouw regel.

**`try/catch`** is nodig omdat `await` een verworpen Promise omzet in een echte exception. Zonder `catch` krijg je een unhandled rejection: je functie stopt halverwege en `setStatus('Bezig met laden...')` blijft eeuwig op het scherm staan.

**`response.ok` is het punt dat de meeste mensen missen:** `fetch` verwerpt *niet* bij een HTTP-fout. Een 404, een 429 rate limit, een 500 — dat zijn allemaal geslaagde requests wat `fetch` betreft. Zonder die check gaat een foutpagina rechtstreeks door `response.json()`, en dan crasht het pas ergens in `maakKaart` — ver van de echte oorzaak. `fetch` verwerpt alleen bij netwerkfouten: geen verbinding, DNS mislukt, CORS geblokkeerd.

---

## 6. Waarom crasht de app bij een niet-bestaand endpoint?

**Vraag:** Waarom crasht mijn app als een endpoint niet bestaat? Fetch geeft toch zelf een error bij een 404 of niet?

**Antwoord:** Nee. `fetch` verwerpt de Promise **alleen** bij netwerkfouten. Een 404 of 500 is een geslaagd request; je krijgt een `response` met `ok: false` en `status: 404`. Je `catch` wordt nooit geraakt.

Maar de code doet dat al goed. De crash komt uit een ander gat:

```js
const data = await response.json();
schrijfCache(cacheSleutel, data.data);
return data.data;
```

Als de API **200 OK** teruggeeft maar een ander formaat dan verwacht, bestaat `data.data` niet. `response.ok` is `true`, je `catch` doet niks, en `haalOp` geeft `undefined` terug. Dat rolt door naar `main.js`:

```js
ruweLijst = await searchAnime(...);   // undefined
verwerkLijst();                       // → sorteer(undefined) → undefined.slice()
```

En dan knalt het op `Cannot read properties of undefined (reading 'slice')` — in `main.js`, ver van de echte oorzaak in `api.js`.

De fix is één regel:

```js
const lijst = Array.isArray(data.data) ? data.data : [];
schrijfCache(cacheSleutel, lijst);
return lijst;
```

**Regel voor jezelf:** `response.ok` beschermt je tegen foute *statuscodes*, maar niet tegen een correcte statuscode met onverwachte *inhoud*.

---

## 7. 504 Gateway Timeout — ligt dat aan mij?

**Vraag:** Waarom krijg ik de hele tijd een 504 Gateway Timeout? Ligt dat aan mij of aan de API?

**Antwoord:** Een 504 komt bijna nooit van jou. Het is een **proxy die zegt dat de server erachter niet op tijd antwoordde** — van Cloudflare of nginx vóór Kitsu, niet van je eigen code. Met een normale GET kan je een server niet laten timeouten; een fout verzoek levert 400 of 422 op, geen 504.

Kitsu's statuspagina: de **Legacy API** (`kitsu.io/api/edge`) staat als Operational met 100% uptime over 90 dagen. De melding "Some services are down" slaat op de iOS- en Android-app-monitors, die al maanden op 0% staan omdat de apps niet meer bestaan.

Drie kandidaten:

1. **Alleen bij zoeken?** Kitsu's full-text search (`filter[text]=`) is zwaarder dan een gesorteerde lijst ophalen. 504's alleen bij zoeken = hun kant.
2. **Het netwerk van school.** Veel schoolnetwerken zitten achter een proxy die zelf 504 teruggeeft. Test op je gsm-hotspot.
3. **Kijk wie de 504 stuurt.** DevTools → Network → gefaald request → Response Headers. `server: cloudflare` + `cf-ray` = Kitsu's edge.

Gedrag dat nu verkeerd is: 504 → `response.ok` false → `throw` → `catch` → `[]` → "Geen anime gevonden. Probeer een andere zoekterm." De gebruiker krijgt de schuld terwijl de server plat ligt.

**Bron:** [Kitsu status](https://status.kitsu.app/)

---

## 8. Fetch met cache vóór de API-call

**Vraag:** Hoe schrijf ik een asynchrone fetch-functie in api.js die eerst in de cache kijkt voordat hij de API aanroept?

**Antwoord:** Het patroon stond er al; wat ontbrak waren twee dingen:

- **Elke cache-hit gaat door `localStorage.getItem` + `JSON.parse`.** Synchroon, blokkeert de main thread, bij elke filter- of sorteeractie opnieuw.
- **Geen dedup van lopende requests.** Je `submit`-handler en je 200ms-debounce kunnen dezelfde zoekterm afvuren. Beide missen de cache, beide gaan het netwerk op.

```js
const geheugenCache = new Map();
const lopendeRequests = new Map();

const isVers = (item) => Boolean(item) && Date.now() - item.tijd <= CACHE_DUUR_MS;

const leesCache = (sleutel) => {
  const uitGeheugen = geheugenCache.get(sleutel);

  if (isVers(uitGeheugen)) {
    return uitGeheugen.data;
  }

  const uitOpslag = leesUitOpslag(sleutel, null);

  if (!isVers(uitOpslag)) {
    return null;
  }

  geheugenCache.set(sleutel, uitOpslag);
  return uitOpslag.data;
};

const schrijfCache = (sleutel, data) => {
  const item = { data: data, tijd: Date.now() };

  geheugenCache.set(sleutel, item);
  schrijfNaarOpslag(sleutel, item);
};

const doeRequest = async (url, cacheSleutel) => {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP fout ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  const lijst = Array.isArray(data.data) ? data.data : [];

  schrijfCache(cacheSleutel, lijst);
  return lijst;
};

const haalOp = async (url, cacheSleutel) => {
  const uitCache = leesCache(cacheSleutel);

  if (uitCache !== null) {
    return uitCache;
  }

  if (lopendeRequests.has(cacheSleutel)) {
    return lopendeRequests.get(cacheSleutel);
  }

  const belofte = doeRequest(url, cacheSleutel).finally(() => {
    lopendeRequests.delete(cacheSleutel);
  });

  lopendeRequests.set(cacheSleutel, belofte);
  return belofte;
};
```

De kern is die `lopendeRequests`-Map: je slaat de **Promise** op, niet het resultaat. Een tweede aanvraag tijdens een lopende call krijgt dezelfde Promise en ze wachten samen op één netwerkcall. `.finally()` ruimt de sleutel op, of het nu lukt of faalt.

Drie aandachtspunten:

- **Dit gooit nu door in plaats van `[]` te returnen.** `main.js` heeft dan een `try/catch` nodig rond `await searchAnime(...)` — in dezelfde commit.
- **Fouten worden bewust niet gecachet** — `schrijfCache` staat ná de `ok`-check.
- **`localStorage` groeit oneindig.** Na een paar honderd zoekopdrachten loop je tegen de ~5MB limiet, en `schrijfNaarOpslag` slikt die fout stil in. Een opruimfunctie bij opstarten is een nette aparte commit.

---

## 9. Code-review van mijn eigen cache-implementatie

**Vraag:** Heb ik dit zo juist geschreven? *(eigen `leesCache` / `schrijfCache` / `haalOp`)*

**Antwoord:** Ja, in de kern klopt het. De volgorde is juist (cache eerst, dan netwerk), `response.ok` staat op de goede plek, je gooit een `Error` met bruikbare info, en je schrijft pas naar de cache ná de `ok`-check — dus een mislukte call vervuilt je cache niet. Dat laatste doen veel mensen fout.

Twee dingen die echt mis kunnen gaan:

- **`data.data` is niet gegarandeerd een array.** Bij een 200 met onverwachte vorm geef je `undefined` terug en crasht `main.js` op `.slice()`.
- **De `catch` geeft `[]` terug**, waardoor "server plat" en "niks gevonden" hetzelfde scherm opleveren. Die `catch` vangt bovendien je eigen programmeerfouten op.

Géén bug: `if (uitCache)` met een lege array werkt prima — `[]` is truthy in JavaScript. `!== null` is alleen explicieter.

---

## 10. Eigen foutklasse voor HTTP-fouten

**Vraag:** Waarom moet ik response.ok controleren bij een fetch request, en hoe vang ik HTTP-fouten netjes op met try...catch?

**Antwoord:** In je huidige `catch` kan je netwerkfouten en HTTP-fouten niet meer uit elkaar houden. Geef de status mee:

```js
export class ApiFout extends Error {
  constructor(bericht, status) {
    super(bericht);
    this.name = 'ApiFout';
    this.status = status;
  }
}
```

```js
if (!response.ok) {
  throw new ApiFout(`Server gaf ${response.status}`, response.status);
}
```

En in `main.js`:

```js
catch (error) {
  if (!error.status) {
    setStatus('Geen internetverbinding.');
  } else if (error.status === 429) {
    setStatus('Te veel aanvragen. Wacht even.');
  } else if (error.status >= 500) {
    setStatus('De server reageert niet. Probeer het zo opnieuw.');
  } else {
    setStatus('Er ging iets mis bij het ophalen.');
  }
}
```

Geen `status` betekent netwerkfout, want dan kwam je nooit tot een response.

---

## 11. Nooit crashen én toch weten dát het misging

**Vraag:** Hoe zorg ik ervoor dat als het ophalen mislukt, de functie niet crasht maar netjes een lege array teruggeeft als fallback?

**Antwoord:** De echte bescherming is niet de `catch`, maar de vormcheck:

```js
const lijst = Array.isArray(data.data) ? data.data : [];
```

Wil je én nooit crashen én weten dát het misging, geef dan een resultaatobject terug:

```js
const haalOp = async (url, cacheSleutel) => {
  const uitCache = leesCache(cacheSleutel);

  if (uitCache !== null) {
    return { gelukt: true, data: uitCache, fout: null };
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ApiFout(`Server gaf ${response.status}`, response.status);
    }

    const body = await response.json();
    const lijst = Array.isArray(body.data) ? body.data : [];

    schrijfCache(cacheSleutel, lijst);
    return { gelukt: true, data: lijst, fout: null };
  } catch (error) {
    console.error(`Ophalen mislukt (${cacheSleutel}):`, error);
    return { gelukt: false, data: [], fout: error };
  }
};
```

**Let op de volgorde in `main.js`.** `verwerkLijst()` roept `renderAnimeCards([])` aan, en die zet zélf `setStatus('Geen anime gevonden...')`. Zet je je foutmelding ervóór, dan wordt hij overschreven. Netter: haal die `setStatus` uit `renderAnimeCards` weg — renderen is niet hetzelfde als interpreteren.

---

## 12. Kitsu's `attributes` uitpakken

**Vraag:** Die Kitsu API geeft data terug in attributes. Hoe pak ik dat handig uit zonder dat alles breekt?

**Antwoord:** Pak `attributes` op **één plek** uit: in `api.js`, direct nadat de data binnenkomt.

```js
const normaliseer = (item) => {
  const a = item.attributes ?? {};

  return {
    id: item.id,
    titel: a.canonicalTitle ?? 'Onbekende titel',
    type: a.subtype ?? a.showType ?? '?',
    afleveringen: a.episodeCount ?? null,
    score: a.averageRating ? Number(a.averageRating) : null,
    jaar: a.startDate ? Number(a.startDate.slice(0, 4)) : null,
    status: a.status ?? '?',
    poster: a.posterImage?.medium ?? a.posterImage?.original ?? '',
    synopsis: a.synopsis ?? '',
    rang: a.popularityRank ?? Number.MAX_SAFE_INTEGER,
  };
};
```

Drie dingen die stilletjes kapot gaan:

- **Je favorieten in localStorage staan in het oude formaat.** Bump je sleutel naar `anime-explorer:favorieten:v2`, anders renderen bestaande favorieten als `undefined`.
- **Je filtert op `subtype` maar toont `showType`.** Kitsu levert beide, meestal met dezelfde waarde — het is toeval dat je chips werken.
- **`averageRating` bij Kitsu is 0–100, geen 0–10.** Je score-balk gebruikt die waarde als `width: X%` (klopt), maar je toont ook `.toFixed(1)`, dus er staat "82.4" op je kaarten. Stap je over naar Jikan, dan wordt je balk een streepje van 8%.

---

## 13. Responsief kaartenraster

**Vraag:** Hoe maak ik een CSS grid of flexbox layout waarbij de kolommen zich automatisch aanpassen aan de breedte van het scherm?

**Antwoord:** Voor een kaartenraster is **grid** het juiste gereedschap:

```css
#anime-container,
#favorites-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
```

Lees het als: maak zoveel kolommen als er passen, elk minstens 250px breed, en verdeel de overschot gelijk. Geen media queries nodig.

Waarom beter dan `display: flex` met `.kaart { flex: 0 1 250px }`: flexbox verdeelt de ruimte **per rij afzonderlijk**. Je kaarten blijven exact 250px en laten rechts een gat van 60-80px open. Zet je `flex-grow: 1`, dan wordt een eenzame kaart op de laatste rij plots schermbreed. Grid legt de kolommen één keer vast voor de hele container.

**`auto-fill` of `auto-fit`?** `auto-fill` houdt lege kolommen aan (twee favorieten blijven twee normale kaarten links). `auto-fit` klapt lege kolommen dicht (diezelfde twee rekken uit tot elk een halve schermbreedte). Voor dit geval: `auto-fill`.

Twee dingen die hierdoor breken:

```css
#anime-tabel { grid-column: 1 / -1; }   /* anders wordt de tabel in 250px geperst */
```

En de media queries op 600px met `.kaart { flex: 1 1 100% }` kunnen weg.

Veilige variant tegen overflow op smalle schermen:

```css
grid-template-columns: repeat(auto-fill, minmax(min(250px, 100%), 1fr));
```

**Vuistregel:** grid als je uitgelijnde kolommen wil in twee richtingen, flexbox als je één rij of kolom hebt waarin items zich naar hun inhoud voegen.

---

## 14. Tabelweergave met 6 kolommen en een wisselknop

**Vraag:** Hoe maak ik een tabelweergave met 6 kolommen en een knop om te wisselen tussen kaarten en de tabel?

**Antwoord:** `renderAnimeTable` bouwt al zes kolommen (Titel, Type, Afleveringen, Score, Jaar, Status). Maar er zit een gat in: **in tabelweergave doet klikken niets.** `behandelKaartKlik` zoekt naar `.fav-knop` of `.kaart`, en je `<tr>`'s hebben geen van beide.

```js
rijen += `
  <tr class="rij" data-id="${anime.id}">
    <td>
      <button class="fav-knop-tabel" type="button" data-fav="${anime.id}">
        ${isFavoriet(anime.id) ? '♥' : '♡'}
      </button>
      ${anime.titel}
    </td>
    ...
`;
```

```js
const kaart = event.target.closest('.kaart, .rij');
```

Die knop in de titelcel is er niet alleen voor het gemak: een `<tr>` is niet met het toetsenbord bereikbaar, een `<button>` wel.

**Je weergavekeuze overleeft geen refresh:**

```js
// storage.js
WEERGAVE: 'anime-explorer:weergave',

// main.js
let toonTabel = leesUitOpslag(STORAGE_KEYS.WEERGAVE, false);
viewButton.textContent = toonTabel ? 'Toon als kaarten' : 'Toon als tabel';

viewButton.addEventListener('click', () => {
  toonTabel = !toonTabel;
  viewButton.textContent = toonTabel ? 'Toon als kaarten' : 'Toon als tabel';
  schrijfNaarOpslag(STORAGE_KEYS.WEERGAVE, toonTabel);
  toonResultaten();
});
```

Die regel moet vóór je eerste `verwerkLijst()` staan, anders rendert hij eerst kaarten en flikkert het.

---

## 15. "Geen anime gevonden" — met try/catch?

**Vraag:** Hoe zorg ik dat er 'Geen anime gevonden' op het scherm komt als een array leeg is? Gebruik ik daarvoor een try catch?

**Antwoord:** Nee — `try/catch` is voor code die *gooit*. Een lege array gooit niks; die is het normale antwoord op een geldige vraag. "Nul resultaten" is een succes, geen fout.

```js
if (animeLijst.length === 0) {
  setStatus('Geen anime gevonden. Probeer een andere zoekterm.');
}
```

Het echte probleem zit in wie die beslissing neemt. `ui.js` weet alleen *dat* de lijst leeg is, niet *waarom*. Alleen `main.js` weet dat.

```js
const resultaat = await searchAnime(zoekterm);

ruweLijst = resultaat.data;
verwerkLijst();

if (!resultaat.gelukt) {
  setStatus('Ophalen mislukt. Probeer het zo opnieuw.');
} else if (huidigeLijst.length === 0 && actiefType) {
  setStatus(`Geen anime van het type ${actiefType} in deze resultaten.`);
} else if (huidigeLijst.length === 0) {
  setStatus('Geen anime gevonden. Probeer een andere zoekterm.');
} else {
  setStatus('');
}
```

Vergeet de `else` met de lege string niet — zonder die regel blijft een oude foutmelding staan nadat een volgende zoekopdracht wél lukt.

---

## 16. Event delegation met `closest()`

**Vraag:** Hoe werkt event delegation precies met closest() om een modal te openen als je op een dynamische kaart klikt?

**Antwoord:** Twee mechanismen die samenwerken.

**Bubbling.** Klik je op de `<img>` in een kaart, dan vuurt het click-event eerst op die img en reist daarna omhoog: `.kaart-media` → `.kaart` → `#anime-container` → `<main>` → `<body>`. Waarom dat hier nodig is: `renderAnimeCards` doet `animeContainer.innerHTML = ...`, wat álle bestaande kaart-elementen vernietigt. Een listener op elke `.kaart` is na de eerste filterklik weg. Je container wordt nooit vervangen, dus een listener daarop overleeft elke render. **Je luistert op iets stabiels namens iets vluchtigs.**

**`closest()`** loopt vanaf `event.target` naar boven, het element zelf meegerekend, en geeft de eerste ouder terug die op je selector past — of `null`.

```js
const behandelKaartKlik = (event) => {
  const favKnop = event.target.closest('.fav-knop');

  if (favKnop) {
    wisselFavoriet(vindAnime(favKnop.getAttribute('data-fav')));
    // ...
    return;                      // ← cruciaal
  }

  const kaart = event.target.closest('.kaart');

  if (!kaart) {                  // ← klik in de gap tussen kaarten
    return;
  }

  openModal(vindAnime(kaart.getAttribute('data-id')));
};
```

- **De volgorde.** Je hartje zit *binnen* de kaart, dus een klik erop matcht óók `closest('.kaart')`. Eerst op het specifiekere `.fav-knop` testen en meteen `return`-en. Draai je die blokken om, dan krijg je bij elk hartje een modal in je gezicht.
- **De null-check.** Je grid heeft `gap: 20px`. Klik je in die ruimte, dan geeft `closest('.kaart')` `null` en crasht de volgende regel zonder die check.

Voor later: `focus` en `blur` bubbelen niet — daarvoor bestaan `focusin` en `focusout`. En `event.currentTarget` is altijd het element waar de listener op staat, `event.target` het aangeklikte element.

---

## 17. Modal sluiten: kruisje, backdrop, Escape

**Vraag:** Hoe zorg ik ervoor dat de modal sluit als je op het kruisje, buiten de modal, of op Escape drukt?

**Antwoord:** Alle drie werken al:

```js
modalSluit.addEventListener('click', sluitModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') sluitModal(); });
modal.addEventListener('click', (e) => { if (e.target === modal) sluitModal(); });
```

`event.target === modal` werkt omdat `#modal` een schermvullende flex-container is: klik je op de donkere rand, dan is het doelwit de container zelf. Identiteitscheck, geen `contains()`.

**Wat je wél mist is focus.** Open de modal en druk Tab: je springt door de kaarten *achter* de overlay. Met alleen een muis merk je dat niet, met een toetsenbord is het onbruikbaar. Dat krijg je gratis met `<dialog>`:

```html
<dialog id="modal">
  <div id="modal-inhoud">
    <button id="modal-sluit" type="button">Sluiten</button>
    <div id="modal-body"></div>
  </div>
</dialog>
```

```js
export const openModal = (anime) => {
  modalBody.innerHTML = `...`;
  modal.showModal();
};

export const sluitModal = () => modal.close();
```

`showModal()` verplaatst de focus naar binnen, houdt Tab binnen de dialog, blokkeert de achtergrond, zet de focus bij sluiten terug, en handelt Escape zelf af. Je `keydown`-listener kan wég, en `role="dialog"` heb je niet nodig.

**Valkuil:** heeft je dialog padding, dan telt klikken op die padding als "buiten". Vandaar `#modal-inhoud` als binnenwrapper:

```css
#modal {
  padding: 0;
  border: none;
  background: transparent;
  max-width: 720px;
}

#modal::backdrop {
  background-color: rgba(0, 0, 0, 0.7);
}
```

---

## 18. Sorteren met arrow functions en 'Unknown' waardes

**Vraag:** Hoe sorteer ik op score of jaartal met een arrow function, en wat doe ik met 'Unknown' waardes zodat die niet bovenaan belanden?

**Antwoord:** Het probleem zit hier:

```js
const scoreVan = (anime) => Number(anime.attributes.averageRating ?? 0);
```

Ontbrekende score wordt `0`. Bij "score hoog → laag" zakken die netjes naar onder. Maar bij "score laag → hoog" staan al je scoreloze anime **bovenaan**. De oorzaak: je vertaalt "onbekend" naar een getal, waardoor het meesorteert.

```js
const vergelijk = (waardeVan, omgekeerd = false) => (a, b) => {
  const x = waardeVan(a);
  const y = waardeVan(b);

  if (x === null && y === null) return 0;
  if (x === null) return 1;    // a mist een waarde → altijd naar achteren
  if (y === null) return -1;   // b mist een waarde → a naar voren

  return omgekeerd ? y - x : x - y;
};
```

Die drie `null`-regels staan bewust boven de `omgekeerd`-ternary, zodat onbekenden in beide richtingen naar de bodem zakken.

Je if/else-ketting van zeven takken wordt een opzoektabel:

```js
const SORTEERDERS = {
  'score-hoog': vergelijk((anime) => anime.score, true),
  'score-laag': vergelijk((anime) => anime.score),
  'jaar-nieuw': vergelijk((anime) => anime.jaar, true),
  'jaar-oud': vergelijk((anime) => anime.jaar),
  'titel-az': (a, b) => a.titel.localeCompare(b.titel, 'nl', { numeric: true }),
  'titel-za': (a, b) => b.titel.localeCompare(a.titel, 'nl', { numeric: true }),
  rang: vergelijk((anime) => anime.rang),
};

const sorteer = (lijst) => lijst.slice().sort(SORTEERDERS[sortSelect.value] ?? SORTEERDERS.rang);
```

- **Je titelsortering was technisch stuk.** `(a, b) => (titelVan(a) > titelVan(b) ? 1 : -1)` geeft nooit `0` terug — een inconsistente vergelijking. `localeCompare` met `numeric: true` zet "Season 2" vóór "Season 10".
- **Pas op met `NaN`.** Alle vergelijkingen worden dan `false` en `.sort()` produceert stilletjes een willekeurige volgorde. Test op `null`, niet op falsy: `0` is een geldige score.
- **`lijst.slice()` vóór `.sort()`** is juist en belangrijk — `sort` muteert de originele array. Sinds ES2023 kan `lijst.toSorted(...)`.

---

## 19. IntersectionObserver voor lazy loading

**Vraag:** Die IntersectionObserver voor lazy loading van afbeeldingen. Hoe gebruik ik da?

**Antwoord:** De mechaniek: je maakt één observer met een callback, je meldt elementen aan met `observe()`, en de browser roept je callback aan zodra een element de viewport binnen- of buitenschuift. Belangrijk detail dat veel mensen verkeerd hebben: de `entries`-array bevat alleen de elementen waarvan de toestand **veranderde**, niet alles wat je observeert.

Drie verbeterpunten:

**1. Je maakt bij elke render een nieuwe observer.** `startLazyLoading()` staat in `renderAnimeCards` én `renderFavorieten`, en die draaien bij elke filterklik, sortering, zoekopdracht en favoriet-toggle. Elke keer een verse `IntersectionObserver` die je nooit `disconnect()`. Zet hem op moduleniveau:

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

**2. `rootMargin: '200px'`** is de grootste zichtbare winst. Zonder marge begint een afbeelding pas te laden op het moment dat ze in beeld komt: eerst een leeg vlak, dan een plop. Met die marge blaas je de detectiezone 200px op in alle richtingen, zodat het laden start net vóór de kaart in beeld schuift.

**3. Je zoekt met `document.querySelectorAll`, dus globaal.** `renderFavorieten` meldt daardoor ook de kaarten in je resultatensectie opnieuw aan. Geef de container mee: `startLazyLoading(animeContainer)` en `startLazyLoading(favoritesList)`.

De `observer.unobserve` in de callback is goed; zonder dat blijft de browser elementen volgen die al klaar zijn.

**Eerlijke kanttekening:** `<img loading="lazy" src="...">` doet ditzelfde zonder één regel JavaScript, en het werkt ook als je script faalt — bij deze aanpak heeft de `<img>` helemaal geen `src` tot de observer hem invult. Voor Web Advanced is `IntersectionObserver` waarschijnlijk een expliciet leerdoel, dus laten staan. Maar weten dat je het bij een echt project met een attribuut zou oplossen, is precies het soort nuance waar je bij een verdediging punten mee pakt.

---

## Openstaande punten uit dit gesprek

- De crash-fix op `data.data` (`Array.isArray`-check)
- De normalisatielaag in `api.js`
- De `<dialog>`-omzetting van de modal
