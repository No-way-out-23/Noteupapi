import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  // CORS
  const FRONTEND_ORIGIN = "https://noteup-theta.vercel.app";
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
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

  try {
    // Cambia aquí la inicialización:
    const form = formidable({ multiples: false });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(400).json({ error: 'Error procesando el archivo.' });
        return;
      }
      const audioFile = files.audio;
      if (!audioFile) {
        res.status(400).json({ error: 'Archivo de audio no enviado. Usa el campo "audio".' });
        return;
      }

      try {
        const fileStream = fs.createReadStream(audioFile.filepath);

        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', fileStream, audioFile.originalFilename);
        formData.append('model', 'whisper-1');

        const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData,
        });

        const data = await openaiRes.json();
        if (data.error) {
          res.status(500).json({ error: data.error.message });
          return;
        }

        res.status(200).json({ text: data.text });
      } catch (error) {
        res.status(500).json({ error: 'Error llamando a la API de OpenAI.', detail: error.message });
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor.', detail: error.message, stack: error.stack });
  }
}
