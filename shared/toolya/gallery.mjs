import {buddy,EMOTIONS,previewEmotion,previewOutfit} from './platform.mjs';
const labels=['Fröhlich','Stolz','Neugierig','Nachdenklich','Überrascht','Besorgt','Mitfühlend','Verlegen','Frech','Schläfrig','Kichernd','Dankbar','Motiviert','Ratlos','Feiernd','Herzlich'];
EMOTIONS.forEach((emotion,i)=>{const b=document.createElement('button');b.type='button';b.textContent=labels[i];b.onclick=()=>{buddy.dismiss();previewEmotion(emotion);document.querySelector('.tb-message-box')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})};document.getElementById('feelings').append(b)});
document.getElementById('outfit').onchange=e=>previewOutfit(Number(e.target.value));
