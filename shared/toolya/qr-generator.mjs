let pendingLibrary;

export async function loadQrGenerator() {
  if (window.QRCode) return window.QRCode;

  pendingLibrary ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => {
      if (window.QRCode) resolve(window.QRCode);
      else reject(new Error('QR library unavailable'));
    };
    script.onerror = () => reject(new Error('QR library failed to load'));
    document.head.append(script);
  }).catch(() => {
    pendingLibrary = undefined;
    return null;
  });
  return pendingLibrary;
}
