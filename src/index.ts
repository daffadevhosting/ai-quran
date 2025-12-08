import { Env, ChatMessage, AIRequest, AIResponse } from './types';
import { 
  loadQuranData, 
  extractKeywords, 
  findRelevantVerses, 
  createQuranPrompt, 
  formatResponse,
  calculateNeuronsConsumed,
  formatNeurons,
  estimateCost,
  checkAndUpdateNeuronLimit,
  estimateTokens
} from './utils';

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPTS = {
  id: `Anda adalah asisten AI khusus Al-Quran yang sangat berpengetahuan.
  Nama Anda: Ustad AI.
  Tugas Anda:
  1. Hanya menjawab berdasarkan Al-Quran dan tafsir yang sahih
  2. Jika tidak tahu, katakan dengan jujur
  3. Selalu sertakan referensi ayat Al-Quran
  4. Gunakan bahasa Indonesia yang baik dan mudah dipahami
  5. Berikan penjelasan yang jelas dan mendidik
  6. Hindari spekulasi atau pendapat pribadi

  Sifat Anda:
  - Santun dan sabar
  - Ilmiah dan objektif
  - Berbasis dalil yang kuat
  - Mengutamakan kebenaran`,

  en: `You are a knowledgeable Quran AI assistant.
  Your name: Ustad AI.
  Your responsibilities:
  1. Answer only based on the Quran and authentic interpretations
  2. If you don't know, say so honestly
  3. Always include Quran verse references
  4. Use clear and understandable English
  5. Provide clear and educational explanations
  6. Avoid speculation or personal opinions

  Your character:
  - Polite and patient
  - Scientific and objective
  - Based on strong evidence
  - Prioritizing truth`
};

async function fetchHandler(
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    if (path === '/' || path === '/api') {
      return Response.json({
        name: 'Quran AI API',
        version: '1.0.0',
        endpoints: {
          '/api/ask': 'Ask Quran questions (POST)',
          '/api/surah': 'Get all surahs (GET)',
          '/api/surah/:id': 'Get specific surah (GET)',
          '/api/search': 'Search verses (GET)',
          '/api/random': 'Random verse (GET)',
          '/api/health': 'Health check (GET)'
        }
      }, { headers: corsHeaders });
    }

    if (path === '/api/health') {
      return Response.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        ai_model: MODEL_ID
      }, { headers: corsHeaders });
    }

    const quranData = await loadQuranData();
    if (!quranData || quranData.length === 0) {
      throw new Error('Quran data not available');
    }

    if (path === '/api/surah' && method === 'GET') {
      const surahs = quranData.map(surah => ({
        id: surah.id,
        name: surah.name,
        transliteration: surah.transliteration,
        translation: surah.translation,
        type: surah.type,
        total_verses: surah.total_verses
      }));

      return Response.json(surahs, { headers: corsHeaders });
    }

    const surahMatch = path.match(/^\/api\/surah\/(\d+)$/);
    if (surahMatch && method === 'GET') {
      const surahId = parseInt(surahMatch[1]);
      const surah = quranData.find(s => s.id === surahId);

      if (!surah) {
        return Response.json(
          { error: 'Surah not found' }, 
          { status: 404, headers: corsHeaders }
        );
      }

      return Response.json(surah, { headers: corsHeaders });
    }

    if (path === '/api/search' && method === 'GET') {
      const query = url.searchParams.get('q');
      const limit = parseInt(url.searchParams.get('limit') || '10');

      if (!query) {
        return Response.json(
          { error: 'Query parameter "q" is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      const keywords = extractKeywords(query);
      const results = findRelevantVerses(quranData, keywords, limit);

      return Response.json({
        query,
        total_results: results.length,
        results
      }, { headers: corsHeaders });
    }

    if (path === '/api/random' && method === 'GET') {
      const randomSurah = quranData[Math.floor(Math.random() * quranData.length)];

      if (!randomSurah.verses || randomSurah.verses.length === 0) {
        return Response.json({
          error: 'No verses available',
          surah_id: randomSurah.id,
          surah_name: randomSurah.name
        }, { status: 404, headers: corsHeaders });
      }

      const randomVerse = randomSurah.verses[Math.floor(Math.random() * randomSurah.verses.length)];

      return Response.json({
        surah_id: randomSurah.id,
        surah_name: randomSurah.name,
        surah_translation: randomSurah.translation,
        verse_id: randomVerse.id,
        verse_text: randomVerse.text,
        verse_translation: randomVerse.translation,
        reference: `${randomSurah.name} (${randomSurah.id}:${randomVerse.id})`,
        message: "Random verse from the Holy Quran"
      }, { headers: corsHeaders });
    }

    if (path === '/api/ask' && method === 'POST') {
      const body = await request.json() as AIRequest;
      const { question, language = 'id' } = body;

      if (!question) {
        return Response.json(
          { error: 'Question is required' },
          { status: 400, headers: corsHeaders }
        );
      }

      if (question.length > 500) {
        return Response.json(
          { 
            error: 'Pertanyaan terlalu panjang',
            message: 'Maksimal 500 karakter',
            suggestion: 'Sederhanakan pertanyaan Anda'
          },
          { status: 400, headers: corsHeaders }
        );
      }

      const keywords = extractKeywords(question);
      const relevantVerses = findRelevantVerses(quranData, keywords, 3);

      const systemPrompt = SYSTEM_PROMPTS[language as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.id;
      const userPrompt = createQuranPrompt(question, relevantVerses, language);

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      try {

        const aiResponse = await env.AI.run(
          MODEL_ID,
          {
            messages,
            max_tokens: 512, 

            temperature: 0.7,
          }
        ) as AIResponse;

        const aiAnswer = aiResponse.response || 
                        aiResponse.content || 
                        aiResponse.answer || 
                        '';

        const promptTokens = aiResponse.usage?.prompt_tokens || estimateTokens(systemPrompt + userPrompt);
        const completionTokens = aiResponse.usage?.completion_tokens || estimateTokens(aiAnswer);

        const limitCheck = await checkAndUpdateNeuronLimit(env, promptTokens, completionTokens);

        if (!limitCheck.allowed) {

          const fallbackAnswer = language === 'id'
            ? `Batas harian neuron terlampaui. Berikut ayat-ayat terkait "${question}":`
            : `Daily neuron limit exceeded. Here are relevant Quran verses about "${question}":`;

          return Response.json({
            success: false,
            answer: fallbackAnswer,
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
            error: 'neuron_limit_exceeded',
            disclaimer: language === 'id'
              ? "AI sedang offline karena batas harian neuron. Hanya menampilkan ayat-ayat Al-Quran yang relevan."
              : "AI is offline due to daily neuron limit. Only displaying relevant Quran verses.",
            limit_info: {
              consumed: limitCheck.consumed,
              remaining: limitCheck.remaining,
              daily_limit: limitCheck.dailyLimit,
              message: limitCheck.message
            }
          }, { headers: corsHeaders });
        }

        const costEstimate = estimateCost(promptTokens, completionTokens);

        const formattedResponse = formatResponse(
          aiAnswer,
          relevantVerses,
          language,
          {
            tokens: {
              input: promptTokens,
              output: completionTokens,
              total: promptTokens + completionTokens
            },
            neurons: {
              consumed: limitCheck.consumed,
              formatted: formatNeurons(limitCheck.consumed),
              remaining: limitCheck.remaining,
              daily_limit: limitCheck.dailyLimit
            },
            cost_estimate: {
              input_usd: costEstimate.inputCost.toFixed(6),
              output_usd: costEstimate.outputCost.toFixed(6),
              total_usd: costEstimate.totalCost.toFixed(6)
            }
          }
        );

        return Response.json(formattedResponse, { headers: corsHeaders });

      } catch (aiError: any) {
        console.error('AI Error:', aiError);

        const fallbackAnswer = language === 'id'
          ? `Berdasarkan pertanyaan Anda tentang "${question}", berikut beberapa ayat Al-Quran yang relevan:`
          : `Based on your question about "${question}", here are some relevant Quran verses:`;

        return Response.json({
          success: false,
          answer: fallbackAnswer,
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
          error: 'AI service temporarily unavailable',
          disclaimer: language === 'id'
            ? "AI sedang mengalami gangguan. Hanya menampilkan ayat-ayat Al-Quran yang relevan."
            : "AI service is currently unavailable. Only displaying relevant Quran verses."
        }, { headers: corsHeaders });
      }
    }

    if (path === '/api/chat' && method === 'POST') {
      const { messages = [] } = await request.json() as { messages: ChatMessage[] };

      if (!messages.some(msg => msg.role === 'system')) {
        messages.unshift({ 
          role: 'system', 
          content: 'You are a helpful, friendly assistant. Provide concise and accurate responses.' 
        });
      }

      const response = await env.AI.run(
        MODEL_ID,
        {
          messages,
          max_tokens: 512,
          temperature: 0.7,
        }
      );

      return Response.json(response, { headers: corsHeaders });
    }

    return Response.json(
      { error: 'Endpoint not found' },
      { status: 404, headers: corsHeaders }
    );

  } catch (error: any) {
    console.error('Error:', error);

    return Response.json(
      { 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack 
      },
      { 
        status: 500, 
        headers: corsHeaders 
      }
    );
  }
}

export default {
  fetch: fetchHandler
} as ExportedHandler<Env>;
