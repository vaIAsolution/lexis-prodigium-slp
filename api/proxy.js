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
    
    const { query, context } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'La consulta es requerida' });
    }

    // --- 3. Verificar límite de usos con Vercel KV ---
    // **NO se redeclaran 'ip' ni 'usageKey' aquí**
    const currentUses = await kv.get(usageKey) || 0;

    if (currentUses >= MAX_USES) {
      return res.status(429).json({ error: 'Límite de usos excedido. Contacte a ventas para una demo completa.' });
    }

    // --- 4. Procesar la solicitud a la IA ---
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    let prompt = '';

    // Artículo 479 de la Ley General de Salud (hardcodeado para demo rápida)
    const ARTICULO_479_LGS = `
    Artículo 479.- Para los efectos de este Capítulo se entiende por:
    I. Cantidad de narcótico para uso personal:
    a) Opio: 2 gramos;
    b) Diacetilmorfina o heroína: 50 miligramos;
    c) Cannabis Sativa, Indica y Americana o marihuana: 5 gramos;
    d) Cocaína: 500 miligramos;
    e) Lisergida: 0.015 miligramos;
    f) Metanfetamina: 40 miligramos;
    g) Demás narcóticos: la que resulte de multiplicar por mil el límite máximo de consumo personal e inmediato establecido en la tabla de orientación de dosis máximas de consumo personal e inmediato, que al efecto publique la Secretaría de Salud.
    `;

    if (query.startsWith("Busca y analiza la siguiente tesis o jurisprudencia:")) {
      prompt = 'Actúa como un experto en jurisprudencia mexicana. Analiza la siguiente solicitud y proporciona un resumen claro, conciso y relevante de la tesis o jurisprudencia... ' + query;
    } else if (query.startsWith("Realiza un análisis de estrategia legal tipo FODA para el siguiente caso:")) {
      let additionalContext = '';
      const lowerCaseQuery = query.toLowerCase();
      const lowerCaseContext = context.toLowerCase();

      if (lowerCaseQuery.includes('marihuana') || lowerCaseQuery.includes('estupefacientes') || lowerCaseQuery.includes('drogas') || lowerCaseQuery.includes('narcóticos') || lowerCaseContext.includes('marihuana') || lowerCaseContext.includes('estupefacientes') || lowerCaseContext.includes('drogas') || lowerCaseContext.includes('narcóticos') || lowerCaseContext.includes('cannabis')) {
        additionalContext = `
        Considera la siguiente información relevante de la Ley General de Salud de México para tu análisis, y **cita explícitamente el artículo y la ley cuando sea pertinente**:
        ${ARTICULO_479_LGS}
        `;
      }

      prompt = [
        'Eres un Asistente Legal de IA de élite, especializado en derecho penal mexicano. Tu objetivo es proporcionar un análisis de estrategia legal tipo FODA (Fortalezas, Oportunidades, Debilidades, Amenazas) para el caso presentado. Debes ser extremadamente preciso en tus referencias legales, citando artículos y leyes específicas cuando sea relevante. Si la información proporcionada te permite inferir la aplicabilidad de un artículo, hazlo y cítalo.',
        '**CASO A ANALIZAR:**',
        context,
        additionalContext
      ].join('\n');
    } else if (query.startsWith("Genera un borrador del siguiente documento:")) {
      prompt = 'Actúa como un abogado redactor de documentos legales de alto nivel en México... ' + query + '. Detalles clave: ' + context;
    } else {
      prompt = 'Responde a la siguiente pregunta de forma concisa: ' + query;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // --- 5. Incrementar el conteo y enviar el resultado ---
    const newUses = await kv.incr(usageKey);
    const remainingUses = MAX_USES - newUses;

    // Enviar los usos restantes en la cabecera para que el frontend lo pueda leer
    res.setHeader('X-Usage-Remaining', remainingUses);
    res.status(200).json({ result: text });

  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    res.status(500).json({ error: 'Falló al procesar la solicitud de la IA.' });
  }
};