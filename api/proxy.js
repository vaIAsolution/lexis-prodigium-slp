import { GoogleGenerativeAI } from '@google/generative-ai';
import { kv } from '@vercel/kv';

export default async (req, res) => {
  try {
    const MAX_USES = 5; // Definido una sola vez para ambos métodos (GET y POST)

    // --- 1. Validar Clave de API ---
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY no está configurada.');
      return res.status(500).json({ error: 'Error de configuración del servidor: Falta la clave de API.' });
    }

    // --- Obtener la IP del usuario ---
    // Se obtiene una sola vez y se reutiliza
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ip) {
        return res.status(400).json({ error: 'No se pudo identificar al usuario.' });
    }
    const usageKey = `usage:${ip}`;

    // --- Manejar solicitud GET (para obtener usos iniciales) ---
    if (req.method === 'GET') {
      const currentUses = await kv.get(usageKey) || 0;
      const remainingUses = MAX_USES - currentUses;
      return res.status(200).json({ remaining: remainingUses, max: MAX_USES });
    }

    // --- Manejar solicitud POST (para consultas a la IA) ---
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }
    
    // --- Log para depuración ---
    console.log('Recibida solicitud POST en /api/proxy');
    console.log('Cuerpo de la solicitud (req.body):', JSON.stringify(req.body, null, 2));

    const { query, context } = req.body;
    if (!query) {
      console.error('Error: La consulta (query) está vacía o no definida.');
      return res.status(400).json({ error: 'La consulta es requerida' });
    }

    // --- 3. Verificar límite de usos con Vercel KV ---
    // **NO se redeclaran 'ip' ni 'usageKey' aquí**
    const currentUses = await kv.get(usageKey) || 0;

    if (currentUses >= MAX_USES) {
      return res.status(429).json({ error: 'Límite de usos excedido. Contacte a ventas para una demo completa.' });
    }

    // --- 4. Procesar la solicitud a la IA ---
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      // El prompt ahora viene completo desde el frontend
      const prompt = query;

      console.log('Enviando el siguiente prompt a la IA:', JSON.stringify(prompt, null, 2));

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // --- 5. Incrementar el conteo y enviar el resultado ---
      const newUses = await kv.incr(usageKey);
      const remainingUses = MAX_USES - newUses;

      res.setHeader('X-Usage-Remaining', remainingUses);
      console.log('Enviando respuesta exitosa al cliente.');
      return res.status(200).json({ result: text });

    } catch (e) {
      console.error('ERROR CRÍTICO DENTRO DEL BLOQUE DE IA:', e);
      return res.status(500).json({ error: `Hubo un error al comunicarse con el modelo de IA: ${e.message}` });
    }

  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    res.status(500).json({ error: 'Falló al procesar la solicitud de la IA.' });
  }
};