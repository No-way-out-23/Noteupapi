import { Readable } from 'stream';
import formidable from 'formidable';
import fs from 'fs';
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

  const form = formidable({});
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error al procesar archivo' });
      return;
    }

    const file = files.audio;
    const fileStream = fs.createReadStream(file.filepath);

    const openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: (() => {
        const formData = new FormData();
        formData.append('file', fileStream, file.originalFilename);
        formData.append('model', 'whisper-1');
        return formData;
      })(),
    });

    const data = await openaiRes.json();
    res.status(200).json(data);
  });
}
