import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const USAGE_FILE_PATH = path.resolve(process.cwd(), 'usage.json');

// Función para leer el archivo de usos
async function readUsage() {
  try {
    const data = await fs.promises.readFile(USAGE_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error('Error reading usage file:', error);
    return {};
  }
}

// Función para escribir en el archivo de usos
async function writeUsage(usageData) {
  try {
    await fs.promises.writeFile(USAGE_FILE_PATH, JSON.stringify(usageData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing usage file:', error);
  }
}

export default async (req, res) => {
  try {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables.');
      return res.status(500).json({ error: 'Server configuration error: API Key is missing.' });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, context, clientId } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!clientId) {
      return res.status(400).json({ error: 'Client ID is required' });
    }

    const MAX_USES = 5;
    const usageData = await readUsage();
    const currentUses = usageData[clientId] || 0;

    if (currentUses >= MAX_USES) {
      return res.status(403).json({ error: 'Usage limit exceeded. Please contact support.' });
    }

    usageData[clientId] = currentUses + 1;
    await writeUsage(usageData);

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    let prompt = '';

    const DRUG_QUANTITIES_TABLE = `\n| Narcótico | Dosis máxima de consumo personal e inmediato |\n| :-------------------------------- | :--------------------------------------- |\n| Opio | 2 gr. |\n| Diacetilmorfina o Heroína | 50 mg. |\n| Cannabis Sativa, Indica o Mariguana | 5 gr. |\n| Cocaína | 500 mg. |\n| Lisergida (LSD) | 0.015 mg. |\n| MDMA, dl-3,4-metilendioxi-n-dimetilfeniletilamina (Éxtasis) | 40 mg. |\n| Metanfetamina | 40 mg. |\n`;

    if (query.startsWith("Busca y analiza la siguiente tesis o jurisprudencia:")) {
      prompt = 'Actúa como un experto en jurisprudencia mexicana. Analiza la siguiente solicitud y proporciona un resumen claro, conciso y relevante de la tesis o jurisprudencia, incluyendo su registro, fecha de publicación, hechos relevantes, criterio jurídico y su impacto práctico en el derecho mexicano. Utiliza un formato profesional y fácil de leer, con encabezados y párrafos bien definidos. ' + query;
    } else if (query.startsWith("Realiza un análisis de estrategia legal tipo FODA para el siguiente caso:")) {
      prompt = 'Eres un Asistente Legal de IA de élite para un prestigioso bufete de abogados en México. Tu función principal es **ejecutar la investigación, no solo sugerirla**. Debes ser preciso, rápido y accionable.\n\n' +
               'Realiza un análisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas) para el siguiente caso.\n\n' +
               '**REGLAS OBLIGATORIAS (DEBES CUMPLIRLAS AL 100%):**\n' +
               '1.  **PUNTO DE PARTIDA OBLIGATORIO PARA DROGAS:** Si el caso involucra posesión de narcóticos, tu primer paso **siempre** es analizar la tabla del **Artículo 479 de la Ley General de Salud**. Debes comparar las cantidades del caso con las de la tabla y mencionar explícitamente si la cantidad excede o no el límite legal para posesión simple, y si esto implica competencia federal o estatal, citando el artículo y la ley correspondiente. **UTILIZA LA SIGUIENTE TABLA PARA LAS CANTIDADES Y SÉ EXPLÍCITO EN LA COMPARACIÓN:**\n' +
               DRUG_QUANTITIES_TABLE + '\n' +
               '    **NO PUEDES** decir "revisar las cantidades", debes decir "la cantidad es X y la ley Y en su artículo Z establece que el límite es W, por lo tanto...".\n' +
               '2.  **FUENTES COMPLETAS Y VERIFICACIÓN:** Debes citar **TODAS** las leyes y artículos relevantes. En una sección final llamada **"Para Verificar esta Información"**, proporciona frases de búsqueda optimizadas para portales oficiales (DOF, SCJN, etc.) en una lista Markdown. Ejemplo:\n' +
               '    *   Para el Artículo X de la Ley Y, busque en Google: `Ley Y Artículo X DOF`\n' +
               '    *   Para jurisprudencia sobre Z, busque en la SCJN: `Jurisprudencia Z SCJN`\n\n' +
               '**CASO A ANALIZAR:** ' + context + '\n\n';
    } else if (query.startsWith("Genera un borrador del siguiente documento:")) {
      prompt = 'Actúa como un abogado redactor de documentos legales de alto nivel en México. Tu objetivo es generar un borrador completo, pulcro y legalmente fundamentado del siguiente documento. Asegúrate de que el lenguaje sea formal, preciso y técnico-jurídico. Incluye secciones claras y fundamentos legales relevantes. El documento solicitado es: ' + query + '. Detalles clave: ' + context;
    } else {
      prompt = 'Responde a la siguiente pregunta de forma concisa: ' + query;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ result: text });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
};