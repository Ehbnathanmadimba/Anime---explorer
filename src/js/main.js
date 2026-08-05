'use strict';

import '../css/style.css';
import { getTopAnime } from './api.js';
import { renderAnimeCards, setStatus } from './ui.js';

const themeButton = document.querySelector('#theme-button');

themeButton.addEventListener('click', () => {
  const isLicht = document.body.classList.toggle('licht');
  themeButton.textContent = isLicht ? 'Donker thema' : 'Licht thema';
});

const start = async () => {
  setStatus('Bezig met laden...');

  const animeLijst = await getTopAnime();

  setStatus('');
  renderAnimeCards(animeLijst);
};

start();
