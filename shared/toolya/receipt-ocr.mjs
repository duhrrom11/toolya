let ocrLibraryPromise;
export function loadOcrLibrary() {
    if (window.Tesseract?.createWorker) return Promise.resolve(window.Tesseract);
    if (!ocrLibraryPromise) {
        ocrLibraryPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
            script.onload = () => {
                if (window.Tesseract?.createWorker) resolve(window.Tesseract);
                else reject(new Error('OCR library unavailable'));
            };
            script.onerror = () => reject(new Error('OCR library failed to load'));
            document.head.append(script);
        }).catch(error => {
            ocrLibraryPromise = undefined;
            throw error;
        });
    }
    return ocrLibraryPromise;
}
