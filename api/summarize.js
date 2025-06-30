
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    const { text } = req.body;

    const prompt = `Resume el siguiente texto en formato de lista con puntos clave, orientado a estudiantes universitarios:\n\n${text}`;

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
    const summary = data.choices?.[0]?.message?.content || "No se obtuvo resumen.";

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
