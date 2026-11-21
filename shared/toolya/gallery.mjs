import {buddy,EMOTIONS,previewEmotion,previewOutfit} from './platform.mjs';
import {emotionLabelsForLocale} from './i18n/gallery-copy.mjs';
const labels=emotionLabelsForLocale(document.documentElement.lang);
EMOTIONS.forEach((emotion,i)=>{const b=document.createElement('button');b.type='button';b.textContent=labels[i]||emotion;b.onclick=()=>{buddy.dismiss();previewEmotion(emotion);document.querySelector('.tb-message-box')?.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})};document.getElementById('feelings').append(b)});
document.getElementById('outfit').onchange=e=>previewOutfit(Number(e.target.value));
