'use strict';

export const API_BASE_URL = 'https://api.jikan.moe/v4';

export const ENDPOINTS = {
  TOP_ANIME: '/top/anime',
  SEARCH: '/anime',
  DETAIL: '/anime',
  GENRES: '/genres/anime',
};

export const DEFAULTS = {
  LIMIT: 24,
  PAGE: 1,
};

// Jikan normaal da geeft ongv ~3 requests per seconde toe..
export const RATE_LIMIT_MS = 400;

export const buildUrl = (endpoint, extraParams = '') => {
  const basis = `${API_BASE_URL}${endpoint}?limit=${DEFAULTS.LIMIT}&page=${DEFAULTS.PAGE}`;
  return extraParams ? `${basis}&${extraParams}` : basis;
};

export const getTopAnime = async () => {
  const url = buildUrl(ENDPOINTS.TOP_ANIME);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP fout ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Kon de top anime niet ophalen:', error);
    return [];
  }
};
