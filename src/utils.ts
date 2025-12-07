import { QuranSurah, QuranVerse, Env } from './types';

let quranData: QuranSurah[] = [];

export async function loadQuranData(): Promise<QuranSurah[]> {
  if (quranData.length === 0) {
    try {

      const response = await fetch('https://api.alquran.cloud/v1/quran/quran-uthmani');
      const data = await response.json();

      if (data.code === 200 && data.data && data.data.surahs) {
        quranData = data.data.surahs.map((surah: any, index: number) => ({
          id: index + 1, 

          name: surah.englishName || `Surah ${index + 1}`,
          transliteration: surah.englishNameTranslation || '',
          translation: surah.name || '',
          type: surah.revelationType === 'Meccan' ? 'Makkiyah' : 'Madaniyah',
          total_verses: surah.ayahs ? surah.ayahs.length : 0,
          verses: surah.ayahs ? surah.ayahs.map((ayah: any, ayahIndex: number) => ({
            id: ayahIndex + 1,
            text: ayah.text || '',
            translation: ayah.translation || ''
          })) : []
        }));
      } else {

        quranData = await loadFallbackData();
      }
    } catch (error) {
      console.error('Failed to load Quran data from API:', error);

      quranData = await loadFallbackData();
    }
  }
  return quranData;
}

async function loadFallbackData(): Promise<QuranSurah[]> {
  try {
    console.log('Loading fallback Quran data...');

    return [
      {
        id: 1,
        name: "Al-Fatihah",
        transliteration: "Al-Fatihah",
        translation: "Pembukaan",
        type: "Makkiyah",
        total_verses: 7,
        verses: [
          { id: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", translation: "Dengan menyebut nama Allah Yang Maha Pengasih lagi Maha Penyayang." },
          { id: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", translation: "Segala puji bagi Allah, Tuhan semesta alam." }
        ]
      },
      {
        id: 2,
        name: "Al-Baqarah",
        transliteration: "Al-Baqarah",
        translation: "Sapi Betina",
        type: "Madaniyah",
        total_verses: 286,
        verses: [
          { id: 1, text: "الم", translation: "Alif Lam Mim." },
          { id: 2, text: "ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِلْمُتَّقِينَ", translation: "Kitab (Al-Quran) ini tidak ada keraguan padanya; petunjuk bagi mereka yang bertakwa." }
        ]
      }
    ];
  } catch (error) {
    console.error('Failed to load fallback data:', error);
    return [];
  }
}

export function extractKeywords(question: string): string[] {
  const stopWords = new Set([
    'apa', 'siapa', 'dimana', 'kapan', 'mengapa', 'bagaimana',
    'yang', 'dan', 'atau', 'dari', 'ke', 'di', 'pada', 'dengan',
    'untuk', 'tentang', 'seperti', 'adalah', 'itu', 'ini', 'saya',
    'kamu', 'kita', 'mereka', 'dalam', 'oleh', 'the', 'what', 'who',
    'where', 'when', 'why', 'how', 'is', 'are', 'and', 'or', 'from',
    'to', 'in', 'on', 'with', 'for', 'about', 'like', 'that', 'this'
  ]);

  return question.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

export function findRelevantVerses(
  quranData: QuranSurah[],
  keywords: string[],
  limit: number = 3
): any[] {
  const relevantVerses: any[] = [];

  for (const surah of quranData) {
    if (!surah.verses || !Array.isArray(surah.verses)) continue;

    for (const verse of surah.verses) {
      if (!verse || !verse.translation) continue;

      const verseText = verse.translation.toLowerCase();
      const verseArabic = verse.text || '';
      let score = 0;

      for (const keyword of keywords) {
        if (verseText.includes(keyword)) {
          score += keyword.length;
        }
      }

      if (score > 0) {
        relevantVerses.push({
          surah_id: surah.id,
          surah_name: surah.name,
          surah_name_arabic: surah.name, 

          verse_id: verse.id,
          verse_text_arabic: verseArabic,
          verse_text_translation: verse.translation,
          score
        });
      }
    }
  }

  return relevantVerses
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(v => ({
      ...v,
      reference: `${v.surah_name} (${v.surah_id}:${v.verse_id})`
    }));
}

export function createQuranPrompt(
  question: string,
  relevantVerses: any[],
  language: string = 'id'
): string {
  if (!relevantVerses || relevantVerses.length === 0) {
    if (language === 'id') {
      return `Anda adalah asisten AI khusus Al-Quran yang sangat berpengetahuan.
      Anda hanya menjawab pertanyaan berdasarkan Al-Quran dan tafsir yang sahih.
      Jika tidak tahu, katakan dengan jujur.

      Pertanyaan: "${question}"

      Berikan jawaban yang:
      1. Berdasarkan pengetahuan Al-Quran yang sahih
      2. Jelas dan mudah dipahami
      3. Menggunakan bahasa Indonesia yang baik
      4. Sertakan referensi ayat yang relevan jika ada
      5. Jika perlu, tambahkan tafsir singkat

      Jawaban:`;
    } else {
      return `You are a knowledgeable Quran AI assistant.
      You only answer questions based on the Quran and authentic interpretations.
      If you don't know, say so honestly.

      Question: "${question}"

      Provide an answer that:
      1. Is based on authentic Quran knowledge
      2. Clear and understandable
      3. Uses proper English
      4. Include relevant verse references if available
      5. Add brief interpretation if needed

      Answer:`;
    }
  }

  const versesContext = relevantVerses.map(v => {
    if (language === 'id') {
      return `Surah ${v.surah_name_arabic || v.surah_name} (${v.surah_id}:${v.verse_id})
Ayat Arab: "${v.verse_text_arabic}"
Terjemahan Indonesia: "${v.verse_text_translation}"`;
    } else {
      return `Surah ${v.surah_name_arabic || v.surah_name} (${v.surah_id}:${v.verse_id})
Arabic Verse: "${v.verse_text_arabic}"
English Translation: "${v.verse_text_translation}"`;
    }
  }).join('\n\n');

  if (language === 'id') {
    return `Anda adalah asisten AI khusus Al-Quran yang sangat berpengetahuan.
Tugas Anda hanya menjawab berdasarkan ayat-ayat Al-Quran di bawah ini:

Pertanyaan: "${question}"

AYAT-AL-QURAN YANG RELEVAN:
${versesContext}

INSTRUKSI JAWABAN:
1. Jawab HANYA berdasarkan ayat-ayat di atas
2. Setiap kali menyebut ayat, TULISKAN teks Arab-nya
3. Di bawah teks Arab, berikan terjemahannya
4. Gunakan format:
   [Nama Surah Ayat X]
   [Teks Arab]
   [Terjemahan]
5. Jawaban maksimal 3 paragraf
6. Jika tidak ada di ayat-ayat ini, katakan "Berdasarkan ayat-ayat yang tersedia..."

JAWABAN:`;
  } else {
    return `You are a knowledgeable Quran AI assistant.
You must answer ONLY based on the Quran verses below:

Question: "${question}"

RELEVANT QURAN VERSES:
${versesContext}

ANSWER INSTRUCTIONS:
1. Answer ONLY based on the verses above
2. Whenever mentioning a verse, WRITE the Arabic text
3. Below the Arabic text, provide the translation
4. Use format:
   [Surah Name Verse X]
   [Arabic Text]
   [Translation]
5. Maximum 3 paragraphs
6. If not in these verses, say "Based on the available verses..."

ANSWER:`;
  }
}

const INPUT_TOKEN_NEURON_RATE = 26668 / 1000000; 

const OUTPUT_TOKEN_NEURON_RATE = 204805 / 1000000; 

export function calculateNeuronsConsumed(
  promptTokens: number,
  completionTokens: number
): number {
  const inputNeurons = promptTokens * INPUT_TOKEN_NEURON_RATE;
  const outputNeurons = completionTokens * OUTPUT_TOKEN_NEURON_RATE;
  return inputNeurons + outputNeurons;
}

export function formatNeurons(neurons: number): string {
  if (neurons < 1000) {
    return neurons.toFixed(2);
  } else if (neurons < 1000000) {
    return `${(neurons / 1000).toFixed(2)}k`;
  } else {
    return `${(neurons / 1000000).toFixed(4)}M`;
  }
}

export function estimateCost(
  promptTokens: number,
  completionTokens: number
): { inputCost: number; outputCost: number; totalCost: number } {
  const INPUT_COST_PER_TOKEN = 0.293 / 1000000; 

  const OUTPUT_COST_PER_TOKEN = 2.253 / 1000000; 

  return {
    inputCost: promptTokens * INPUT_COST_PER_TOKEN,
    outputCost: completionTokens * OUTPUT_COST_PER_TOKEN,
    totalCost: (promptTokens * INPUT_COST_PER_TOKEN) + (completionTokens * OUTPUT_COST_PER_TOKEN)
  };
}

export async function checkAndUpdateNeuronLimit(
  env: Env,
  promptTokens: number,
  completionTokens: number
): Promise<{
  allowed: boolean;
  consumed: number;
  remaining: number;
  dailyLimit: number;
  message?: string;
}> {
  const DAILY_NEURON_LIMIT = 10000; 

  const today = new Date().toISOString().split('T')[0];
  const KV_KEY = `neuron_usage:${today}`;

  const consumedNeurons = calculateNeuronsConsumed(promptTokens, completionTokens);

  let currentNeurons = 0;
  try {
    const stored = await env.NEURON_LIMITER.get(KV_KEY);
    currentNeurons = stored ? parseFloat(stored) : 0;
  } catch (error) {
    console.error('Error reading neuron usage:', error);
  }

  const newTotal = currentNeurons + consumedNeurons;

  if (newTotal > DAILY_NEURON_LIMIT) {
    return {
      allowed: false,
      consumed: consumedNeurons,
      remaining: Math.max(0, DAILY_NEURON_LIMIT - currentNeurons),
      dailyLimit: DAILY_NEURON_LIMIT,
      message: `Batas harian neuron terlampaui. Tersisa: ${formatNeurons(DAILY_NEURON_LIMIT - currentNeurons)} neurons`
    };
  }

  try {
    await env.NEURON_LIMITER.put(
      KV_KEY,
      newTotal.toString(),
      { expirationTtl: 86400 } 

    );
  } catch (error) {
    console.error('Error updating neuron usage:', error);
  }

  return {
    allowed: true,
    consumed: consumedNeurons,
    remaining: DAILY_NEURON_LIMIT - newTotal,
    dailyLimit: DAILY_NEURON_LIMIT
  };
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function formatResponse(
  aiAnswer: string,
  relevantVerses: any[],
  language: string = 'id',
  usageInfo?: {
    tokens: {
      input: number;
      output: number;
      total: number;
    };
    neurons: {
      consumed: number;
      formatted: string;
      remaining: number;
      daily_limit: number;
    };
    cost_estimate: {
      input_usd: string;
      output_usd: string;
      total_usd: string;
    };
  }
): any {
  return {
    success: true,
    answer: aiAnswer,
    verses_data: relevantVerses.map(v => ({
      surah_id: v.surah_id,
      surah_name: v.surah_name,
      surah_name_arabic: v.surah_name_arabic,
      verse_id: v.verse_id,
      verse_arabic: v.verse_text_arabic,
      verse_translation: v.verse_text_translation,
      reference: v.reference
    })),
    language,
    timestamp: new Date().toISOString(),
    disclaimer: language === 'id' 
      ? "Jawaban AI untuk referensi. Verifikasi dengan ulama dan tafsir sahih."
      : "AI answer for reference. Verify with scholars and authentic tafsir.",
    usage: usageInfo
  };
}
