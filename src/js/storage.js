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

export const getFavorieten = () => leesUitOpslag(STORAGE_KEYS.FAVORIETEN, []);

export const isFavoriet = (id) => {
  return getFavorieten().filter((favoriet) => favoriet.id === id).length > 0;
};

export const wisselFavoriet = (anime) => {
  const favorieten = getFavorieten();

  if (isFavoriet(anime.id)) {
    const zonder = favorieten.filter((favoriet) => favoriet.id !== anime.id);
    schrijfNaarOpslag(STORAGE_KEYS.FAVORIETEN, zonder);
    return false;
  }

  favorieten.push(anime);
  schrijfNaarOpslag(STORAGE_KEYS.FAVORIETEN, favorieten);
  return true;
};
