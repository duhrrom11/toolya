const libraryUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
let pendingLibrary;

export async function createExportPdf() {
  const requestLanguage = window.__toolyaUILocale === 'en' ? 'en' : 'de';
  if (!window.jspdf?.jsPDF) {
    pendingLibrary ??= new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = libraryUrl;
      script.onload = () => {
        if (window.jspdf?.jsPDF) resolve();
        else reject(new Error('PDF library unavailable'));
      };
      script.onerror = () => reject(new Error('PDF library failed to load'));
      document.head.append(script);
    }).catch(error => {
      pendingLibrary = undefined;
      throw error;
    });
  }
  try {
    await pendingLibrary;
    return new window.jspdf.jsPDF();
  } catch {
    window.alert(requestLanguage === 'en' ? 'Could not create the PDF. Please try again.' : 'Das PDF konnte nicht erstellt werden. Bitte versuche es erneut.');
    return null;
  }
}
