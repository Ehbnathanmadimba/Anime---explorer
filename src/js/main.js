'use strict';

import '../css/style.css';
import { getTopAnime, searchAnime } from './api.js';
import {
  renderAnimeCards,
  renderAnimeTable,
  setStatus,
  setTeller,
  animeContainer,
  favoritesList,
  renderFavorieten,
  openModal,
  sluitModal,
  modalBody,
} from './ui.js';
import {
  getFavorieten,
  wisselFavoriet,
  leesUitOpslag,
  schrijfNaarOpslag,
  STORAGE_KEYS,
} from './storage.js';
import {
  searchForm,
  searchInput,
  filterKnoppen,
  sortSelect,
  valideerZoekterm,
  toonFout,
} from './form.js';

const themeButton = document.querySelector('#theme-button');
const viewButton = document.querySelector('#view-button');
const modal = document.querySelector('#modal');
const modalSluit = document.querySelector('#modal-sluit');
const navAlle = document.querySelector('#nav-alle');
const navFavorieten = document.querySelector('#nav-favorieten');
const favTeller = document.querySelector('#fav-teller');
const favorietenSectie = document.querySelector('#favorites-section');
const resultatenSectie = document.querySelector('#results-section');

const werkTellerBij = () => {
  favTeller.textContent = getFavorieten().length;
};

const toonSectie = (naam) => {
  const favorietenAan = naam === 'favorieten';

  favorietenSectie.classList.toggle('verborgen', !favorietenAan);
  resultatenSectie.classList.toggle('verborgen', favorietenAan);
  navFavorieten.classList.toggle('actief', favorietenAan);
  navAlle.classList.toggle('actief', !favorietenAan);
};

navAlle.addEventListener('click', () => toonSectie('alle'));
navFavorieten.addEventListener('click', () => toonSectie('favorieten'));

let ruweLijst = [];
let huidigeLijst = [];
let toonTabel = false;
let actiefType = '';

const jaarVan = (anime) => {
  return anime.attributes.startDate ? Number(anime.attributes.startDate.slice(0, 4)) : 0;
};

const scoreVan = (anime) => Number(anime.attributes.averageRating ?? 0);
const titelVan = (anime) => anime.attributes.canonicalTitle.toLowerCase();
const rangVan = (anime) => anime.attributes.popularityRank ?? 9999;

const sorteer = (lijst) => {
  const gesorteerd = lijst.slice();
  const keuze = sortSelect.value;

  if (keuze === 'score-hoog') {
    gesorteerd.sort((a, b) => scoreVan(b) - scoreVan(a));
  } else if (keuze === 'score-laag') {
    gesorteerd.sort((a, b) => scoreVan(a) - scoreVan(b));
  } else if (keuze === 'titel-az') {
    gesorteerd.sort((a, b) => (titelVan(a) > titelVan(b) ? 1 : -1));
  } else if (keuze === 'titel-za') {
    gesorteerd.sort((a, b) => (titelVan(a) < titelVan(b) ? 1 : -1));
  } else if (keuze === 'jaar-nieuw') {
    gesorteerd.sort((a, b) => jaarVan(b) - jaarVan(a));
  } else if (keuze === 'jaar-oud') {
    gesorteerd.sort((a, b) => jaarVan(a) - jaarVan(b));
  } else {
    gesorteerd.sort((a, b) => rangVan(a) - rangVan(b));
  }

  return gesorteerd;
};

const verwerkLijst = () => {
  const gefilterd = actiefType
    ? ruweLijst.filter((anime) => anime.attributes.subtype === actiefType)
    : ruweLijst;

  huidigeLijst = sorteer(gefilterd);

  setTeller(huidigeLijst.length);
  toonResultaten();
};

const toonResultaten = () => {
  if (toonTabel) {
    renderAnimeTable(huidigeLijst);
  } else {
    renderAnimeCards(huidigeLijst);
  }
};

filterKnoppen.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');

  if (!chip) {
    return;
  }

  actiefType = chip.getAttribute('data-type');

  for (const knop of filterKnoppen.querySelectorAll('.chip')) {
    knop.classList.remove('actief');
  }

  chip.classList.add('actief');
  verwerkLijst();
});

sortSelect.addEventListener('change', verwerkLijst);

if (leesUitOpslag(STORAGE_KEYS.THEMA, 'donker') === 'licht') {
  document.body.classList.add('licht');
  themeButton.textContent = 'Donker thema';
}

themeButton.addEventListener('click', () => {
  const isLicht = document.body.classList.toggle('licht');

  themeButton.textContent = isLicht ? 'Donker thema' : 'Licht thema';
  schrijfNaarOpslag(STORAGE_KEYS.THEMA, isLicht ? 'licht' : 'donker');
});

viewButton.addEventListener('click', () => {
  toonTabel = !toonTabel;
  viewButton.textContent = toonTabel ? 'Toon als kaarten' : 'Toon als tabel';
  toonResultaten();
});

const vindAnime = (id) => {
  const inLijst = huidigeLijst.find((item) => item.id === id);
  return inLijst ? inLijst : getFavorieten().find((item) => item.id === id);
};

const behandelKaartKlik = (event) => {
  const favKnop = event.target.closest('.fav-knop');

  if (favKnop) {
    wisselFavoriet(vindAnime(favKnop.getAttribute('data-fav')));
    toonResultaten();
    renderFavorieten();
    werkTellerBij();
    return;
  }

  const kaart = event.target.closest('.kaart');

  if (!kaart) {
    return;
  }

  openModal(vindAnime(kaart.getAttribute('data-id')));
};

animeContainer.addEventListener('click', behandelKaartKlik);
favoritesList.addEventListener('click', behandelKaartKlik);

modalBody.addEventListener('click', (event) => {
  const knop = event.target.closest('.modal-fav');

  if (!knop) {
    return;
  }

  const anime = vindAnime(knop.getAttribute('data-fav'));

  wisselFavoriet(anime);
  openModal(anime);
  toonResultaten();
  renderFavorieten();
  werkTellerBij();
});

modalSluit.addEventListener('click', sluitModal);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    sluitModal();
  }
});

modal.addEventListener('click', (event) => {
  if (event.target === modal) {
    sluitModal();
  }
});

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fout = valideerZoekterm(searchInput.value);
  toonFout(fout);

  if (fout) {
    return;
  }

  setStatus('Bezig met zoeken...');

  ruweLijst = await searchAnime(searchInput.value.trim());

  setStatus('');
  verwerkLijst();
});

let zoekTimer;

searchInput.addEventListener('input', () => {
  clearTimeout(zoekTimer);

  zoekTimer = setTimeout(async () => {
    const zoekterm = searchInput.value.trim();

    if (zoekterm.length === 1) {
      return;
    }

    toonFout('');
    ruweLijst = zoekterm ? await searchAnime(zoekterm) : await getTopAnime();

    verwerkLijst();
  }, 200);
});

const start = async () => {
  setStatus('Bezig met laden...');

  ruweLijst = await getTopAnime();

  setStatus('');
  verwerkLijst();
  renderFavorieten();
  werkTellerBij();
  toonSectie('alle');
};

start();
