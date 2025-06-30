import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false, // necesario para manejar archivos
  },
};

export default async function handler(req, res) {
  // === INICIO: CORS HEADERS ===
  res.setHeader('Access-Control-Allow-Origin', '*'); // O pon tu frontend específico aquí
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  // === FIN: CORS HEADERS ===

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error al procesar archivo', detail: err.message });
      return;
    }

    const file = files.audio;
    if (!file) {
      res.status(400).json({ error: 'Archivo de audio no proporcionado.' });
      return;
    }

    const fileStream = fs.createReadStream(file.filepath);
    const formData = new FormData();
    formData.append('file', fileStream, file.originalFilename);
    formData.append('model', 'whisper-1'); // o el modelo que estés usando

    try {
      const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          ...formData.getHeaders(),
        },
        body: formData,
      });

      const data = await openaiRes.json();
      if (data.text) {
        res.status(200).json({ text: data.text });
      } else {
        res.status(500).json({ error: data.error?.message || "Error al transcribir." });
      }
    } catch (error) {
      res.status(500).json({ error: "Error interno al enviar a OpenAI.", detail: error.message });
    }
  });
}
