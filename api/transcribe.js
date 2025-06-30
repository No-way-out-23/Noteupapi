import formidable from 'formidable';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';

export const config = {
  api: { bodyParser: false }
};

export default async function handler(req, res) {
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
    const form = formidable({ multiples: false });
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(400).json({ error: 'Error procesando el archivo.' });
        return;
      }
      let audioFile = files.audio;
      if (Array.isArray(audioFile)) {
        audioFile = audioFile[0];
      }
      if (!audioFile || !audioFile.filepath) {
        res.status(400).json({ error: 'No se encontró el archivo de audio.' });
        return;
      }

      // Espera a que el archivo esté completamente escrito
      await new Promise((resolve) => {
        if (audioFile._writeStream.closed) {
          resolve();
        } else {
          audioFile._writeStream.on('close', resolve);
        }
      });

      // Usa formdata-node para el form-data correcto
      const formData = new FormData();
      formData.append('file', await fileFromPath(audioFile.filepath, audioFile.originalFilename || 'audio.mp3'));
      formData.append('model', 'whisper-1');

      try {
        const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.headers
          },
          body: formData
        });

        const openaiResText = await openaiRes.text();
        console.log("OpenAI RAW response:", openaiResText);

        let data;
        try {
          data = JSON.parse(openaiResText);
        } catch (e) {
          res.status(500).json({ error: 'Respuesta de OpenAI no es JSON', raw: openaiResText });
          return;
        }
        if (data.error) {
          res.status(500).json({ error: data.error.message, detalle: data });
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
