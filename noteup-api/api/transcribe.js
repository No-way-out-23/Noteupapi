
import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

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

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'Error al procesar archivo' });
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
    res.status(openaiRes.status).json(data);
  });
}
