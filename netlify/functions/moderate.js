exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { text } = JSON.parse(event.body);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: `You are a content moderator for a mental health support website.
Users submit short notes of encouragement for strangers who are struggling.

APPROVE if: the note is kind, supportive, empathetic, encouraging, or heartfelt. Notes can be in any language.
REJECT if: the note contains hate speech, slurs, sexual content, graphic violence, instructions for self-harm, mockery, or spam.

Respond ONLY with valid JSON: {"approved": true} or {"approved": false}`,
      messages: [{ role: 'user', content: `Note to review: "${text}"` }]
    })
  });

  const data = await response.json();
  const txt = data.content.map(i => i.text || '').join('');
  const clean = txt.replace(/```json|```/g, '').trim();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: clean
  };
};
