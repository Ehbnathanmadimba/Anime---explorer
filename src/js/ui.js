'use strict';

import { getFavorieten, isFavoriet } from './storage.js';

export const animeContainer = document.querySelector('#anime-container');
export const favoritesList = document.querySelector('#favorites-list');
export const statusMessage = document.querySelector('#status-message');

const modal = document.querySelector('#modal');
const modalBody = document.querySelector('#modal-body');

export const openModal = (anime) => {
  const info = anime.attributes;
  const poster = info.posterImage ? info.posterImage.medium : '';

  modalBody.innerHTML = `
    <h3>${info.canonicalTitle}</h3>
    <img src="${poster}" alt="Poster van ${info.canonicalTitle}" />
    <p>${info.showType} · ${info.episodeCount ?? '?'} afleveringen · ${info.status}</p>
    <p>Score: ${info.averageRating ? info.averageRating : '?'}</p>
    <p>${info.synopsis ? info.synopsis : 'Geen beschrijving beschikbaar.'}</p>
  `;

  modal.classList.remove('verborgen');
};

export const sluitModal = () => {
  modal.classList.add('verborgen');
};

export const setStatus = (tekst) => {
  statusMessage.textContent = tekst;
};

export const renderAnimeCards = (animeLijst) => {
  if (animeLijst.length === 0) {
    animeContainer.innerHTML = '';
    setStatus('Geen anime gevonden. Probeer een andere zoekterm.');
    return;
  }

  animeContainer.innerHTML = animeLijst.map(maakKaart).join('');
  startLazyLoading();
};

const maakKaart = (anime) => {
  const info = anime.attributes;
  const poster = info.posterImage ? info.posterImage.medium : '';
  const score = info.averageRating ? info.averageRating : '?';
  const jaar = info.startDate ? info.startDate.slice(0, 4) : '?';
  const hartje = isFavoriet(anime.id) ? '♥' : '♡';

  return `
    <article class="kaart" data-id="${anime.id}">
      <button class="fav-knop" type="button" data-fav="${anime.id}">${hartje}</button>
      <img class="lazy" data-src="${poster}" alt="Poster van ${info.canonicalTitle}" />
      <h3>${info.canonicalTitle}</h3>
      <p>${info.showType} · ${info.episodeCount ?? '?'} afleveringen · ${jaar}</p>
      <p>Score: ${score}</p>
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
