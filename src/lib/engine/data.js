// Shared images live in Convex file storage. The layout fills this in at startup.
export const IMG = {};
export function setAssets(map) {
  Object.assign(IMG, map || {});
}

export const sz = (d, m = d) => ({ d, m });
export const DAY = 86400000;

// Profile photo frames. The cat ears are one option, not a requirement.
export const AVATAR_SHAPES = [
  { k: 'circle', label: 'Circle' },
  { k: 'rounded', label: 'Rounded' },
  { k: 'square', label: 'Square' },
  { k: 'cat', label: 'Cat ears' },
];

// [asset key, title, author, licence, source]
export const CREDITS = [
  ['distance', 'A black cat lookin into the distance', 'AccordingClass', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:A_black_cat_lookin_into_the_distance.jpg'],
  ['kola', 'Black cat IMG 1618', 'HareGovorittKrishna', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Black_cat_IMG_1618.jpg'],
  ['calico', 'Calico cat, Assisi, Italy', 'Terragio67', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Calico_cat,_-_Assisi,_Italy.jpg'],
  ['tabby', 'Cat November 2010-1a', 'Alvesgaspar', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Cat_November_2010-1a.jpg'],
  ['piran', 'Cat in Piran, Slovenia', 'Jakub Hałun', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Cat_in_Piran,_Slovenia,_20240504_1600_8594.jpg'],
  ['chartreux', 'Chartreux cat', 'Stephanemartin', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Chartreux-cat-edouard-marie.jpg'],
  ['snow', 'Felis catus, cat on snow', 'Von.grzanka', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Felis_catus-cat_on_snow_(cropped2).jpg'],
  ['straw', 'Felis silvestris catus lying on rice straw', 'Basile Morin', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Felis_silvestris_catus_lying_on_rice_straw.jpg'],
  ['kitten', 'Golden tabby and white kitten', 'Marie-Lan Nguyen', 'CC BY 2.5', 'https://commons.wikimedia.org/wiki/File:Golden_tabby_and_white_kitten_n01.jpg'],
  ['odd', 'June odd-eyed cat', 'Keith Kissel', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:June_odd-eyed-cat_cropped.jpg'],
  ['six', 'Six weeks old cat', 'André Karwath aka Aka', 'CC BY-SA 2.5', 'https://commons.wikimedia.org/wiki/File:Six_weeks_old_cat_(aka).jpg'],
  ['sleeping', 'Sleeping cat on her back', 'Umberto Salvagnin', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Sleeping_cat_on_her_back.jpg'],
  ['blue', 'Tabby cat with blue eyes', 'AdinaVoicu', 'CC0', 'https://commons.wikimedia.org/wiki/File:Tabby_cat_with_blue_eyes-3336579.jpg'],
  ['tired', 'Tired 20-year-old cat', 'Dimitri “Diti” Torterat', 'CC BY 2.0 fr', 'https://commons.wikimedia.org/wiki/File:Tired_20-year-old_cat.jpg'],
];
