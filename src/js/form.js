'use strict';

export const searchForm = document.querySelector('#search-form');
export const searchInput = document.querySelector('#search-input');
export const searchError = document.querySelector('#search-error');
export const filterKnoppen = document.querySelector('#filter-knoppen');
export const sortSelect = document.querySelector('#sort-select');

export const valideerZoekterm = (zoekterm) => {
  const schoon = zoekterm.trim();

  if (schoon.length === 0) {
    return 'Vul een titel in om te zoeken.';
  }

  if (schoon.length < 2) {
    return 'Typ minstens 2 tekens.';
  }

  return '';
};

export const toonFout = (bericht) => {
  searchError.textContent = bericht;
};
