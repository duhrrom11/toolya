export const regions = [
  {
    name: ['Hafen der kleinen Dinge', 'Harbor of Small Things'],
    description: ['Papierboote, Glocken und ein Schlüssel, den niemand vermisst.', 'Paper boats, bells and a key nobody seems to miss.'],
    places: [
      ['wishes', 'Wunschpavillon', 'Wish Pavilion', 'Amazon-Wunschlisten', 'Amazon wishlists', 'public.html'],
      ['moving', 'Frachthafen', 'Cargo Harbor', 'Umzugskisten', 'Moving boxes'],
      ['loans', 'Fundsteg', 'Lost and Found Pier', 'Verliehene Dinge', 'Lent items'],
      ['parking', 'Kompassplatz', 'Compass Square', 'Parkplatz-Merker', 'Parking tracker'],
    ],
  },
  {
    name: ['Gärten im Aufwind', 'Updraft Gardens'],
    description: ['Im Schutz der Glasdächer duftet es nach Regen und warmem Gebäck.', 'Beneath the glass roofs it smells of rain and warm pastry.'],
    places: [
      ['plants', 'Tauglashaus', 'Dewglass House', 'Pflanzenpflege', 'Plant care'],
      ['pet-health', 'Pfotenwiese', 'Paw Meadow', 'Tiergesundheit', 'Pet health'],
      ['baking', 'Wolkenofen', 'Cloud Oven', 'Backform-Rechner', 'Baking pan calculator'],
      ['housemates', 'Tisch der Nachbarn', 'Neighbors’ Table', 'WG-Organisator', 'Shared home organizer'],
    ],
  },
  {
    name: ['Lichter über dem Nebel', 'Lights Above the Mist'],
    description: ['Ein stilles Archiv hütet die Karte der letzten Nacht.', 'A quiet archive keeps the chart of the last night.'],
    places: [
      ['estate', 'Archiv am Abend', 'Evening Archive', 'Digitaler Nachlass', 'Digital estate'],
      ['budget', 'Münzbrücke', 'Coin Bridge', 'Haushaltsbuch', 'Budget book'],
      ['car', 'Windbogen', 'Wind Arch', 'Autokosten', 'Car expenses'],
      ['meters', 'Sternwarte der Stunden', 'Observatory of Hours', 'Zählerstände', 'Meter readings'],
    ],
  },
];

export const chapter = [
  {
    name: ['Der Schlüssel im Boot', 'The Key in the Boat'],
    text: ['Im Frachthafen treibt ein Papierboot mit einem Messingschlüssel. Die Notiz darin sagt: „Bring mich dorthin, wo man Verlorenes findet.“', 'At Cargo Harbor a paper boat carries a brass key. Its note reads: “Take me where lost things turn up.”'],
    options: [['Windbogen', 'Wind Arch'], ['Fundsteg', 'Lost and Found Pier'], ['Wolkenofen', 'Cloud Oven']],
    reward: ['Messingschlüssel', 'Brass key'],
  },
  {
    name: ['Die Spur aus Tau', 'The Trail of Dew'],
    text: ['Am Fundsteg passt der Schlüssel in eine kleine Truhe. Darin liegt eine Karte: „Folge dem Regen an den Ort mit einem Dach aus Glas.“', 'At the pier the key fits a small chest. Inside, a map reads: “Follow the rain to the place with a glass roof.”'],
    options: [['Tauglashaus', 'Dewglass House'], ['Archiv am Abend', 'Evening Archive'], ['Kompassplatz', 'Compass Square']],
    reward: ['Taukarte', 'Dew chart'],
  },
  {
    name: ['Das letzte Licht', 'The Last Light'],
    text: ['Auf dem nassen Glas erscheinen drei Sterne. Wo kannst du die Sternspur mit der Karte vergleichen?', 'Three stars appear on the rain-soaked glass. Where can you compare the star trail with your chart?'],
    options: [['Münzbrücke', 'Coin Bridge'], ['Wunschpavillon', 'Wish Pavilion'], ['Sternwarte der Stunden', 'Observatory of Hours']],
    reward: ['Nebellicht', 'Mist lantern'],
  },
];

export const decor = [
  ['lantern', 'Messingschlüssel', 'Brass key', '⚿'],
  ['chart', 'Taukarte', 'Dew chart', '☾'],
  ['window', 'Nebellicht', 'Mist lantern', '✦'],
];

const thresholds = [0, 80, 160, 240, 320];
export const ranks = [
  ['Neuling', 'Newcomer'],
  ['Entdecker', 'Explorer'],
  ['Tüftler', 'Tinkerer'],
  ['Meister', 'Pathfinder'],
  ['Legende', 'Legend'],
];

export function progress(xp) {
  const level = thresholds.findLastIndex(threshold => xp >= threshold);
  const next = thresholds[level + 1];
  return { level, next, percent: next ? Math.round(100 * (xp - thresholds[level]) / (next - thresholds[level])) : 100 };
}
