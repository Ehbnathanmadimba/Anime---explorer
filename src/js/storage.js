'use strict';

export const STORAGE_KEYS = {
  FAVORIETEN: 'anime-explorer:favorieten',
  THEMA: 'anime-explorer:thema',
};

export const leesUitOpslag = (sleutel, standaard) => {
  try {
    const waarde = localStorage.getItem(sleutel);
    return waarde ? JSON.parse(waarde) : standaard;
  } catch (error) {
    console.error(`Kon "${sleutel}" niet lezen uit localStorage:`, error);
    return standaard;
  }
};

export const schrijfNaarOpslag = (sleutel, waarde) => {
  try {
    localStorage.setItem(sleutel, JSON.stringify(waarde));
  } catch (error) {
    console.error(`Kon "${sleutel}" niet opslaan:`, error);
  }
};
