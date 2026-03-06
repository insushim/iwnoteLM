/**
 * Gemini 2.5 Flash API
 * 무료 티어: 10 RPM, 250,000 TPM, 250 RPD
 * 성능 좋고 무료 할당량 충분. 1M 컨텍스트 윈도우.
 */

const GEMINI_MODEL = 'gemini-2.5-flash-preview-05-20';

interface GeminiMessage {
  role: 'user' | 'model';
  content: string;
}

export async function callGemini(
  systemPrompt: string,
  messages: GeminiMessage[],
  maxTokens: number = 4096
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const contents = messages.map(m => ({
    role: m.role === 'model' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API 실패: ${response.status} - ${error}`);
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts) {
    throw new Error('Gemini 응답이 비어있습니다.');
  }

  return data.candidates[0].content.parts
    .map((part: { text?: string }) => part.text || '')
    .join('');
}
