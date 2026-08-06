'use strict';

import '../css/style.css';
import { getTopAnime, searchAnime } from './api.js';
import { renderAnimeCards, renderAnimeTable, setStatus } from './ui.js';
import { searchForm, searchInput, valideerZoekterm, toonFout } from './form.js';

const themeButton = document.querySelector('#theme-button');
const viewButton = document.querySelector('#view-button');

let huidigeLijst = [];
let toonTabel = false;

const toonResultaten = () => {
  if (toonTabel) {
    renderAnimeTable(huidigeLijst);
  } else {
    renderAnimeCards(huidigeLijst);
  }
};

themeButton.addEventListener('click', () => {
  const isLicht = document.body.classList.toggle('licht');
  themeButton.textContent = isLicht ? 'Donker thema' : 'Licht thema';
});

viewButton.addEventListener('click', () => {
  toonTabel = !toonTabel;
  viewButton.textContent = toonTabel ? 'Toon als kaarten' : 'Toon als tabel';
  toonResultaten();
});

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const fout = valideerZoekterm(searchInput.value);
  toonFout(fout);

  if (fout) {
    return;
  }

  setStatus('Bezig met zoeken...');

  huidigeLijst = await searchAnime(searchInput.value.trim());

  setStatus('');
  toonResultaten();
});

const start = async () => {
  setStatus('Bezig met laden...');

  huidigeLijst = await getTopAnime();

  setStatus('');
  toonResultaten();
};

start();
