import { GoogleGenerativeAI } from '@google/generative-ai';

// IMPORTANT: This is the standard way to handle API keys in serverless environments.
// The API key is stored as an environment variable, NOT in the code.
export default async (req, res) => {
  try { // Wrap the entire function in a try-catch
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error('GEMINI_API_KEY is not set in environment variables.');
      return res.status(500).json({ error: 'Server configuration error: API Key is missing.' });
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Access the body directly from req, as Vercel parses it for us
  const { query, context } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Enable the web search tool
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    let prompt = ``;

    if (query.startsWith("Busca y analiza la siguiente tesis o jurisprudencia:")) {
      prompt = `Actúa como un Asistente Legal Experto en el marco jurídico de Jalisco, México. Tu tarea es:
1.  Recibir la solicitud de búsqueda de tesis o jurisprudencia.
2.  Realizar una búsqueda web EN TIEMPO REAL en el Semanario Judicial de la Federación (sjf.scjn.gob.mx) y otras fuentes jurídicas mexicanas confiables.
3.  Analizar los resultados y presentar un resumen detallado de la tesis o jurisprudencia más relevante, incluyendo:
    *   **Registro Digital:**
    *   **Instancia:**
    *   **Época:**
    *   **Fuente:**
    *   **Materia(s):**
    *   **Tesis:**
    *   **Criterio Jurídico:**
    *   **Justificación:**
4.  Citar siempre la fuente y el registro digital. La solicitud es: ${query}`;
    } else if (query.startsWith("Realiza un análisis de estrategia legal tipo FODA para el siguiente caso:")) {
      prompt = `Actúa como un Estratega Legal experto en litigios en Jalisco, México. Tu tarea es:
1.  Analizar el caso proporcionado.
2.  Realizar una búsqueda web EN TIEMPO REAL para encontrar leyes, reglamentos y jurisprudencia aplicable del Estado de Jalisco y de la Federación que sean pertinentes.
3.  Basado en la información real y actualizada, generar un análisis FODA (Fortalezas, Oportunidades, Debilidades, Amenazas) para el caso.
4.  Citar todas las fuentes legales (leyes, artículos, jurisprudencia) utilizadas para fundamentar el análisis.
5.  El caso es: ${context}`;
    } else if (query.startsWith("Genera un borrador del siguiente documento:")) {
      prompt = `Actúa como un Abogado Redactor experto en la legislación de Jalisco, México. Tu tarea es:
1.  Analizar la solicitud para generar un documento legal.
2.  Realizar una búsqueda web EN TIEMPO REAL para consultar el Código Civil, Código de Procedimientos Civiles, y otras leyes aplicables del Estado de Jalisco.
3.  Generar un borrador del documento solicitado, que sea completo, formal y fundamentado en la legislación vigente de Jalisco.
4.  El documento debe incluir la estructura correcta (proemio, declaraciones, cláusulas, etc.) y citar los artículos de ley relevantes que sustentan cada parte.
5.  Asegúrate de que el formato sea profesional y claro. La solicitud es: ${query}. Detalles clave: ${context}`;
    } else if (query.startsWith("Revisa el siguiente documento legal:")) {
      prompt = `Actúa como un Revisor Legal Inteligente experto en el marco jurídico de Jalisco, México. Tu tarea es:
1.  Analizar el documento legal proporcionado para identificar:
    *   Inconsistencias o ambigüedades.
    *   Riesgos legales o cláusulas problemáticas.
    *   Áreas de oportunidad para mejorar la redacción o fortalecer la posición legal.
    *   Puntos ciegos o vacíos que puedan generar problemas futuros.
2.  Realizar una búsqueda web EN TIEMPO REAL para validar el contenido del documento contra la legislación vigente (Código Civil, Código de Procedimientos Civiles, leyes especiales) y jurisprudencia relevante del Estado de Jalisco y a nivel federal.
3.  Presentar un informe detallado con los hallazgos, organizados por secciones (ej. "Inconsistencias", "Riesgos Identificados", "Oportunidades de Mejora").
4.  Citar las fuentes legales (artículos, leyes, jurisprudencia) que sustenten tus observaciones.
5.  El documento a revisar es: ${context}`;
    } else if (query.startsWith("Realiza una investigación jurídica sobre:")) {
      prompt = `Actúa como un Asistente de Investigación Jurídica Avanzada experto en el marco jurídico de Jalisco y México. Tu tarea es:
1.  Recibir la pregunta legal o descripción del caso.
2.  Realizar una búsqueda web EN TIEMPO REAL, priorizando fuentes legales oficiales y confiables de México, como el Semanario Judicial de la Federación (sjf.scjn.gob.mx), códigos legales actualizados de Jalisco y federales, y bases de datos jurídicas reconocidas.
3.  Analizar los resultados para proporcionar:
    *   Jurisprudencia y tesis aisladas relevantes.
    *   Artículos de leyes y reglamentos aplicables.
    *   Posibles criterios contradictorios o interpretaciones divergentes sobre el tema.
    *   Un resumen conciso y fundamentado de la información encontrada.
4.  Citar explícitamente todas las fuentes legales utilizadas (Registro Digital, Instancia, Época, Fuente, Materia(s), Tesis, Criterio Jurídico, Justificación para jurisprudencia/tesis; y artículos, leyes, reglamentos para legislación).
5.  La solicitud es: ${query}. Detalles del caso/pregunta: ${context}`;
    } else {
      prompt = `Responde a la siguiente pregunta basándote en información pública y verificable de fuentes legales de México, con especial atención a Jalisco: ${query}`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let citations = [];
    if (response.candidates && response.candidates.length > 0 && response.candidates[0].citationMetadata && response.candidates[0].citationMetadata.citations) {
        citations = response.candidates[0].citationMetadata.citations.map(citation => ({
            uri: citation.uri,
            title: citation.title || citation.uri // Usa el título si está disponible, de lo contrario la URI
        }));
    }

    res.status(200).json({ result: text, citations: citations });

  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: 'Failed to process AI request.' });
  }
  } catch (error) {
    console.error('Global error processing request:', error); // More specific log
    // Ensure this always returns JSON
    res.status(500).json({ error: 'An unexpected server error occurred.', details: error.message });
  }
};
