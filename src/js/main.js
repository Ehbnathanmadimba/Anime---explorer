'use strict';

import '../css/style.css';
import { getTopAnime, searchAnime } from './api.js';
import {
  renderAnimeCards,
  renderAnimeTable,
  setStatus,
  animeContainer,
  favoritesList,
  renderFavorieten,
  openModal,
  sluitModal,
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

let ruweLijst = [];
let huidigeLijst = [];
let toonTabel = false;
let actiefType = '';

const jaarVan = (anime) => {
  return anime.attributes.startDate ? Number(anime.attributes.startDate.slice(0, 4)) : 0;
};

const sorteer = (lijst) => {
  const gesorteerd = lijst.slice();
  const keuze = sortSelect.value;

  if (keuze === 'score') {
    gesorteerd.sort((a, b) => Number(b.attributes.averageRating) - Number(a.attributes.averageRating));
  } else if (keuze === 'title') {
    gesorteerd.sort((a, b) => (a.attributes.canonicalTitle > b.attributes.canonicalTitle ? 1 : -1));
  } else if (keuze === 'year') {
    gesorteerd.sort((a, b) => jaarVan(b) - jaarVan(a));
  } else {
    gesorteerd.sort((a, b) => (a.attributes.popularityRank ?? 9999) - (b.attributes.popularityRank ?? 9999));
  }

  return gesorteerd;
};

const verwerkLijst = () => {
  const gefilterd = actiefType
    ? ruweLijst.filter((anime) => anime.attributes.subtype === actiefType)
    : ruweLijst;

  huidigeLijst = sorteer(gefilterd);
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

modalSluit.addEventListener('click', sluitModal);

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

const start = async () => {
  setStatus('Bezig met laden...');

  ruweLijst = await getTopAnime();

  setStatus('');
  verwerkLijst();
  renderFavorieten();
};

start();
