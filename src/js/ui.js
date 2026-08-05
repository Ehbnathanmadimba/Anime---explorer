'use strict';

export const animeContainer = document.querySelector('#anime-container');
export const favoritesList = document.querySelector('#favorites-list');
export const statusMessage = document.querySelector('#status-message');

export const renderAnimeCards = (animeLijst) => {
  const kaarten = animeLijst.map((anime) => {
    const info = anime.attributes;
    const poster = info.posterImage ? info.posterImage.medium : '';
    const score = info.averageRating ? info.averageRating : '?';
    const jaar = info.startDate ? info.startDate.slice(0, 4) : '?';

    return `
      <article class="kaart">
        <img src="${poster}" alt="Poster van ${info.canonicalTitle}" />
        <h3>${info.canonicalTitle}</h3>
        <p>${info.showType} · ${info.episodeCount ?? '?'} afleveringen · ${jaar}</p>
        <p>Score: ${score}</p>
      </article>
    `;
  });

  animeContainer.innerHTML = kaarten.join('');
};
