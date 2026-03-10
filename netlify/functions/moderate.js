exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
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
        system: `You are a content moderator for a mental health support website called notalone.kz.
Users submit short notes of encouragement for strangers who are struggling emotionally.

APPROVE only if: the note is clearly directed at someone who is struggling — kind, supportive, empathetic, encouraging, or heartfelt. Notes can be in any language (English, Russian, Kazakh or others).

REJECT if the note:
- Contains hate speech, slurs, sexual content, graphic violence, or instructions for self-harm
- Is mocking, sarcastic, or dismissive of mental health
- Is spam or promotional content
- Is a personal introduction (e.g. "Hi my name is...", "I am looking for...")
- Is a dating or friendship request
- Is off-topic and not directed at someone who is struggling emotionally
- Is about the author rather than for the reader

When in doubt, ask: "Would this note comfort someone having the worst day of their life?" If not, reject it.

Respond ONLY with valid JSON: {"approved": true} or {"approved": false}`,
        messages: [{ role: 'user', content: `Note to review: "${text}"` }]
      })
    });

    const data = await response.json();

    // If Anthropic returned an error, log it and fail open
    if (!response.ok || !data.content) {
      console.error('Anthropic error:', JSON.stringify(data));
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true })
      };
    }

    const txt = data.content.map(i => i.text || '').join('');
    const clean = txt.replace(/```json|```/g, '').trim();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: clean
    };

  } catch (err) {
    console.error('Function error:', err.message);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approved: true })
    };
  }
};
