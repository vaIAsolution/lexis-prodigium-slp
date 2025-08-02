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
      
      let finalPrompt = query; // Por defecto, el prompt es la consulta que ya viene completa

      // Si la consulta es para un análisis de estrategia, la reescribimos con el prompt de "Socio de Bufete"
      if (query.startsWith("Realiza un análisis de estrategia legal tipo FODA para el siguiente caso:")) {
        const caso = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = `Eres un Asistente Legal de IA de élite, actuando como un Socio del área de Litigio en un bufete de primer nivel en México. Tu cliente necesita un Memorándum de Estrategia Preliminar.

**Instrucciones de Análisis (Precisión Quirúrgica):**

1.  **Identificación de Jurisdicción y Materia:** Analiza el texto del caso para identificar el estado de la República Mexicana y la materia legal (ej. civil, mercantil, penal). Toda tu análisis subsecuente DEBE basarse en el Código o Ley específica de ese estado o materia. Si no se especifica el estado, asume que es la Ciudad de México, pero declara esta suposición explícitamente.

2.  **Identificación del Cuerpo Legal Principal:** Determina cuál es la ley o código principal aplicable al caso (ej. Código Civil para el Estado de San Luis Potosí, Ley General de Títulos y Operaciones de Crédito, Código de Comercio). **Es CRÍTICO que identifiques la ley correcta.** Recuerda que la ley especial prevalece sobre la general (ej. LGTOC sobre Código Civil para títulos de crédito).

3.  **Diagnóstico Jurídico Central:** Identifica y nombra la figura o concepto jurídico más importante del caso (ej. 'Tácita Reconducción', 'Prescripción de la Acción Cambiaria', 'Vicios Ocultos').

4.  **Marco Legal Aplicable (Citas Exactas):** Cita los **artículos específicos y relevantes** de la ley o código identificado en el punto 2 que regulan el concepto central. Explica brevemente qué implican esos artículos en el contexto del caso.

5.  **Análisis Estratégico (FODA):** Procede con el análisis FODA, integrando el marco legal y las citas exactas en tus argumentos. Sé directo, preciso y estratégico.

6.  **Plan de Acción Recomendado:** Proporciona un plan claro y por fases, basado en la ley aplicable y los artículos citados.

Utiliza este marco de pensamiento avanzado para analizar el siguiente caso:
${caso}`;
      }

      console.log('Enviando el siguiente prompt a la IA:', JSON.stringify(finalPrompt, null, 2));

      const result = await model.generateContent(finalPrompt);
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