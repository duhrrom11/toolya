const palettes = {
  'Türkis': ['#e9f8f6', '#096c70'],
  'Nachtblau': ['#eaf1fc', '#203969'],
  'Terrakotta': ['#fff1e8', '#ab4a33'],
  'Rosé': ['#fbeef4', '#953b66'],
  'Sand': ['#f9f3e6', '#755633'],
  'Flieder': ['#f0eafa', '#653c88'],
  'Salbei': ['#eef3e8', '#4c653b'],
  'Honig': ['#fff5d9', '#855018'],
  'Koralle': ['#fff0ed', '#ad4246'],
  'Schieferblau': ['#edf2f5', '#3e5969'],
  'Pflaume': ['#f4eaf1', '#753759'],
  'Himmelblau': ['#e8f5fc', '#236886']
};

const groups = [
  ['Allgemein', ['Türkis', 'Nachtblau', 'Terrakotta', 'Sand', 'Flieder'], [
    ['simple', 'Schlicht', 'frame', 'sans', 'small'],
    ['modern', 'Modern', 'split', 'heavy', 'right'],
    ['photo', 'Mit Foto', 'border', 'serif', 'banner']
  ]],
  ['Hochzeit', ['Rosé', 'Sand', 'Salbei', 'Pflaume', 'Nachtblau'], [
    ['elegant', 'Elegant', 'arch', 'serif', 'small'],
    ['botanical', 'Botanisch', 'leaves', 'serif', 'right'],
    ['wedding-modern', 'Modern', 'diagonal', 'sans', 'banner']
  ]],
  ['Baby', ['Himmelblau', 'Rosé', 'Salbei', 'Honig', 'Flieder'], [
    ['clouds', 'Wolken', 'clouds', 'round', 'small'],
    ['stars', 'Sternenhimmel', 'stars', 'serif', 'right'],
    ['baby-photo', 'Foto im Mittelpunkt', 'halo', 'round', 'banner']
  ]],
  ['Kommunion', ['Sand', 'Himmelblau', 'Honig', 'Salbei', 'Rosé'], [
    ['classic', 'Klassisch', 'double', 'serif', 'small'],
    ['light', 'Licht', 'rays', 'sans', 'right'],
    ['spring', 'Frühlingszweig', 'branch', 'serif', 'banner']
  ]],
  ['Geburtstag', ['Koralle', 'Flieder', 'Himmelblau', 'Honig', 'Türkis'], [
    ['confetti', 'Konfetti', 'confetti', 'round', 'small'],
    ['typography', 'Typografisch', 'blocks', 'heavy', 'right'],
    ['birthday-photo', 'Fotokarte', 'snapshot', 'heavy', 'banner']
  ]],
  ['Verein & Spendenaktion', ['Türkis', 'Schieferblau', 'Salbei', 'Nachtblau', 'Terrakotta'], [
    ['logo', 'Vereinslogo', 'ribbon', 'sans', 'small'],
    ['poster', 'Aktionsplakat', 'poster', 'heavy', 'right'],
    ['info', 'Infokarte', 'grid', 'sans', 'banner']
  ]]
];

export const cardDesigns = groups.flatMap(([category, colors, designs]) => designs.map(
  ([id, label, motif, type, photo], index) => ({
    id, label, category, motif, type, photo,
    colors: [...colors.slice(index), ...colors.slice(0, index)].map(name => ({name, paper: palettes[name][0], accent: palettes[name][1]}))
  })
));

export const cardFormats = {
  square: {label: 'Quadrat für Social Media', width: 1080, height: 1080},
  story: {label: 'Hochkant für Storys und Status', width: 1080, height: 1920},
  a4: {label: 'A4-Aushang', width: 1240, height: 1754},
  four: {label: 'Vier Karten auf A4', width: 1240, height: 1754}
};

export const cardTextFields = {
  title: 'Titel', name: 'Vor- und Nachname oder Vereinsname', explanation: 'Erklärungstext',
  note: 'Freitext', qr: 'Beschriftung des großen QR-Codes', promo: 'Beschriftung des Toolya-Bereichs',
  social: 'Begleittext für Social Media'
};

export const cardLanguages = {
  de: ['Deutsch', 'Zum Profil', 'Zur Wunschliste', 'Toolya entdecken', 'Alle Wünsche an einem Ort', 'Hier findest du die Wunschliste.', 'Wenn du magst, schau hier vorbei!'],
  en: ['English', 'View profile', 'View wish list', 'Discover Toolya', 'All the wishes in one place', 'You can find the wish list here.', 'Take a look if you like!'],
  fr: ['Français', 'Voir le profil', 'Voir la liste de souhaits', 'Découvrir Toolya', 'Tous les souhaits au même endroit', 'Découvrez la liste de souhaits ici.', 'Jetez-y un coup d’œil !'],
  es: ['Español', 'Ver el perfil', 'Ver la lista de deseos', 'Descubre Toolya', 'Todos los deseos en un lugar', 'Aquí está la lista de deseos.', '¡Échale un vistazo!'],
  ar: ['العربية', 'عرض الملف الشخصي', 'عرض قائمة الأمنيات', 'اكتشف Toolya', 'كل الأمنيات في مكان واحد', 'هنا تجد قائمة الأمنيات.', 'ألقِ نظرة هنا!'],
  uk: ['Українська', 'Переглянути профіль', 'Відкрити список бажань', 'Відкрити Toolya', 'Усі бажання в одному місці', 'Тут є список бажань.', 'Зазирніть сюди!'],
  ja: ['日本語', 'プロフィールを見る', 'ほしい物リストを見る', 'Toolya を見る', 'ほしい物をひとまとめに', 'ほしい物リストはこちらです。', 'ぜひご覧ください！'],
  custom: ['Eigene Sprache', '', '', '', '', '', '']
};

export function newVariant(language, kind, title = '') {
  const [, profile, list, promo, , , social] = cardLanguages[language];
  return {
    id: crypto.randomUUID(), language, direction: language === 'ar' ? 'rtl' : 'auto',
    text: {title, name: '', explanation: '', note: '', qr: kind === 'list' ? list : profile, promo, social}
  };
}
