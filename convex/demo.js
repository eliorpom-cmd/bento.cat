// Demo boxes that make Explore worth a sniff on a fresh deployment.
// Strings starting with "@" are asset keys, swapped for real file URLs when seeding.

const DAY = 86400000;
const sz = (d, m = d) => ({ d, m });

const FEED = [
  { src: '@sleeping', pos: '50%' },
  { src: '@tabby', pos: '50% 40%' },
  { src: '@calico', pos: '55%' },
  { src: '@kitten', pos: '40%' },
  { src: '@blue', pos: '50% 40%' },
  { src: '@straw', pos: '60%' },
];

// A steady-looking example graph for an example person. Real boxes get theirs from GitHub.
function exampleGraph(now) {
  let x = 11;
  const r = () => ((x = (x * 16807) % 2147483647) / 2147483647);
  const end = new Date(now);
  const days = 25 * 7 + end.getUTCDay() + 1;
  const counts = Array.from({ length: days }, (_, i) => {
    const v = r() * (0.6 + (i / days) * 0.9);
    return v < 0.32 ? 0 : Math.round(v * 9);
  });
  const level = n => (n === 0 ? 0 : n < 3 ? 1 : n < 5 ? 2 : n < 7 ? 3 : 4);
  const start = new Date(now - (days - 1) * DAY).toISOString().slice(0, 10);
  return { levels: counts.map(level).join(''), counts, start, total: counts.reduce((a, b) => a + b, 0) };
}

export function demoBoxes(now) {
  return [
    {
      handle: 'mia', name: 'Mia Okafor', avatar: '@odd', avatarPos: '50% 30%', avatarShape: 'cat',
      bio: 'I draw letters for bakeries, record labels and the occasional very stubborn cat. Mostly in Lagos, sometimes in Lisbon.',
      footer: 'That’s the whole box. Kọ́lá is asleep now.',
      tiles: [
        { id: 'map1', type: 'map', size: sz('sprawl'), place: 'Yaba, Lagos', caption: 'where the studio cat lives', seed: 4, zoom: 1, lat: 6.5095, lon: 3.3786, z: 14 },
        { id: 'kn', type: 'link', size: sz('loaf'), title: 'Kerning Notes', url: 'https://kerningnotes.co', icon: 'mail', demo: true, preview: { kind: 'type', bg: '#DCE3D8', fg: '#1E2A1D', sub: '#3E4A3C', label: 'Issue 31', big: 'Ìyá' } },
        { id: 'note1', type: 'note', size: sz('loaf'), html: 'Currently drawing a typeface for a bakery in Yaba. Ask me about the dot under the ọ.', tint: 'curb', updatedAt: now - 2 * DAY },
        { id: 'quote1', type: 'note', size: sz('curl'), html: '“Mia made our menu feel like it smells of bread.<br>— Bọlá at Yaba Bakes', tint: 'fur' },
        { id: 'purr1', type: 'purr', size: sz('curl'), count: 318 },
        { id: 'kola', type: 'photo', size: sz('tower'), src: '@kola', pos: '50% 50%', caption: 'Kọ́lá, head of quality control.', url: 'https://instagram.com/catsofyaba', demo: true },
        { id: 'feed1', type: 'feed', size: sz('sprawl'), handle: 'catsofyaba', followers: 12400, photos: FEED, url: 'https://instagram.com/catsofyaba', demo: true },
        { id: 'music1', type: 'music', size: sz('loaf'), title: 'Kọ́lá’s nap songs', sub: 'Playlist, 24 songs', cover: '@chartreux', demo: true },
        { id: 'status1', type: 'status', size: sz('curl'), tz: 'Africa/Lagos', city: 'Lagos', text: 'Taking two projects for November.', meta: 'Replies within a day' },
        { id: 'gh1', type: 'github', size: sz('loaf'), user: 'mia-okafor', ...exampleGraph(now), demo: true },
        { id: 'studio', type: 'link', size: sz('curl'), title: 'Okafor Type Studio', url: 'https://okafor.studio', icon: { glyph: 'ọ' }, demo: true },
        { id: 'sec1', type: 'section', size: sz('loaf'), text: 'Come say hi' },
        { id: 'guest1', type: 'guestbook', size: sz('sprawl'), count: 41 },
        { id: 'ba1', type: 'beforeafter', size: sz('sprawl'), before: '@six', src: '@tired', pos: '50% 50%' },
        { id: 'say1', type: 'sayname', size: sz('loaf'), name: 'Mia Ọ̀kàfọ̀r', phon: 'mee-ah, aw-KAH-for', speak: 'Mee-ah. Aw-kah-for.' },
        { id: 'hrs1', type: 'hours', size: sz('loaf'), tz: 'Africa/Lagos', city: 'Lagos', from: 9, to: 19, title: 'Good time to write' },
        { id: 'sub1', type: 'subscribe', size: sz('loaf'), title: 'Kerning Notes', sub: 'One letter a month, about letters' },
        { id: 'vid1', type: 'video', size: sz('loaf'), src: '@snow', pos: '50% 30%', title: 'A tabby meets snow', meta: '0:48 on YouTube', url: 'https://youtube.com', demo: true },
        { id: 'emoji1', type: 'note', size: sz('curl'), html: '🐈‍⬛', tint: 'paw' },
        { id: 'drib', type: 'link', size: sz('curl'), title: 'Dribbble', url: 'https://dribbble.com/miaokafor', icon: { platform: 'dribbble' }, demo: true },
      ],
    },
    {
      handle: 'tunde', name: 'Tunde Bakare', avatar: '@piran', avatarPos: '50% 40%', avatarShape: 'circle',
      bio: 'I photograph cats on walls. Accra in the week, Piran when it rains.',
      tiles: [
        { id: 'tp1', type: 'photo', size: sz('sprawl'), src: '@piran', pos: '50% 50%', caption: 'Piran, 6 in the evening' },
        { id: 'tm1', type: 'map', size: sz('loaf'), place: 'Osu, Accra', caption: 'the wall with the most cats', seed: 8, zoom: 1, lat: 5.5571, lon: -0.1818, z: 15 },
        { id: 'tn1', type: 'note', size: sz('curl'), html: 'Prints are back on <b>Friday</b>.', tint: 'sage' },
        { id: 'tl1', type: 'link', size: sz('curl'), title: 'Instagram', url: 'https://instagram.com/tundeonwalls', icon: { platform: 'instagram' }, demo: true },
        { id: 'tf1', type: 'feed', size: sz('loaf'), handle: 'tundeonwalls', followers: 3800, photos: [FEED[2], FEED[5], FEED[1]], demo: true },
        { id: 'tpu', type: 'purr', size: sz('curl'), count: 96 },
        { id: 'ts1', type: 'status', size: sz('curl'), tz: 'Africa/Accra', city: 'Accra', text: 'Out shooting till Sunday.', meta: 'Slow replies' },
      ],
    },
    {
      handle: 'jo', name: 'Jo Adeyemi', avatar: '@six', avatarPos: '50% 35%', avatarShape: 'rounded',
      bio: 'Studio Jo. Names and faces for small food places.',
      tiles: [
        { id: 'js1', type: 'subscribe', size: sz('loaf'), title: 'Menu Notes', sub: 'A short letter every other Friday' },
        { id: 'jn1', type: 'note', size: sz('loaf'), html: 'Currently naming a jollof truck. Shortlist: <b>Smoke Signal</b>, <i>Party Rice</i>.', tint: 'curb', updatedAt: now - 5 * DAY },
        { id: 'jp1', type: 'photo', size: sz('tower'), src: '@six', pos: '50% 50%', caption: 'Pepper, studio manager.' },
        { id: 'jl1', type: 'link', size: sz('loaf'), title: 'Studio Jo', url: 'https://studiojo.com', icon: { glyph: 'J' }, demo: true, preview: { kind: 'type', bg: '#F9E3E7', fg: '#5B1E2A', sub: '#8C3B4B', label: 'Case study', big: 'Àmàlà' } },
        { id: 'jpu', type: 'purr', size: sz('curl'), count: 57 },
        { id: 'jq1', type: 'note', size: sz('curl'), html: '“Jo named our shop in one afternoon.<br>— Ada at Suya Spot', tint: 'fur' },
      ],
    },
    {
      handle: 'sade', name: 'Sade Martins', avatar: '@distance', avatarPos: '50% 40%', avatarShape: 'square',
      bio: 'I write slow songs for fast cities. New record in November.',
      tiles: [
        { id: 'sm1', type: 'music', size: sz('sprawl'), title: 'Rain on Rua Augusta', sub: 'Album, 9 songs', cover: '@distance', demo: true },
        { id: 'sv1', type: 'video', size: sz('loaf'), src: '@snow', pos: '50% 30%', title: 'Live at Musicbox', meta: '4:12 on YouTube', url: 'https://youtube.com', demo: true },
        { id: 'ssn', type: 'sayname', size: sz('loaf'), name: 'Sade Martins', phon: 'shah-DAY', speak: 'Shah-day.' },
        { id: 'sn1', type: 'note', size: sz('loaf'), html: 'Tour dates go up on the first. Lisbon is sold out, sorry.', tint: 'curb', updatedAt: now - DAY },
        { id: 'sl1', type: 'link', size: sz('curl'), title: 'Spotify', url: 'https://open.spotify.com/artist/sade', icon: { platform: 'spotify' }, demo: true },
        { id: 'sp1', type: 'purr', size: sz('curl'), count: 1204 },
      ],
    },
    {
      handle: 'ebi', name: 'Ebi', avatar: '@tired', avatarPos: '50% 40%', avatarShape: 'cat',
      bio: 'Twenty years old. Retired. Mostly naps, some supervising.',
      tiles: [
        { id: 'ep1', type: 'photo', size: sz('tower'), src: '@tired', pos: '50% 50%', caption: 'Unbothered.' },
        { id: 'eq1', type: 'note', size: sz('loaf'), html: '“I was here before the sofa.<br>— Ebi', tint: 'fur' },
        { id: 'epu', type: 'purr', size: sz('curl'), count: 2048 },
        { id: 'em1', type: 'map', size: sz('curl'), place: 'The windowsill', caption: '', seed: 5, zoom: 1.2 },
        { id: 'ee1', type: 'note', size: sz('loaf'), html: '😴', tint: 'paw' },
      ],
    },
  ];
}

// File name in design/cats → asset key.
export const ASSET_FILES = {
  odd: 'june-odd-eyed-cat-cropped.jpg',
  kola: 'black-cat-img-1618.jpg',
  sleeping: 'sleeping-cat-on-her-back.jpg',
  tabby: 'cat-november-2010-1a.jpg',
  calico: 'calico-cat-assisi-italy.jpg',
  kitten: 'golden-tabby-and-white-kitten-n01.jpg',
  blue: 'tabby-cat-with-blue-eyes-3336579.jpg',
  straw: 'felis-silvestris-catus-lying-on-rice-str.jpg',
  chartreux: 'chartreux-cat-edouard-marie.jpg',
  snow: 'felis-catus-cat-on-snow-cropped2.jpg',
  distance: 'a-black-cat-lookin-into-the-distance.jpg',
  piran: 'cat-in-piran-slovenia-20240504-1600-8594.jpg',
  six: 'six-weeks-old-cat-aka.jpg',
  tired: 'tired-20-year-old-cat.jpg',
};
