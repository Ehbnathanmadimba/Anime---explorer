'use strict';

export const API_BASE_URL = 'https://kitsu.io/api/edge';

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

export const getTopAnime = async () => {
  const url = buildUrl(ENDPOINTS.ANIME, `sort=${DEFAULTS.SORT}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP fout ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Kon de anime niet ophalen:', error);
    return [];
  }
};

export const searchAnime = async (zoekterm) => {
  const url = buildUrl(ENDPOINTS.ANIME, `filter[text]=${encodeURIComponent(zoekterm)}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP fout ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Zoeken naar "${zoekterm}" mislukt:`, error);
    return [];
  }
};
