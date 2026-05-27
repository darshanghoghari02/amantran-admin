import { API_URL } from '@/config';
export const LANGUAGE_CODE_MAP: Record<string, string> = {
  English: 'en',
  english: 'en',
  Hindi: 'hi',
  hindi: 'hi',
  Gujarati: 'gu',
  gujarati: 'gu',
  Gujrati: 'gu',
  gujrati: 'gu',
  Marathi: 'mr',
  marathi: 'mr',
  Tamil: 'ta',
  tamil: 'ta',
  Urdu: 'ur',
  urdu: 'ur'
};

/**
 * Returns the correct Google Translate language code for any language name,
 * supporting spelling variations (e.g., Gujrati vs Gujarati) and loose matching.
 */
export function getLanguageCode(langName: string): string {
  if (!langName) return 'auto';
  const normalized = langName.trim().toLowerCase();
  
  if (LANGUAGE_CODE_MAP[langName]) return LANGUAGE_CODE_MAP[langName];
  if (LANGUAGE_CODE_MAP[normalized]) return LANGUAGE_CODE_MAP[normalized];
  
  // Loose prefix and contains matching for maximum robustness
  if (normalized.includes('eng')) return 'en';
  if (normalized.includes('hin')) return 'hi';
  if (normalized.includes('guj')) return 'gu';
  if (normalized.includes('mar')) return 'mr';
  if (normalized.includes('tam')) return 'ta';
  if (normalized.includes('urd')) return 'ur';
  
  return 'auto';
}

/**
 * Translates a single text from a source language to a target language.
 */
export async function translateText(
  text: string, 
  targetLangName: string, 
  sourceLangName: string = 'auto'
): Promise<string> {
  if (!text || !text.trim()) return text;
  
  const targetCode = getLanguageCode(targetLangName);
  if (!targetCode || targetCode === 'auto') return text;
  
  let sourceCode = getLanguageCode(sourceLangName);

  // Heuristic: If the source text consists solely of Latin characters (ASCII), 
  // but the selected source language is non-English, force sl=auto to let Google 
  // detect the Latin-transliterated text correctly!
  const isPureLatin = !/[^\x00-\x7F]/.test(text);
  if (isPureLatin && sourceCode !== 'en') {
    sourceCode = 'auto';
  }

  if (sourceCode !== 'auto' && targetCode === sourceCode) return text;

  try {
    const res = await fetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        targetCode,
        sourceCode
      })
    });
    if (!res.ok) throw new Error('Translation proxy failed');
    const data = await res.json();
    return data.translatedText || text;
  } catch (err) {
    console.error(`Error translating to ${targetLangName}:`, err);
    // Fallback: in case the backend server is down, try direct public API!
    try {
      const directUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;
      const directRes = await fetch(directUrl);
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && directData[0]) {
          return directData[0].map((part: any) => part[0] || '').join('');
        }
      }
    } catch (directErr) {
      console.error('Direct fallback translation failed:', directErr);
    }
    return text; // Fallback to original
  }
}

/**
 * Translates a given text into all other supported languages concurrently.
 */
export async function translateToAll(
  text: string, 
  sourceLangName: string = 'auto', 
  languages: string[] = ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu']
): Promise<Record<string, string>> {
  const translations: Record<string, string> = {};
  
  const activeLangs = languages && languages.length > 0 
    ? languages 
    : ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Urdu'];

  await Promise.all(
    activeLangs.map(async (lang) => {
      translations[lang] = await translateText(text, lang, sourceLangName);
    })
  );

  return translations;
}
