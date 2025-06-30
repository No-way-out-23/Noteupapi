
# NoteUp API (Vercel Backend)

Este backend proporciona endpoints para transcripción, traducción y resumen usando la API de OpenAI. Ideal para aplicaciones móviles/web.

## Estructura de carpetas
```
/api
  transcribe.js
  translate.js
  summarize.js
package.json
```

## Instrucciones de despliegue en Vercel

1. Sube toda la carpeta `noteup-api` a un repositorio de GitHub.
2. Ve a [https://vercel.com](https://vercel.com) y crea un nuevo proyecto eligiendo ese repositorio.
3. En "Environment Variables", agrega:
   - `OPENAI_API_KEY` = `tu-clave-personal-de-openai`
4. Despliega el proyecto.

### Endpoints:
- `POST /api/transcribe`  — Form-data: `{ audio: archivo }`
- `POST /api/translate`   — JSON: `{ text: "...", targetLanguage: "Inglés/Español/Francés/..." }`
- `POST /api/summarize`   — JSON: `{ text: "..." }`

---

Cualquier duda, consúltame por chat.
