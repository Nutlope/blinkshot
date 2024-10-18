const CHUNK_SIZE = 1000; // Increased chunk size

export async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  console.log(`Original text (${fromLang}): "${text}"`);
  
  // Split the text into chunks
  const chunks = splitIntoChunks(text, CHUNK_SIZE);
  let translatedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Translating chunk ${i + 1}/${chunks.length}: "${chunk}"`);

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: chunk, sourceLanguage: fromLang, targetLanguage: toLang }),
    });

    if (!response.ok) {
      console.error('Translation API error:', response.statusText);
      throw new Error('Translation failed');
    }

    const { translatedText } = await response.json();
    translatedChunks.push(translatedText);
    console.log(`Translated chunk ${i + 1}: "${translatedText}"`);
  }

  const fullTranslation = translatedChunks.join(' ');
  
  // Improved cleaning process
  const cleanedTranslation = fullTranslation
    .replace(/^I'll provide feedback.*?(?=Once upon a time)/i, '') // Remove meta-text at the beginning
    .replace(/Note:.*?(?=\n|$)/gi, '')
    .replace(/\( .*?\)/g, '') // Remove parenthetical comments
    .split('\n')
    .filter(line => line.trim() !== '')
    .join('\n')
    .replace(/(\S+)(?:\s+\1)+/g, '$1') // Remove consecutive duplicate words
    .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
    .replace(/(.{100,}?)\1+/g, '$1') // Remove large repeated sections (adjust 100 as needed)
    .trim();

  console.log(`Final translation (${toLang}): "${cleanedTranslation}"`);
  console.log('Translation comparison:');
  console.log(`Original (${fromLang}): ${text}`);
  console.log(`Translated (${toLang}): ${cleanedTranslation}`);

  return cleanedTranslation;
}

function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + chunkSize));
    index += chunkSize;
  }
  return chunks;
}
