'use strict';

export const API_BASE_URL = 'https://api.jikan.moe/v4';

export const ENDPOINTS = Object.freeze({
  TOP_ANIME: '/top/anime',
  SEARCH: '/anime',
  DETAIL: '/anime',
  GENRES: '/genres/anime',
});

export const DEFAULTS = Object.freeze({
  LIMIT: 24,
  PAGE: 1,
});

// Jikan normaal da geeft ongv ~3 requests per seconde toe..
export const RATE_LIMIT_MS = 400;
