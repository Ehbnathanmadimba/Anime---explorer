'use strict';

import { getFavorieten, isFavoriet } from './storage.js';

export const animeContainer = document.querySelector('#anime-container');
export const favoritesList = document.querySelector('#favorites-list');
export const statusMessage = document.querySelector('#status-message');

const modal = document.querySelector('#modal');
export const modalBody = document.querySelector('#modal-body');

export const openModal = (anime) => {
  const info = anime.attributes;
  const poster = info.posterImage ? info.posterImage.medium : '';
  const score = info.averageRating ? Number(info.averageRating).toFixed(1) : '?';
  const jaar = info.startDate ? info.startDate.slice(0, 4) : '?';
  const favoriet = isFavoriet(anime.id);

  modalBody.innerHTML = `
    <div class="modal-kop">
      <img src="${poster}" alt="Poster van ${info.canonicalTitle}" />

      <div class="modal-info">
        <span class="badge">${info.showType}</span>
        <h3>${info.canonicalTitle}</h3>

        <div class="kaart-raster">
          <p><span class="label">Jaar</span>${jaar}</p>
          <p><span class="label">Afleveringen</span>${info.episodeCount ?? '?'}</p>
          <p><span class="label">Status</span>${info.status}</p>
          <p><span class="label">Score</span>${score}</p>
        </div>
      </div>
    </div>

    <p class="synopsis">${info.synopsis ? info.synopsis : 'Geen beschrijving beschikbaar.'}</p>

    <button class="modal-fav" type="button" data-fav="${anime.id}">
      ${favoriet ? '♥ Verwijder uit favorieten' : '♡ Voeg toe aan favorieten'}
    </button>
  `;

  modal.classList.remove('verborgen');
};

export const sluitModal = () => {
  modal.classList.add('verborgen');
};

const resultatenTeller = document.querySelector('#resultaten-teller');

export const setStatus = (tekst) => {
  statusMessage.textContent = tekst;
};

export const setTeller = (aantal) => {
  resultatenTeller.textContent = aantal === 1 ? '1 resultaat' : `${aantal} resultaten`;
};

export const renderAnimeCards = (animeLijst) => {
  if (animeLijst.length === 0) {
    animeContainer.innerHTML = '';
    setStatus('Geen anime gevonden. Probeer een andere zoekterm.');
    return;
  }

  setStatus('');
  animeContainer.innerHTML = animeLijst.map(maakKaart).join('');
  startLazyLoading();
};

const maakKaart = (anime) => {
  const info = anime.attributes;
  const poster = info.posterImage ? info.posterImage.medium : '';
  const score = info.averageRating ? Number(info.averageRating).toFixed(1) : '?';
  const scoreBreedte = info.averageRating ? Number(info.averageRating) : 0;
  const jaar = info.startDate ? info.startDate.slice(0, 4) : '?';
  const favoriet = isFavoriet(anime.id);
  const hartje = favoriet ? '♥' : '♡';
  const favClass = favoriet ? 'fav-knop is-favoriet' : 'fav-knop';

  return `
    <article class="kaart" data-id="${anime.id}">
      <div class="kaart-media">
        <span class="badge">${info.showType}</span>
        <button class="${favClass}" type="button" data-fav="${anime.id}">${hartje}</button>
        <img class="lazy" data-src="${poster}" alt="Poster van ${info.canonicalTitle}" />
      </div>

      <div class="kaart-info">
        <h3>${info.canonicalTitle}</h3>

        <div class="kaart-raster">
          <p><span class="label">Jaar</span>${jaar}</p>
          <p><span class="label">Afleveringen</span>${info.episodeCount ?? '?'}</p>
          <p><span class="label">Status</span>${info.status}</p>
          <p><span class="label">Score</span>${score}</p>
        </div>

        <div class="score-balk">
          <div class="score-vulling" style="width: ${scoreBreedte}%"></div>
        </div>
      </div>
    </article>
  `;
};

export const renderFavorieten = () => {
  const favorieten = getFavorieten();

  if (favorieten.length === 0) {
    favoritesList.innerHTML = '<p>Je hebt nog geen favorieten. Klik op een hartje.</p>';
    return;
  }

  favoritesList.innerHTML = favorieten.map(maakKaart).join('');
  startLazyLoading();
};

const startLazyLoading = () => {
  const afbeeldingen = document.querySelectorAll('img.lazy');

  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const afbeelding = entry.target;

        afbeelding.src = afbeelding.getAttribute('data-src');
        afbeelding.classList.remove('lazy');
        observer.unobserve(afbeelding);
      }
    }
  });

  for (const afbeelding of afbeeldingen) {
    observer.observe(afbeelding);
  }
};

export const renderAnimeTable = (animeLijst) => {
  if (animeLijst.length === 0) {
    animeContainer.innerHTML = '';
    setStatus('Geen anime gevonden. Probeer een andere zoekterm.');
    return;
  }

  setStatus('');

  let rijen = '';

  for (const anime of animeLijst) {
    const info = anime.attributes;

    rijen += `
      <tr>
        <td>${info.canonicalTitle}</td>
        <td>${info.showType}</td>
        <td>${info.episodeCount ?? '?'}</td>
        <td>${info.averageRating ? info.averageRating : '?'}</td>
        <td>${info.startDate ? info.startDate.slice(0, 4) : '?'}</td>
        <td>${info.status}</td>
      </tr>
    `;
  }

  animeContainer.innerHTML = `
    <table id="anime-tabel">
      <thead>
        <tr>
          <th>Titel</th>
          <th>Type</th>
          <th>Afleveringen</th>
          <th>Score</th>
          <th>Jaar</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rijen}</tbody>
    </table>
  `;
};
