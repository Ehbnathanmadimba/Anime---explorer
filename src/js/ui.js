'use strict';

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

  const kaarten = animeLijst.map((anime) => {
    const info = anime.attributes;
    const poster = info.posterImage ? info.posterImage.medium : '';
    const score = info.averageRating ? info.averageRating : '?';
    const jaar = info.startDate ? info.startDate.slice(0, 4) : '?';

    return `
      <article class="kaart" data-id="${anime.id}">
        <img src="${poster}" alt="Poster van ${info.canonicalTitle}" />
        <h3>${info.canonicalTitle}</h3>
        <p>${info.showType} · ${info.episodeCount ?? '?'} afleveringen · ${jaar}</p>
        <p>Score: ${score}</p>
      </article>
    `;
  });

  animeContainer.innerHTML = kaarten.join('');
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
