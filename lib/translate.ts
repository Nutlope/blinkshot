export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, sourceLanguage: fromLang, targetLanguage: toLang }),
  });

  if (!response.ok) {
    throw new Error('Translation failed');
  }

  const { translatedText } = await response.json();
  return translatedText;
}
