import formidable from 'formidable';
import { Readable } from 'stream';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  // CORS headers...
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

      // --- DEBUG ---
      console.log("FIELDS:", fields);
      console.log("FILES:", files);

      let audioFile = files.audio;
      if (Array.isArray(audioFile)) {
        audioFile = audioFile[0];
      }

      if (!audioFile) {
        res.status(400).json({ error: 'Archivo de audio no enviado. Usa el campo "audio".' });
        return;
      }

      let fileStream;
      let filename = audioFile.originalFilename || 'audio.webm';

      // Debug: log audioFile for field info
      console.log("audioFile STRUCTURE:", audioFile);

      if (audioFile.filepath) {
        const fs = await import('fs');
        fileStream = fs.createReadStream(audioFile.filepath);
      } else if (audioFile.toBuffer) {
        const buffer = await audioFile.toBuffer();
        fileStream = Readable.from(buffer);
      } else if (audioFile.buffer) {
        fileStream = Readable.from(audioFile.buffer);
      } else if (audioFile._writeStream && audioFile._writeStream.buffer) {
        fileStream = Readable.from(audioFile._writeStream.buffer);
      } else if (audioFile.file) {
        fileStream = Readable.from(audioFile.file);
      } else {
        res.status(500).json({ error: 'No se pudo obtener el archivo del request.', detalle: audioFile });
        return;
      }

      try {
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('file', fileStream, filename);
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
