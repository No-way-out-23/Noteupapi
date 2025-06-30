import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  try {
    // Lee y parsea el body manualmente
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }
    let json;
    try {
      json = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: 'El body enviado no es JSON válido.' });
      return;
    }

    const { text } = json;
    if (!text) {
      res.status(400).json({ error: 'Falta el campo "text" en el body.' });
      return;
    }

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

    let data;
    try {
      data = await openaiRes.json();
    } catch (err) {
      res.status(500).json({ error: 'No se pudo parsear la respuesta de OpenAI', raw: await openaiRes.text() });
      return;
    }

    if (data.error) {
      res.status(500).json({ error: data.error.message });
      return;
    }

    const summary = data.choices?.[0]?.message?.content || "No se obtuvo resumen.";
    res.status(200).json({ summary });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.', detail: error.message, stack: error.stack });
  }
}
