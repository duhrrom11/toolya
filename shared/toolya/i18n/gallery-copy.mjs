/* Moods are presentation-only; index positions match the immutable mascot EMOTIONS array. */
const german=Object.freeze(['Fröhlich','Stolz','Neugierig','Nachdenklich','Überrascht','Besorgt','Mitfühlend','Verlegen','Frech','Schläfrig','Kichernd','Dankbar','Motiviert','Ratlos','Feiernd','Herzlich']);
const english=Object.freeze(['Happy','Proud','Curious','Thoughtful','Surprised','Worried','Empathetic','Shy','Cheeky','Sleepy','Giggly','Grateful','Motivated','Puzzled','Celebrating','Warm-hearted']);
export function emotionLabelsForLocale(locale){ return locale==='en'?english:german; }
