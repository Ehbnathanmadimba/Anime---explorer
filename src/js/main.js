'use strict';

import '../css/style.css';
import { getTopAnime } from './api.js';

const themeButton = document.querySelector('#theme-button');

themeButton.addEventListener('click', () => {
  const isLicht = document.body.classList.toggle('licht');
  themeButton.textContent = isLicht ? 'Donker thema' : 'Licht thema';
});

const start = async () => {
  const animeLijst = await getTopAnime();
  console.log('Opgehaalde anime:', animeLijst);
};

start();
