import {createMovingQrReader, inventoryBoxIdFromCode} from './moving-qr-reader.mjs';

export function createBatchScanner(dialog, copy, onBox) {
    const video = dialog.querySelector('video');
    const output = dialog.querySelector('output');
    const target = dialog.querySelector('#movingScanTarget');
    const trip = dialog.querySelector('#movingScanTrip');
    const start = dialog.querySelector('[data-camera-start]');
    const enter = dialog.querySelector('input');
    const manual = dialog.querySelector('[data-manual-submit]');
    let generation = 0, stream = null, busy = false, opening = false;
    let lastCode = '', summary = null;
    const completed = new Map();

    function message(key, ...values) {
        if (typeof copy[key] === 'function') return copy[key](...values);
        return key;
    }
    function report(key, label = '') {
        summary = [key, label];
        render();
    }
    const keyFor = () => JSON.stringify([target.value, trip.value]);
    function render() {
        const [key, label] = summary ?? ['ready', ''];
        if (trip.options.length) trip.options[0].textContent = message('allTrips');
        output.textContent = [trip.value, message(key, label), message('count', completed.get(keyFor())?.size || 0)]
            .filter(Boolean).join(' · ');
        target.disabled = busy;
        trip.disabled = busy;
        manual.disabled = busy;
        start.disabled = opening || !!stream;
    }
    function stopCamera() {
        if (stream) for (const track of stream.getTracks()) track.stop();
        stream = null;
        video.srcObject = null;
        lastCode = '';
    }
    function close() {
        generation++;
        stopCamera();
        completed.clear();
    }
    async function process(id) {
        if (busy || !dialog.open) return;
        if (id === null) { report('unknown'); return; }
        const mode = target.value;
        const key = keyFor();
        let seen = completed.get(key);
        if (!seen) completed.set(key, seen = new Set());
        if (seen.has(id)) { report('duplicate'); return; }
        const session = generation;
        busy = true;
        render();
        try {
            const result = await onBox(id, mode, trip.value);
            if (session !== generation) return;
            if (result.status === 'saved' || result.status === 'already') seen.add(id);
            report(result.status, result.label);
        } catch {
            if (session === generation) report('failed');
        } finally {
            busy = false;
            render();
        }
    }
    async function openCamera() {
        if (!dialog.open || opening || stream) return;
        const session = generation;
        opening = true;
        render();
        try {
            const detect = await createMovingQrReader();
            if (session !== generation) return;
            const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
            if (session !== generation) {
                for (const track of media.getTracks()) track.stop();
                return;
            }
            stream = media;
            video.srcObject = media;
            await video.play();
            const scan = async () => {
                if (session !== generation || stream !== media) return;
                if (!busy) {
                    try {
                        const [code = ''] = await detect(video);
                        if (session !== generation || stream !== media) return;
                        if (code && code !== lastCode) {
                            lastCode = code;
                            await process(inventoryBoxIdFromCode(code, location.origin));
                        } else if (!code) lastCode = '';
                    } catch {
                        if (session === generation) {
                            stopCamera();
                            report('noCamera');
                        }
                        return;
                    }
                }
                if (session === generation) setTimeout(scan, 200);
            };
            void scan();
        } catch {
            if (session === generation) {
                stopCamera();
                report('noCamera');
            }
        } finally {
            opening = false;
            render();
        }
    }
    start.addEventListener('click', () => void openCamera());
    for (const field of [target, trip]) field.addEventListener('change', () => {
        lastCode = '';
        report('ready');
    });
    function submitCode() {
        const value = enter.value.trim();
        const id = /^\d+$/.test(value) && Number.isSafeInteger(Number(value))
            ? Number(value) : inventoryBoxIdFromCode(value, location.origin);
        void process(id);
    }
    manual.addEventListener('click', submitCode);
    enter.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitCode();
        }
    });
    dialog.addEventListener('close', close);
    window.addEventListener('pagehide', close);
    return {
        open(trips) {
            if (dialog.open) return;
            trip.replaceChildren(new Option(message('allTrips'), ''), ...trips.map(name => new Option(name, name)));
            enter.value = '';
            target.value = 'loaded';
            dialog.showModal();
            report('ready');
        },
        invalidate() { if (dialog.open) dialog.close(); },
        render
    };
}
