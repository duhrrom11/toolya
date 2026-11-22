import test from 'node:test';import assert from 'node:assert/strict';
import {emotionLabelsForLocale} from '../../shared/toolya/i18n/gallery-copy.mjs';
test('both mascot mood sets have stable 16-slot order',()=>{for(const lang of ['de','en']){const labels=emotionLabelsForLocale(lang);assert.equal(labels.length,16);assert.equal(new Set(labels).size,16);assert.ok(Object.isFrozen(labels));}assert.equal(emotionLabelsForLocale('en')[0],'Happy');assert.equal(emotionLabelsForLocale('de')[0],'Fröhlich');assert.deepEqual(emotionLabelsForLocale('unknown'),emotionLabelsForLocale('de'));});
