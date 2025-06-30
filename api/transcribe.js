import { IncomingForm } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://noteup-theta.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }

  const form = new IncomingForm();
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

    // ¡OJO! Si file.filepath no existe en serverless, usa fs.readFileSync o file.buffer si formidable lo da
    let fileBuffer;
    try {
      fileBuffer = fs.readFileSync(file.filepath);
    } catch (e) {
      res.status(500).json({ error: 'No se pudo leer el archivo.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', fileBuffer, file.originalFilename);
    formData.append('model', 'whisper-1');

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

