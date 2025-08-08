import { GoogleGenerativeAI } from '@google/generative-ai';
<<<<<<< HEAD
import { PROMPTS } from './prompts.js';
import { ERROR_MESSAGES } from './errorMessages.js';

// --- Corpus Legal Estratégico de San Luis Potosí (para demo RAG) ---
const sanLuisPotosiLegalCorpus = [
  // --- Código Civil para el Estado de San Luis Potosí (CCSLP) ---
  {
    id: 'ccslp-2107',
    text: 'Artículo 2107.- La facultad de resolver las obligaciones se entiende implícita en las recíprocas, para el caso de que uno de los obligados no cumpliere lo que le incumbe. El perjudicado podrá escoger entre exigir el cumplimiento o la resolución de la obligación, con el resarcimiento de daños y perjuicios en ambos casos. También podrá pedir la resolución aun después de haber optado por el cumplimiento, cuando éste resultare imposible.',
    source: 'Código Civil para el Estado de San Luis Potosí, Art. 2107'
  },
  {
    id: 'ccslp-1677',
    text: 'Artículo 1677.- Convenio es el acuerdo de dos o más personas para crear, transferir, modificar o extinguir obligaciones.',
    source: 'Código Civil para el Estado de San Luis Potosí, Art. 1677'
  },
  {
    id: 'ccslp-1678',
    text: 'Artículo 1678.- Los convenios que producen o transfieren las obligaciones y derechos, toman el nombre de contratos.',
    source: 'Código Civil para el Estado de San Luis Potosí, Art. 1678'
  },

  // --- Código Familiar para el Estado de San Luis Potosí (CFSLP) ---
  {
    id: 'cfslp-86',
    text: 'Artículo 86.- El divorcio incausado podrá solicitarse por cualquiera de los cónyuges, o por ambos, ante la autoridad judicial competente, mediante la presentación de la solicitud y propuesta de convenio que regule las consecuencias jurídicas de la disolución del vínculo matrimonial.',
    source: 'Código Familiar para el Estado de San Luis Potosí, Art. 86'
  },
  {
    id: 'cfslp-100',
    text: 'Artículo 100.- El divorcio incausado disuelve el vínculo del matrimonio y deja a los que fueron cónyuges en aptitud de contraer otro. No se requiere expresar causa alguna para solicitarlo.',
    source: 'Código Familiar para el Estado de San Luis Potosí, Art. 100'
  },
  {
    id: 'cfslp-143',
    text: 'Artículo 143.- Los cónyuges y los concubinos, están obligados a darse alimentos de forma recíproca. La ley determinará cuándo queda subsistente esta obligación en los casos de divorcio, y otras situaciones.',
    source: 'Código Familiar para el Estado de San Luis Potosí, Art. 143'
  },

  // --- Ley de Procedimiento Administrativo del Estado de SLP (LPA SLP) ---
  {
    id: 'lpaslp-1',
    text: 'Artículo 1. Las disposiciones de esta Ley son de orden público y tienen por objeto regular los actos, procedimientos y resoluciones de la Administración Pública del Estado, así como de los organismos descentralizados de la administración pública paraestatal.',
    source: 'Ley de Procedimiento Administrativo del Estado de San Luis Potosí, Art. 1'
  },

  // --- Código de Comercio (Federal, pero de alta aplicación) ---
  {
    id: 'cco-78',
    text: 'Artículo 78. En las convenciones mercantiles cada uno se obliga en la manera y términos que aparezca que quiso obligarse, sin que la validez del acto comercial dependa de la observancia de formalidades o requisitos determinados.',
    source: 'Código de Comercio, Art. 78'
  },
  {
    id: 'cco-81',
    text: 'Artículo 81. Las obligaciones que no tuvieren término prefijado por las partes o por las disposiciones de este Código, serán exigibles a los diez días después de contraídas, si sólo produjeren acción ordinaria, y al día inmediato si llevaren aparejada ejecución.',
    source: 'Código de Comercio, Art. 81'
  },
  {
    id: 'cco-88',
    text: 'Artículo 88. En el contrato mercantil en que se fijare pena de indemnización contra el que no lo cumpliere, la parte perjudicada podrá exigir el cumplimiento del contrato o la pena prescrita; pero utilizando una de estas dos acciones, quedará extinguida la otra.',
    source: 'Código de Comercio, Art. 88'
  }
];

// Función de recuperación de contexto (aún simplificada, pero funcional para la demo)
function retrieveRelevantContext(query, corpus, numResults = 3) {
  const lowerCaseQuery = query.toLowerCase();
  // Prioriza términos clave para SLP
  const keywords = ['san luis potosí', 'slp', 'potosina', 'potosino', 'contrato', 'divorcio', 'alimentos', 'multa', 'demanda', 'mercantil', 'civil', 'familiar'];
  
  const relevantDocs = corpus.filter(doc => {
    const lowerCaseText = doc.text.toLowerCase();
    const lowerCaseSource = doc.source.toLowerCase();
    // Verifica si alguna palabra clave o la fuente relevante está en la consulta
    return keywords.some(key => lowerCaseQuery.includes(key)) && (keywords.some(key => lowerCaseText.includes(key)) || lowerCaseSource.includes('san luis potosí'));
  });

  // Si no hay coincidencias por palabra clave, hacer una búsqueda más general
  if (relevantDocs.length === 0) {
    return corpus.filter(doc => doc.text.toLowerCase().includes(lowerCaseQuery.substring(0, 20))).slice(0, numResults);
  }

  return relevantDocs.slice(0, numResults);
}
=======
import { kv } from '@vercel/kv';
import { PROMPTS } from './prompts.js';
import { ERROR_MESSAGES } from './errorMessages.js';
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059


export default async (req, res) => {
  try {
<<<<<<< HEAD
=======
    // Define el número máximo de usos permitidos para la demo por IP.
    const DEMO_MAX_USES_PER_IP = 5;

>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
    // --- 1. Validar Clave de API ---
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY no está configurada.');
      return res.status(500).json({ error: ERROR_MESSAGES.API_KEY_MISSING });
    }

<<<<<<< HEAD
    // --- Manejar solicitud POST (único método permitido) ---
=======
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
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
    if (req.method !== 'POST') {
      return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
    }
    
<<<<<<< HEAD
    const { query } = req.body;
=======
    // --- Log para depuración ---
    console.log(`[${new Date().toISOString()}] POST /api/proxy - Solicitud recibida. IP: ${ip}`);
    console.log(`[${new Date().toISOString()}] POST /api/proxy - Cuerpo de la solicitud: ${JSON.stringify(req.body, null, 2)}`);

    const { query, context } = req.body;
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
    if (!query) {
      console.error('Error: La consulta (query) está vacía o no definida.');
      return res.status(400).json({ error: ERROR_MESSAGES.QUERY_REQUIRED });
    }

<<<<<<< HEAD
    // --- 2. Procesar la solicitud a la IA ---
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      let finalPrompt;
      let sources = [];

      // --- Lógica de Selección de Prompt ---
      // Elige el prompt más adecuado basado en palabras clave en la consulta del usuario.
      if (query.toLowerCase().includes("análisis de estrategia") || query.toLowerCase().includes("foda")) {
        const caso = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.ANALISIS_ESTRATEGIA_LEGAL(caso);
      } else if (query.toLowerCase().includes("analiza el siguiente contrato")) {
        const contrato = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.ANALISIS_CONTRATO(contrato);
      } else if (query.toLowerCase().includes("genera un borrador de escrito procesal")) {
        const detalles = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.GENERAR_ESCRITO_PROCESAL(detalles);
      } else if (query.toLowerCase().includes("perfil estratégico del abogado") || query.toLowerCase().includes("perfil del juez")) {
        const texto = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.ANALISIS_PERFIL_ACTOR_LEGAL(texto);
      } else if (query.toLowerCase().includes("genera un borrador de documento legal")) {
        const detalles = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = PROMPTS.GENERAR_DOCUMENTO_LEGAL_GENERAL(detalles);
      } else {
        // --- Integración RAG para consultas generales ---
        const relevantDocs = retrieveRelevantContext(query, sanLuisPotosiLegalCorpus);
        let ragContext = '';
        if (relevantDocs.length > 0) {
            sources = relevantDocs.map(doc => doc.source);
            ragContext = '\n\n--- Contexto Legal Relevante de San Luis Potosí ---\n';
            relevantDocs.forEach(doc => {
                ragContext += `- [${doc.source}] ${doc.text}\n`;
            });
            ragContext += '----------------------------------------------------\n\n';
        }
        // Para una consulta general, se combina el RAG con el prompt de análisis de estrategia como base.
        finalPrompt = PROMPTS.ANALISIS_ESTRATEGIA_LEGAL(query + ragContext);
      }

      console.log(`[${new Date().toISOString()}] POST /api/proxy - Llamando al modelo de IA.`);
      
=======
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
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      const text = response.text();

<<<<<<< HEAD
      // --- 3. Enviar el resultado ---
      console.log(`[${new Date().toISOString()}] POST /api/proxy - Respuesta exitosa de IA enviada al cliente.`);
      return res.status(200).json({ result: text, sources: sources });
=======
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
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059

    } catch (e) {
      console.error('ERROR CRÍTICO DENTRO DEL BLOQUE DE IA:', e);
      return res.status(500).json({ error: ERROR_MESSAGES.AI_COMMUNICATION_ERROR(e.message) });
    }

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ERROR GENERAL:`, error);
    res.status(500).json({ error: ERROR_MESSAGES.UNKNOWN_ERROR });
  }
};