'use strict';

import '../css/style.css';
import { getTopAnime } from './api.js';
import { renderAnimeCards, renderAnimeTable, setStatus } from './ui.js';

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

const start = async () => {
  setStatus('Bezig met laden...');

  huidigeLijst = await getTopAnime();

  setStatus('');
  toonResultaten();
};

start();
