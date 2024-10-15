import { NextResponse } from 'next/server';
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export async function POST(req: Request) {
  const { text, language } = await req.json();

  try {
    const audioData = await textToSpeech(text, language);
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': 'audio/wav',
      },
    });
  } catch (error) {
    console.error('Error generating speech:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}

async function textToSpeech(text: string, language: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const speechConfig = sdk.SpeechConfig.fromSubscription(
      process.env.AZURE_SPEECH_KEY!,
      process.env.AZURE_SPEECH_REGION!
    );
    speechConfig.speechSynthesisLanguage = language;

    const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          resolve(result.audioData);
        } else {
          reject(new Error('Speech synthesis canceled or failed'));
        }
        synthesizer.close();
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}
