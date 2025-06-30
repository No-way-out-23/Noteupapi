
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const { text, targetLanguage } = req.body;

    const prompt = `Traduce el siguiente texto al idioma ${targetLanguage} de forma precisa y manteniendo el contexto académico:\n\n${text}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await openaiRes.json();
    const translatedText = data.choices?.[0]?.message?.content || "No se obtuvo traducción.";

    res.status(200).json({ translatedText });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
