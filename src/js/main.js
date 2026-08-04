'use strict';

import '../css/style.css';

const themeButton = document.querySelector('#theme-button');

themeButton.addEventListener('click', () => {
  const isLicht = document.body.classList.toggle('licht');
  themeButton.textContent = isLicht ? 'Donker thema' : 'Licht thema';
});
