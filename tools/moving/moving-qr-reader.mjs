let decoder;
async function fallbackDecoder() {
    decoder ??= import('../../assets/vendor/jsqr-1.4.0.min.js')
        .then(() => {
            if (typeof globalThis.jsQR !== 'function') throw Error('QR decoder unavailable');
            return globalThis.jsQR;
        })
        .catch(error => { decoder = undefined; throw error; });
    return decoder;
}

export async function createMovingQrReader() {
    let native;
    try {
        if (typeof globalThis.BarcodeDetector === 'function') {
            native = new globalThis.BarcodeDetector({ formats: ['qr_code'] });
        }
    } catch {}
    if (!native) await fallbackDecoder();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    return async function detect(source) {
        if (native) {
            try { return (await native.detect(source)).map(code => code.rawValue); }
            catch { native = undefined; }
        }
        const width = source.videoWidth || source.width, height = source.videoHeight || source.height;
        if (!width || !height) return [];
        const scale = Math.min(1, 1000 / Math.max(width, height));
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        const decode = await fallbackDecoder();
        const result = decode(image.data, image.width, image.height);
        return result ? [result.data] : [];
    };
}

export function helperBoxFromCode(value, origin, token, boxes) {
    try {
        const code = new URL(value, origin);
        if (code.origin !== origin || code.pathname !== '/tools/moving/helper/index.html') return '';
        const hash = new URLSearchParams(code.hash.slice(1));
        const assignment = hash.get('a');
        return hash.get('t') === token && boxes.some(box => box.assignmentId === assignment) ? assignment : '';
    } catch {
        return '';
    }
}

export function inventoryBoxIdFromCode(value, origin) {
    try {
        const url = new URL(value, origin);
        if (url.origin !== origin || !['/tools/moving/', '/tools/moving/index.html'].includes(url.pathname)) return null;
        const id = url.searchParams.get('box');
        if (!id || !/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) return null;
        return Number(id);
    } catch {
        return null;
    }
}
