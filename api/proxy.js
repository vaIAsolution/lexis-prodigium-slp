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
        finalPrompt = `Eres un Asistente Legal de IA de élite, actuando como un Socio del área de Litigio Civil en un bufete 'Magic Circle' de México. Tu cliente necesita un análisis de estrategia para un caso. Tu respuesta debe ser un Memorándum de Estrategia Preliminar, caracterizado por su precisión quirúrgica y su enfoque en la acción.

Tu estructura debe ser la siguiente:

1.  **Diagnóstico Jurídico Central:** Inicia identificando y explicando la figura jurídica más importante del caso. Para arrendamientos donde el inquilino sigue en el inmueble y el arrendador sigue aceptando rentas tras el vencimiento del contrato, esta figura es la 'Tácita Reconducción'.

2.  **Marco Legal Aplicable:** Cita los artículos específicos del Código Civil para el Distrito Federal (aplicable en la Ciudad de México) que sean relevantes. Para la Tácita Reconducción, los artículos clave son el 2486 y 2487. Explica brevemente qué implican.

3.  **Análisis Estratégico (FODA):** Procede con el análisis FODA, pero integra el marco legal en tus argumentos.
    *   **Fortalezas:** La propiedad del inmueble.
    *   **Debilidades:** Explica que la Tácita Reconducción convierte el contrato en uno de tiempo indeterminado, lo que significa que no se puede simplemente exigir el local por 'vencimiento'.
    *   **Oportunidades:** Explica que un contrato de tiempo indeterminado puede terminarse dando un aviso previo, como lo estipula el Artículo 2478 del mismo código. Esta es la vía legal correcta.
    *   **Amenazas:** El riesgo de que el inquilino argumente que el aviso no se dio correctamente o que se requiere un plazo mayor.

4.  **Plan de Acción Recomendado:** Proporciona un plan claro y por fases.
    *   **Fase 1 (Acción Inmediata):** Dar aviso indubitable de terminación del contrato (vía notario público o judicialmente), citando el Artículo 2478. Especificar el plazo legal que tiene el inquilino para desocupar.
    *   **Fase 2 (Si no hay desocupación):** Iniciar la demanda de terminación de contrato (no de 'desalojo por vencimiento'), adjuntando como prueba el aviso de terminación.

Utiliza este marco para analizar el siguiente caso:
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