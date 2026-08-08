'use strict';

import { leesUitOpslag, schrijfNaarOpslag } from './storage.js';

export const API_BASE_URL = 'https://kitsu.io/api/edge';

export const CACHE_DUUR_MS = 60 * 60 * 1000;

export const ENDPOINTS = {
  ANIME: '/anime',
  CATEGORIES: '/categories',
};

export const DEFAULTS = {
  LIMIT: 20,
  OFFSET: 0,
  SORT: '-userCount',
};

export const buildUrl = (endpoint, extraParams = '') => {
  const basis = `${API_BASE_URL}${endpoint}?page[limit]=${DEFAULTS.LIMIT}&page[offset]=${DEFAULTS.OFFSET}`;
  return extraParams ? `${basis}&${extraParams}` : basis;
};

const leesCache = (sleutel) => {
  const cache = leesUitOpslag(sleutel, null);

  if (!cache) {
    return null;
  }

  const ouderdom = Date.now() - cache.tijd;
  return ouderdom > CACHE_DUUR_MS ? null : cache.data;
};

const schrijfCache = (sleutel, data) => {
  schrijfNaarOpslag(sleutel, { data: data, tijd: Date.now() });
};

const haalOp = async (url, cacheSleutel) => {
  const uitCache = leesCache(cacheSleutel);

  if (uitCache) {
    console.log('Uit cache geladen:', cacheSleutel);
    return uitCache;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP fout ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    schrijfCache(cacheSleutel, data.data);
    return data.data;
  } catch (error) {
    console.error(`Ophalen mislukt (${cacheSleutel}):`, error);
    return [];
  }
};

export const getTopAnime = () => {
  const url = buildUrl(ENDPOINTS.ANIME, `sort=${DEFAULTS.SORT}`);
  return haalOp(url, 'anime-explorer:cache:top');
};

export const searchAnime = (zoekterm) => {
  const url = buildUrl(ENDPOINTS.ANIME, `filter[text]=${encodeURIComponent(zoekterm)}`);
  return haalOp(url, `anime-explorer:cache:zoek:${zoekterm.toLowerCase()}`);
};
