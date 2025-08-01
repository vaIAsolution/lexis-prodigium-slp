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
      // El archivo no existe, devolver un objeto vacío
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

    const VERIFICATION_GUIDANCE_TEXT = 'Para Verificar esta Información:\\n*   **Leyes Federales (DOF):** Para el Artículo X de la Ley Y, busque en Google o directamente en el buscador del Diario Oficial de la Federación (dof.gob.mx) la frase exacta: \\\'Ley Y Artículo X DOF\\\'.\\n*   **Jurisprudencia (SCJN):** Para jurisprudencia relacionada con [tema específico], utilice el buscador jurídico de la Suprema Corte de Justicia de la Nación (scjn.gob.mx) con la frase: \\\'[palabras clave relevantes] Artículo X Ley Y\\\'.\\n*   **Leyes de San Luis Potosí:** Para leyes locales, visite el sitio web del Congreso del Estado de San Luis Potosí (ej. congresoslp.gob.mx) y use su buscador interno con la frase: \\\'[Nombre de la Ley] Artículo X\\\'.\\n\';';

    const DRUG_QUANTITIES_TABLE = '\n| Narcótico | Dosis máxima de consumo personal e inmediato |\n| :-------------------------------- | :--------------------------------------- |\n| Opio | 2 gr. |\n| Diacetilmorfina o Heroína | 50 mg. |\n| Cannabis Sativa, Indica o Mariguana | 5 gr. |\
| Cocaína | 500 mg. |\n| Lisergida (LSD) | 0.015 mg. |\n| MDMA, dl-3,4-metilendioxi-n-dimetilfeniletilamina (Éxtasis) | 40 mg. (Una unidad con peso no mayor a 200 mg.) |\n| Metanfetamina | 40 mg. (Una unidad con peso no mayor a 200 mg.) |\n| Otros narcóticos | 40 mg. (Una unidad con peso no mayor a 200 mg.) |\n';

    if (query.startsWith("Busca y analiza la siguiente tesis o jurisprudencia:")) {
      prompt = 'Actúa como un experto en jurisprudencia mexicana. Analiza la siguiente solicitud y proporciona un resumen claro, conciso y relevante de la tesis o jurisprudencia, incluyendo su registro, fecha de publicación, hechos relevantes, criterio jurídico y su impacto práctico en el derecho mexicano. Utiliza un formato profesional y fácil de leer, con encabezados y párrafos bien definidos. ' + query;
    } else if (query.startsWith("Realiza un análisis de estrategia legal tipo FODA para el siguiente caso:")) {
      prompt = 'Eres un Asistente Legal de IA de élite para un prestigioso bufete de abogados en México. Tu función principal es **ejecutar la investigación, no solo sugerirla**. Debes ser preciso, rápido y accionable.\n\n' +
               'Realiza un análisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas) para el siguiente caso.\n\n' +
               '**REGLAS OBLIGATORIAS (DEBES CUMPLIRLAS AL 100%):**\n' +
               '1.  **PUNTO DE PARTIDA OBLIGATORIO PARA DROGAS:** Si el caso involucra posesión de narcóticos, tu primer paso **siempre** es analizar la tabla del **Artículo 479 de la Ley General de Salud**. Debes comparar las cantidades del caso con las de la tabla y mencionar explícitamente si la cantidad excede o no el límite legal para posesión simple, y si esto implica competencia federal o estatal, citando el artículo y la ley correspondiente. **UTILIZA LA SIGUIENTE TABLA PARA LAS CANTIDADES Y SÉ EXPLÍCITO EN LA COMPARACIÓN:**\n' +
               DRUG_QUANTITIES_TABLE + '\n' +
               '    **NO PUEDES** decir "revisar las cantidades", debes decir "la cantidad es X y la ley Y en su artículo Z establece que el límite es W, por lo tanto...".\n' +
               '2.  **ANÁLISIS APLICADO Y CUANTITATIVO:** Si el caso depende de datos específicos (gramos, plazos, porcentajes), **DEBES** investigar el dato exacto en la ley y citarlo directamente en el análisis FODA. **NO PUEDES** decir "revisar la ley", debes decir "la ley dice X".\n' +
               '3.  **FUENTES COMPLETAS Y ESPECÍFICAS:** Debes citar **TODAS** las leyes y artículos relevantes, tanto sustantivos (ej. Ley del ISR, Código Civil, Ley General de Salud) como adjetivos (ej. Código Fiscal de la Federación, CNPP). Es **OBLIGATORIO** que cites los números de artículo específicos. **TIENES PROHIBIDO** usar frases como `(especificar artículos)` o `(investigar después)`.\n' +
               '4.  **REFERENCIAS Y VERIFICACIÓN:**\n' +
               '    *   En la sección final **\'Fuentes Consultadas\'**, lista cada ley y artículo citado. Si conoces un enlace directo a una fuente oficial (ej. diputados.gob.mx, dof.gob.mx, scjn.gob.mx) para el artículo específico, formatéalo como un hipervínculo en Markdown.\n' +
               '    *   **Siempre incluye una sección final llamada \'Para Verificar esta Información\'** con instrucciones claras y frases de búsqueda optimizadas para que el usuario pueda encontrar la información en portales oficiales. Esta sección DEBE ser una lista Markdown, siguiendo este formato de ejemplo:\n' +
               '        \\`\\`\\`markdown\n' +
               '        *   **Leyes Federales (DOF):** Para el Artículo X de la Ley Y, busque en Google o directamente en el buscador del Diario Oficial de la Federación (dof.gob.mx) la frase exacta: \'Ley Y Artículo X DOF\'.\n' +
               '        *   **Jurisprudencia (SCJN):** Para jurisprudencia relacionada con [tema específico], utilice el buscador jurídico de la Suprema Corte de Justicia de la Nación (scjn.gob.mx) con la frase: \'[palabras clave relevantes] Artículo X Ley Y\'.\n' +
               '        \\`\\`\\`\n' +
               '    *   **Formato de Enlace (si aplica):** `[Ley del Impuesto Sobre la Renta, Artículo 91](https://www.diputados.gob.mx/LeyesBiblio/pdf/LISR.pdf)`\n' +
               '    *   **Formato de Verificación (si no hay enlace directo):**\n' +
               '        \\`\\`\\`\n' +
               VERIFICATION_GUIDANCE_TEXT + '\n' +
               '        \\`\\`\\`\n\n' +
               '5.  **AUTOCORRECCIÓN FINAL:** Antes de generar la respuesta final, revisa tu propio trabajo. ¿Cumpliste con las 4 reglas anteriores? ¿Citaste los datos de la LGS si aplicaba? ¿Incluiste TODOS los artículos relevantes? ¿Creaste los enlaces? Si no es así, corrige tu borrador antes de presentarlo.\n\n' +
               '**CASO A ANALIZAR:** ' + context + '\n\n' +
               '### Para Verificar esta Información:\n';
    } else if (query.startsWith("Genera un borrador del siguiente documento:")) {
      prompt = 'Actúa como un abogado redactor de documentos legales de alto nivel en México, con la capacidad de interpretar y transformar solicitudes generales en prompts profesionales. Tu objetivo es generar un borrador completo, pulcro, elegante, y legalmente fundamentado del siguiente documento, emulando la calidad y el estilo de los mejores bufetes de abogados en México (como Creel, García-Cuéllar, Aiza y Enríquez; Galicia Abogados; González Calvillo; Mijares, Angoitia, Cortés y Fuentes; Nader, Hayaux & Goebel; Santamarina y Steta; Von Wobeser y Sierra; Basham, Ringe y Correa; Hogan Lovells BSTL; White & Case). Asegúrate de que el lenguaje sea formal, preciso y técnico-jurídico. Incluye secciones claras, numeración progresiva si aplica (ej. "I. HECHOS", "II. DERECHO"), y utiliza un formato que facilite la lectura y comprensión. Si es un contrato, incluye cláusulas esenciales y estructura lógica. Si es una demanda, estructura las partes fundamentales (proemio, prestaciones, hechos, derecho, puntos petitorios) de manera clara y concisa. Simula la inclusión de fundamentos legales relevantes (artículos de ley, jurisprudencia aplicable) en el texto o en notas al pie, indicando la fuente (ej. "Artículo X de la Ley Y", "Jurisprudencia Z"). Adapta el contenido y las referencias legales a la jurisdicción de San Luis Potosí, si los detalles clave lo sugieren. Asegúrate de que el formato sea de fácil lectura, con párrafos bien espaciados, uso adecuado de negritas para destacar puntos clave y sin caracteres extraños. El documento solicitado es: ' + query + '. Detalles clave: ' + context;
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
}; // Force update: 2025-07-31 18:30:00
```