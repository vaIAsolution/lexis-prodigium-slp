import { GoogleGenerativeAI } from '@google/generative-ai';
import { kv } from '@vercel/kv';
import { PROMPTS } from './prompts.js';
import { ERROR_MESSAGES } from './errorMessages.js';

export default async (req, res) => {
  try {
    // Define el número máximo de usos permitidos para la demo por IP.
    const DEMO_MAX_USES_PER_IP = 5;

    // --- 1. Validar Clave de API ---
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY no está configurada.');
      return res.status(500).json({ error: ERROR_MESSAGES.API_KEY_MISSING });
    }

    // --- Obtener la IP del usuario ---
    // Se obtiene una sola vez y se reutiliza
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (!ip) {
        return res.status(400).json({ error: ERROR_MESSAGES.IP_NOT_IDENTIFIED });
    }
    const usageKey = `usage:${ip}`;

    // --- Manejar solicitud GET (para obtener usos iniciales) ---
    if (req.method === 'GET') {
      console.log(`[${new Date().toISOString()}] GET /api/proxy - Solicitud de usos restantes. IP: ${ip}`);
      let currentUsesGet = 0;
      try {
        currentUsesGet = await kv.get(usageKey) || 0;
      } catch (kvError) {
        console.error('Error al obtener usos iniciales de KV:', kvError);
        return res.status(500).json({ error: ERROR_MESSAGES.KV_FETCH_ERROR });
      }
      const remainingUses = DEMO_MAX_USES_PER_IP - currentUsesGet;
      return res.status(200).json({ remaining: remainingUses, max: DEMO_MAX_USES_PER_IP });
    }

    // --- Manejar solicitud POST (para consultas a la IA) ---
    if (req.method !== 'POST') {
      return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
    }
    
    // --- Log para depuración ---
    console.log(`[${new Date().toISOString()}] POST /api/proxy - Solicitud recibida. IP: ${ip}`);
    console.log(`[${new Date().toISOString()}] POST /api/proxy - Cuerpo de la solicitud: ${JSON.stringify(req.body, null, 2)}`);

    const { query, context } = req.body;
    if (!query) {
      console.error('Error: La consulta (query) está vacía o no definida.');
      return res.status(400).json({ error: ERROR_MESSAGES.QUERY_REQUIRED });
    }

    // --- 3. Verificar límite de usos con Vercel KV ---
    let currentUsesPost = 0;
    try {
      currentUsesPost = await kv.get(usageKey) || 0;
    } catch (kvError) {
      console.error('Error al obtener usos para POST de KV:', kvError);
      return res.status(500).json({ error: ERROR_MESSAGES.KV_FETCH_ERROR });
    }

    if (currentUsesPost >= DEMO_MAX_USES_PER_IP) {
      return res.status(429).json({ error: ERROR_MESSAGES.USAGE_LIMIT_EXCEEDED });
    }

    // --- 4. Procesar la solicitud a la IA ---
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      let finalPrompt = query; // Por defecto, el prompt es la consulta que ya viene completa

      // Si la consulta es para un análisis de estrategia, la reescribimos con el prompt de "Socio de Bufete"
      if (query.startsWith("Realiza un análisis de estrategia legal tipo FODA para el siguiente caso:")) {
        const caso = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.ANALISIS_ESTRATEGIA_LEGAL(caso);
      } else if (query.startsWith("Analiza el siguiente contrato para identificar riesgos bajo la legislación de San Luis Potosí:")) {
        const contrato = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.ANALISIS_CONTRATO(contrato);
      } else if (query.startsWith("Genera un borrador de escrito procesal para el siguiente caso en San Luis Potosí:")) {
        const caso = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.GENERAR_ESCRITO_PROCESAL(caso);
      } else if (query.startsWith("Genera un perfil estratégico del abogado o juez a partir del siguiente texto:")) {
        const texto = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.ANALISIS_PERFIL_ACTOR_LEGAL(texto);
      } else if (query.startsWith("Genera un borrador de documento legal general:")) {
        const detalles = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.GENERAR_DOCUMENTO_LEGAL_GENERAL(detalles);
      }
      console.log(`[${new Date().toISOString()}] POST /api/proxy - Llamando al modelo de IA con prompt: ${finalPrompt.substring(0, 100)}...`);
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      const text = response.text();

      // --- 5. Incrementar el conteo y enviar el resultado ---
      let newUses = 0;
      try {
        newUses = await kv.incr(usageKey);
      } catch (kvError) {
        console.error('Error al incrementar usos en KV:', kvError);
        // No retornamos un error aquí para no bloquear la respuesta de la IA si el incremento falla
        // pero sí lo logueamos para depuración.
      }
      const remainingUses = DEMO_MAX_USES_PER_IP - newUses;

      res.setHeader('X-Usage-Remaining', remainingUses);
      console.log(`[${new Date().toISOString()}] POST /api/proxy - Respuesta exitosa de IA enviada al cliente. Usos restantes para ${ip}: ${remainingUses}`);
      return res.status(200).json({ result: text });

    } catch (e) {
      console.error('ERROR CRÍTICO DENTRO DEL BLOQUE DE IA:', e);
      return res.status(500).json({ error: ERROR_MESSAGES.AI_COMMUNICATION_ERROR(e.message) });
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR GENERAL:`, error);
    res.status(500).json({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
  }
};