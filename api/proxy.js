import { GoogleGenerativeAI } from '@google/generative-ai';
import { kv } from '@vercel/kv';

// --- Corpus Legal Simplificado de Jalisco (para demo RAG) ---
const jaliscoLegalCorpus = [
  {
    id: 'ccj-1',
    text: 'Artículo 1. El Código Civil del Estado de Jalisco rige las relaciones jurídicas de carácter civil en el estado de Jalisco.',
    source: 'Código Civil del Estado de Jalisco, Art. 1'
  },
  {
    id: 'ccj-404',
    text: 'Artículo 404. El divorcio disuelve el vínculo del matrimonio y deja a los cónyuges en aptitud de contraer otro.',
    source: 'Código Civil del Estado de Jalisco, Art. 404'
  },
  {
    id: 'ccj-407',
    text: 'Artículo 407. Son causas de divorcio: I. El adulterio debidamente probado de uno de los cónyuges; II. El hecho de que uno de los cónyuges padezca una enfermedad crónica e incurable, que sea además contagiosa o hereditaria, y que ponga en peligro la vida del otro cónyuge o de los hijos; III. La separación de los cónyuges por más de dos años, independientemente del motivo que la haya originado, si ambos convienen en ella; IV. La violencia intrafamiliar; V. El incumplimiento injustificado de las obligaciones alimentarias.',
    source: 'Código Civil del Estado de Jalisco, Art. 407'
  },
  {
    id: 'ccj-1792',
    text: 'Artículo 1792. Convenio es el acuerdo de dos o más personas para crear, transferir, modificar o extinguir obligaciones.',
    source: 'Código Civil del Estado de Jalisco, Art. 1792'
  },
  {
    id: 'ccj-1793',
    text: 'Artículo 1793. Los contratos son convenios que producen o transfieren las obligaciones y derechos.',
    source: 'Código Civil del Estado de Jalisco, Art. 1793'
  },
  {
    id: 'ccj-1832',
    text: 'Artículo 1832. En los contratos civiles cada uno se obliga en la manera y términos que aparezca que quiso obligarse, sin que para la validez del acto se requieran formalidades determinadas, fuera de los casos expresamente designados por la ley.',
    source: 'Código Civil del Estado de Jalisco, Art. 1832'
  },
  {
    id: 'ccj-2027',
    text: 'Artículo 2027. El que estuviere obligado a prestar alimentos los dará en la forma y términos que disponga la ley.',
    source: 'Código Civil del Estado de Jalisco, Art. 2027'
  },
  {
    id: 'ccj-2028',
    text: 'Artículo 2028. La obligación de dar alimentos es recíproca.',
    source: 'Código Civil del Estado de Jalisco, Art. 2028'
  },
  {
    id: 'ccj-2029',
    text: 'Artículo 2029. Los cónyuges están obligados a darse alimentos.',
    source: 'Código Civil del Estado de Jalisco, Art. 2029'
  },
  {
    id: 'ccj-2030',
    text: 'Artículo 2030. Los hijos están obligados a dar alimentos a sus padres.',
    source: 'Código Civil del Estado de Jalisco, Art. 2030'
  },
  {
    id: 'ccj-2031',
    text: 'Artículo 2031. Los padres están obligados a dar alimentos a sus hijos.',
    source: 'Código Civil del Estado de Jalisco, Art. 2031'
  },
  {
    id: 'ccj-2032',
    text: 'Artículo 2032. La obligación de dar alimentos comprende la comida, el vestido, la habitación, la asistencia médica y hospitalaria. Respecto de los menores, comprende además los gastos necesarios para la educación primaria y secundaria, y para proporcionarle algún oficio, arte o profesión honestos y adecuados a sus aptitudes y circunstancias personales.',
    source: 'Código Civil del Estado de Jalisco, Art. 2032'
  },
  {
    id: 'ccj-2033',
    text: 'Artículo 2033. Los alimentos serán proporcionados a las posibilidades del que debe darlos y a las necesidades de quien debe recibirlos.',
    source: 'Código Civil del Estado de Jalisco, Art. 2033'
  },
  {
    id: 'ccj-2034',
    text: 'Artículo 2034. La pensión alimenticia se fijará por convenio o sentencia.',
    source: 'Código Civil del Estado de Jalisco, Art. 2034'
  },
  {
    id: 'lmtej-1',
    text: 'Artículo 1. La presente Ley es de orden público e interés social y tiene por objeto regular la movilidad y el transporte en el Estado de Jalisco.',
    source: 'Ley de Movilidad y Transporte del Estado de Jalisco, Art. 1'
  },
  {
    id: 'lmtej-2',
    text: 'Artículo 2. Para los efectos de esta Ley se entenderá por: I. Accidente de tránsito: Evento súbito, fortuito o no, en el que interviene al menos un vehículo en movimiento, que causa daños a personas o bienes; II. Agente de movilidad: Servidor público facultado para aplicar la presente Ley y sus reglamentos; III. Alcoholímetro: Aparato para medir el nivel de alcohol en el aire espirado; IV. Concesión: Acto administrativo por el cual el Estado otorga a particulares el derecho de prestar un servicio público de transporte; V. Conductor: Persona que maneja un vehículo; VI. Licencia de conducir: Documento oficial que acredita la aptitud de una persona para conducir un vehículo; VII. Movilidad: Derecho de las personas a desplazarse libremente y con seguridad en el territorio del Estado; VIII. Peatón: Persona que transita a pie; IX. Permiso: Autorización temporal para prestar un servicio de transporte; X. Reglamento: El Reglamento de la presente Ley; XI. Servicio público de transporte: Aquel que se presta a la colectividad en general, mediante el pago de una tarifa autorizada; XII. Vehículo: Todo medio de transporte terrestre.',
    source: 'Ley de Movilidad y Transporte del Estado de Jalisco, Art. 2'
  },
  {
    id: 'lmtej-186',
    text: 'Artículo 186. Se prohíbe conducir vehículos bajo el influjo de bebidas alcohólicas, estupefacientes o psicotrópicos.',
    source: 'Ley de Movilidad y Transporte del Estado de Jalisco, Art. 186'
  },
  {
    id: 'lmtej-187',
    text: 'Artículo 187. Los conductores de vehículos que sean detectados conduciendo bajo el influjo de bebidas alcohólicas serán sancionados con multa y arresto administrativo, de conformidad con lo dispuesto en esta Ley y su Reglamento.',
    source: 'Ley de Movilidad y Transporte del Estado de Jalisco, Art. 187'
  },
  {
    id: 'ccf-1792',
    text: 'Artículo 1792. Convenio es el acuerdo de dos o más personas para crear, transferir, modificar o extinguir obligaciones.',
    source: 'Código Civil Federal, Art. 1792'
  },
  {
    id: 'ccf-1793',
    text: 'Artículo 1793. Los contratos son convenios que producen o transfieren las obligaciones y derechos.',
    source: 'Código Civil Federal, Art. 1793'
  },
  {
    id: 'ccf-1832',
    text: 'Artículo 1832. En los contratos civiles cada uno se obliga en la manera y términos que aparezca que quiso obligarse, sin que para la validez del acto se requieran formalidades determinadas, fuera de los casos expresamente designados por la ley.',
    source: 'Código Civil Federal, Art. 1832'
  },
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
    id: 'cco-83',
    text: 'Artículo 83. Las obligaciones que no tuvieren término prefijado por las partes o por las disposiciones de este Código, serán exigibles a los diez días después de contraídas, si sólo produjeren acción ordinaria, y al día inmediato si llevaren aparejada ejecución.',
    source: 'Código de Comercio, Art. 83'
  },
  {
    id: 'cco-88',
    text: 'Artículo 88. En el contrato mercantil en que se fijare pena de indemnización contra el que no lo cumpliere, la parte perjudicada podrá exigir el cumplimiento del contrato o la pena prescrita; pero utilizando una de estas dos acciones, quedará extinguida la otra.',
    source: 'Código de Comercio, Art. 88'
  },
  {
    id: 'cco-89',
    text: 'Artículo 89. La cláusula penal no podrá exceder ni en valor ni en cuantía a la obligación principal.',
    source: 'Código de Comercio, Art. 89'
  }
];

// Función de recuperación simplificada
function retrieveRelevantContext(query, corpus, numResults = 3) {
  const relevantDocs = [];
  const lowerCaseQuery = query.toLowerCase();

  for (const doc of corpus) {
    if (lowerCaseQuery.includes('jalisco') && doc.source.includes('Jalisco')) {
      // Prioritize Jalisco documents if query mentions Jalisco
      if (lowerCaseQuery.includes(doc.text.toLowerCase().substring(0, 50))) { // Simple keyword match
        relevantDocs.push(doc);
      }
    } else if (!lowerCaseQuery.includes('jalisco') && !doc.source.includes('Jalisco')) {
      // Include federal/general documents if Jalisco is not specified
      if (lowerCaseQuery.includes(doc.text.toLowerCase().substring(0, 50))) { // Simple keyword match
        relevantDocs.push(doc);
      }
    } else if (lowerCaseQuery.includes('contrato') && (doc.source.includes('Código Civil') || doc.source.includes('Código de Comercio'))) {
      relevantDocs.push(doc);
    } else if (lowerCaseQuery.includes('divorcio') && doc.source.includes('Código Civil del Estado de Jalisco')) {
      relevantDocs.push(doc);
    } else if (lowerCaseQuery.includes('alimentos') && doc.source.includes('Código Civil del Estado de Jalisco')) {
      relevantDocs.push(doc);
    } else if (lowerCaseQuery.includes('movilidad') && doc.source.includes('Ley de Movilidad y Transporte del Estado de Jalisco')) {
      relevantDocs.push(doc);
    }
  }

  // Simple sorting by relevance (more matches = more relevant)
  relevantDocs.sort((a, b) => {
    const aMatches = (a.text.toLowerCase().match(new RegExp(lowerCaseQuery.split(' ').join('|'), 'g')) || []).length;
    const bMatches = (b.text.toLowerCase().match(new RegExp(lowerCaseQuery.split(' ').join('|'), 'g')) || []).length;
    return bMatches - aMatches;
  });

  return relevantDocs.slice(0, numResults);
}

export default async (req, res) => {
  try {
    

    // --- 1. Validar Clave de API ---
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      console.error('GEMINI_API_KEY no está configurada.');
      return res.status(500).json({ error: 'Error de configuración del servidor: Falta la clave de API.' });
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

    

    // --- 4. Procesar la solicitud a la IA ---
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      let finalPrompt = query; // Por defecto, el prompt es la consulta que ya viene completa

      // --- Integración RAG: Recuperar contexto relevante ---
      const relevantDocs = retrieveRelevantContext(query, jaliscoLegalCorpus);
      let ragContext = '';
      if (relevantDocs.length > 0) {
        ragContext = '\n\nContexto Legal Relevante:\n';
        relevantDocs.forEach(doc => {
          ragContext += `- [${doc.source}] ${doc.text}\n`;
        });
      }
      finalPrompt = `${ragContext}\n${finalPrompt}`;

      // Si la consulta es para un análisis de estrategia, la reescribimos con el prompt de "Socio de Bufete"
      // Si el contexto es un placeholder de archivo no procesado, ajustar el prompt
      if (context && context.includes('[CONTENIDO DE ARCHIVO') && context.includes('- REQUIERE PROCESAMIENTO EN BACKEND]')) {
        const fileName = context.match(/\ \[CONTENIDO DE ARCHIVO (.*?)\s*- REQUIERE PROCESAMIENTO EN BACKEND\]/)[1];
        finalPrompt = `Has recibido una solicitud para analizar el documento '${fileName}'. Para esta versión demo, no podemos procesar directamente archivos PDF/DOCX. Por favor, pide al usuario que pegue el contenido del documento directamente en el área de texto para que puedas realizar el análisis. Una vez que el usuario pegue el contenido, procede con el análisis solicitado.`;
      } else if (type === 'strategy') {
        const caso = query;
        finalPrompt = `Eres un Asistente Legal de IA de élite, actuando como un Socio del área de Litigio en un bufete de primer nivel en México. Tu cliente necesita un Memorándum de Estrategia Preliminar enfocado 100% en la legislación del estado de Jalisco (o federal, si aplica).

**Instrucciones de Análisis (Precisión Quirúrgica y Actualizada para Jalisco):**

1.  **Identificación de Jurisdicción y Materia:** Analiza el caso para identificar si la materia es civil, mercantil, familiar, administrativa, etc. **Asume siempre que el caso se desarrolla en Jalisco.** Todo tu análisis debe basarse en la legislación de Jalisco o la legislación federal aplicable.

2.  **Identificación del Cuerpo Legal Principal (Regla de Oro):**
    *   **Para Casos Mercantiles (Contratos entre empresas, pagarés, cheques, etc.):** **Utiliza SIEMPRE el Código de Comercio (federal)** como ley principal. Como ley supletoria, usa el Código Civil Federal. **NUNCA cites un Código Civil estatal para un asunto mercantil.**
    *   **Para Casos Familiares (Divorcio, alimentos, custodia):** Utiliza el **Código Civil del Estado de Jalisco** y el **Código de Procedimientos Civiles del Estado de Jalisco**.
    *   **Para Casos Civiles (Arrendamiento, compraventa entre particulares, etc.):** Utiliza el **Código Civil del Estado de Jalisco**.
    *   **Para Casos Administrativos (Multas, clausuras):** Utiliza la **Ley del Procedimiento Administrativo del Estado de Jalisco**. Si se trata de una multa de tránsito, identifica la ley estatal y reconoce si se necesita un reglamento municipal específico.
    *   **Leyes Federales Especiales:** Para temas como propiedad industrial, delitos fiscales o delincuencia organizada, identifica y utiliza la ley federal específica (ej. Ley de la Propiedad Industrial, Código Fiscal de la Federación, etc.).

3.  **Diagnóstico Jurídico Central:** Identifica y nombra la figura jurídica clave del caso (ej. 'Incumplimiento de Contrato de Prestación de Servicios Profesionales', 'Divorcio por Mutuo Consentimiento', 'Juicio de Nulidad contra Multa de Tránsito', 'Acción Cambiaria Directa').

4.  **Marco Legal Aplicable (Citas Exactas y Específicas de Jalisco/Federal):** Cita los **artículos específicos y relevantes** de la ley correcta. Explica brevemente su implicación en el caso. **Formatea cada cita así: [Art. X LEY_ABREVIADA].**
    *   **Para Contratos Mercantiles:** Cita artículos clave del **Código de Comercio** como el [Art. 78 CCo] (formalidades), [Art. 81 CCo] (obligaciones), [Art. 83 CCo] (incumplimiento), y si hay cláusula penal, los [Art. 88 y 89 CCo].
    *   **Para Divorcio en Jalisco:** Cita artículos del **Código Civil del Estado de Jalisco** (ej. [Art. 404 CCJ], [Art. 407 CCJ]). Presta especial atención a los criterios para **pensión compensatoria** y **guarda y custodia de menores**, profundizando en los requisitos y pruebas necesarias según la ley y la jurisprudencia aplicable en Jalisco.
    *   **Para Multas de Tránsito en Jalisco:** Cita la **Ley de Movilidad y Transporte del Estado de Jalisco**.

5.  **Análisis Estratégico (FODA):** Procede con el análisis FODA, integrando las citas legales correctas en tus argumentos. Sé directo, preciso y estratégico, pensando como un abogado litigante en Jalisco.

6.  **Plan de Acción Recomendado (Precisión Procesal en Jalisco):** Proporciona un plan claro y por fases.
    *   **Para materia mercantil:** La vía es el **Juicio Oral Mercantil** o **Ejecutivo Mercantil**, según corresponda, ante los **Juzgados de lo Mercantil del Primer Partido Judicial del Estado de Jalisco**.
    *   **Para materia familiar:** La vía es el **Juicio Oral Familiar** ante los **Juzgados Familiares en Jalisco**. Menciona las posibles vías de apremio o incidentes de ejecución.
    *   **Para materia administrativa (multas de tránsito):** La vía es el **Juicio de Nulidad** ante el **Tribunal de Justicia Administrativa del Estado de Jalisco**. Si no tienes el dato del reglamento municipal específico, **guía proactivamente al usuario**: "Para una defensa completa, es indispensable revisar el Reglamento de Movilidad y Transporte del municipio específico (ej. Guadalajara, Zapopan) donde ocurrió la infracción. Puede consultarlo en el sitio web oficial del Ayuntamiento o en la Gaceta Municipal de Jalisco."

Utiliza este marco de pensamiento avanzado para analizar el siguiente caso:
${caso}`;
      } else if (type === 'contratos') {
        const contrato = query;
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en derecho contractual en Jalisco. Tu tarea es analizar el siguiente texto de contrato e identificar posibles riesgos legales, cláusulas abusivas, ambigüedades o puntos débiles, siempre bajo la legislación del Estado de Jalisco y la legislación federal aplicable.

**Instrucciones de Análisis de Contratos (Precisión Quirúrgica para Jalisco):**

1.  **Identificación de Tipo de Contrato y Partes:** Determina el tipo de contrato (ej. compraventa, arrendamiento, prestación de servicios, mercantil, civil) y las partes involucradas.

2.  **Marco Legal Aplicable:** Identifica las leyes de Jalisco (ej. Código Civil del Estado de Jalisco, Código de Comercio si es mercantil) y/o leyes federales aplicables al tipo de contrato.

3.  **Análisis de Cláusulas Clave:** Revisa las cláusulas esenciales (objeto, precio, plazos, obligaciones, penalizaciones, rescisión, jurisdicción) y señala cualquier inconsistencia o riesgo.

4.  **Identificación de Riesgos y Puntos Débiles:**
    *   **Cláusulas Abusivas:** Señala cualquier cláusula que pueda ser considerada leonina o desproporcionada bajo la ley de Jalisco.
    *   **Ambigüedades:** Identifica redacciones poco claras que puedan dar lugar a interpretaciones diversas.
    *   **Omisiones:** Detecta la ausencia de cláusulas importantes que deberían estar presentes para proteger los intereses de tu cliente.
    *   **Incumplimiento Normativo:** Verifica si el contrato cumple con los requisitos formales y sustantivos de la legislación de Jalisco.

5.  **Recomendaciones:** Ofrece recomendaciones claras para mitigar los riesgos identificados o para mejorar la redacción del contrato.

**NOTA IMPORTANTE:** Esta es una versión demo. En la versión completa de LEXIS PRODIGIUM, podrás subir documentos completos para un análisis exhaustivo. Por ahora, por favor, pega el texto relevante del contrato directamente en tu consulta.

Analiza el siguiente contrato:
${contrato}`;
      } else if (type === 'document') {
        const detalles = context;
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en la redacción de documentos legales generales y procesales para el estado de Jalisco. Tu tarea es generar un borrador de documento legal basado en los detalles proporcionados. Asegúrate de que el documento sea formal, claro, conciso y cumpla con los requisitos generales de un documento legal, haciendo referencia a la legislación de Jalisco cuando sea pertinente.

**Instrucciones para la Generación de Documentos Legales (Jalisco):**

1.  **Identificación del Tipo de Documento:** Determina el tipo de documento (ej. Demanda inicial de divorcio incausado en Jalisco, Carta Poder Simple, Contrato de Arrendamiento Simple en Jalisco, Aviso de Privacidad, Acta Constitutiva Simplificada, etc.).
2.  **Partes Involucradas:** Si aplica, identifica a las partes involucradas.
3.  **Objeto del Documento:** Describe claramente el propósito del documento.
4.  **Cláusulas o Puntos Clave:** Redacta las cláusulas o puntos esenciales que debe contener el documento, haciendo referencia a la legislación de Jalisco (ej. Código Civil de Jalisco, Código de Procedimientos Civiles de Jalisco) cuando sea aplicable.
5.  **Fundamentación Legal (si aplica):** Menciona brevemente la base legal del documento, priorizando la legislación de Jalisco.
6.  **Formato y Estructura:** Asegura un formato y estructura adecuados para el tipo de documento legal en Jalisco.

**NOTA IMPORTANTE:** Esta es una versión demo. En la versión completa de LEXIS PRODIGIUM, podrás generar documentos más complejos y personalizados. Por ahora, por favor, proporciona todos los detalles necesarios en tu consulta.

Genera un borrador de documento legal general: ${query}. Detalles clave: ${detalles}`;
      } else if (type === 'perfiles') {
        const caso = query;
        finalPrompt = `Genera un perfil estratégico del abogado o juez a partir del siguiente texto, identificando su estilo, argumentos recurrentes y patrones de decisión. Enfócate en la materia legal y la jurisdicción de Jalisco si es posible:

${caso}`;
      } else {
        // Fallback for unknown types or direct queries without a specific type
        finalPrompt = query;
      }
        const caso = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = `Eres un Asistente Legal de IA de élite, actuando como un Socio del área de Litigio en un bufete de primer nivel en México. Tu cliente necesita un Memorándum de Estrategia Preliminar enfocado 100% en la legislación del estado de San Luis Potosí (o federal, si aplica).

**Instrucciones de Análisis (Precisión Quirúrgica y Actualizada para San Luis Potosí):**

1.  **Identificación de Jurisdicción y Materia:** Analiza el caso para identificar si la materia es civil, mercantil, familiar, administrativa, etc. **Asume siempre que el caso se desarrolla en San Luis Potosí.** Toda tu análisis debe basarse en la legislación de San Luis Potosí o la legislación federal aplicable.

2.  **Identificación del Cuerpo Legal Principal (Regla de Oro):**
    *   **Para Casos Mercantiles (Contratos entre empresas, pagarés, cheques, etc.):** **Utiliza SIEMPRE el Código de Comercio (federal)** como ley principal. Como ley supletoria, usa el Código Civil Federal. **NUNCA cites un Código Civil estatal para un asunto mercantil.**
    *   **Para Casos Familiares (Divorcio, alimentos, custodia):** Utiliza el **Código Familiar para el Estado de San Luis Potosí** y el **Código de Procedimientos Civiles para el Estado de San Luis Potosí**.
    *   **Para Casos Civiles (Arrendamiento, compraventa entre particulares, etc.):** Utiliza el **Código Civil para el Estado de San Luis Potosí**.
    *   **Para Casos Administrativos (Multas, clausuras):** Utiliza la **Ley de Procedimiento Administrativo del Estado de San Luis Potosí**. Si se trata de una multa de tránsito, identifica la ley estatal y reconoce si se necesita un reglamento municipal específico.
    *   **Leyes Federales Especiales:** Para temas como propiedad industrial, delitos fiscales o delincuencia organizada, identifica y utiliza la ley federal específica (ej. Ley de la Propiedad Industrial, Código Fiscal de la Federación, etc.).

3.  **Diagnóstico Jurídico Central:** Identifica y nombra la figura jurídica clave del caso (ej. 'Incumplimiento de Contrato de Prestación de Servicios Profesionales', 'Divorcio por Mutuo Consentimiento', 'Juicio de Nulidad contra Multa de Tránsito', 'Acción Cambiaria Directa').

4.  **Marco Legal Aplicable (Citas Exactas y Específicas de San Luis Potosí/Federal):** Cita los **artículos específicos y relevantes** de la ley correcta. Explica brevemente su implicación en el caso. **Formatea cada cita así: [Art. X LEY_ABREVIADA].**
    *   **Para Contratos Mercantiles:** Cita artículos clave del **Código de Comercio** como el [Art. 78 CCo] (formalidades), [Art. 81 CCo] (obligaciones), [Art. 83 CCo] (incumplimiento), y si hay cláusula penal, los [Art. 88 y 89 CCo].
    *   **Para Divorcio en San Luis Potosí:** Cita artículos del **Código Familiar para el Estado de San Luis Potosí** (ej. [Art. 86 CF SLP], [Art. 100 CF SLP]). Presta especial atención a los criterios para **pensión compensatoria** y **guarda y custodia de menores**, profundizando en los requisitos y pruebas necesarias según la ley y la jurisprudencia aplicable en San Luis Potosí.
    *   **Para Multas de Tránsito en San Luis Potosí:** Cita la **Ley de Tránsito del Estado de San Luis Potosí**.

5.  **Análisis Estratégico (FODA):** Procede con el análisis FODA, integrando las citas legales correctas en tus argumentos. Sé directo, preciso y estratégico, pensando como un abogado litigante en San Luis Potosí.

6.  **Plan de Acción Recomendado (Precisión Procesal en San Luis Potosí):** Proporciona un plan claro y por fases.
    *   **Para materia mercantil:** La vía es el **Juicio Oral Mercantil** o **Ejecutivo Mercantil**, según corresponda, ante los **Juzgados de lo Mercantil del Primer Distrito Judicial del Estado de San Luis Potosí**.
    *   **Para materia familiar:** La vía es el **Juicio Oral Familiar** ante los **Juzgados Familiares en San Luis Potosí**. Menciona las posibles vías de apremio o incidentes de ejecución.
    *   **Para materia administrativa (multas de tránsito):** La vía es el **Juicio de Nulidad** ante el **Tribunal Estatal de Justicia Administrativa de San Luis Potosí**. Si no tienes el dato del reglamento municipal específico, **guía proactivamente al usuario**: "Para una defensa completa, es indispensable revisar el Reglamento de Tránsito del municipio específico (ej. San Luis Potosí, Soledad de Graciano Sánchez) donde ocurrió la infracción. Puede consultarlo en el sitio web oficial del Ayuntamiento o en la Gaceta Municipal de San Luis Potosí."

Utiliza este marco de pensamiento avanzado para analizar el siguiente caso:
${caso}`;
      } else if (query.startsWith("Analiza el siguiente contrato para identificar riesgos bajo la legislación de Jalisco:")) {
        const contrato = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en derecho contractual en San Luis Potosí. Tu tarea es analizar el siguiente texto de contrato e identificar posibles riesgos legales, cláusulas abusivas, ambigüedades o puntos débiles, siempre bajo la legislación del Estado de San Luis Potosí y la legislación federal aplicable.

**Instrucciones de Análisis de Contratos (Precisión Quirúrgica para San Luis Potosí):**

1.  **Identificación de Tipo de Contrato y Partes:** Determina el tipo de contrato (ej. compraventa, arrendamiento, prestación de servicios, mercantil, civil) y las partes involucradas.

2.  **Marco Legal Aplicable:** Identifica las leyes de San Luis Potosí (ej. Código Civil de San Luis Potosí, Código de Comercio si es mercantil) y/o leyes federales aplicables al tipo de contrato.

3.  **Análisis de Cláusulas Clave:** Revisa las cláusulas esenciales (objeto, precio, plazos, obligaciones, penalizaciones, rescisión, jurisdicción) y señala cualquier inconsistencia o riesgo.

4.  **Identificación de Riesgos y Puntos Débiles:**
    *   **Cláusulas Abusivas:** Señala cualquier cláusula que pueda ser considerada leonina o desproporcionada bajo la ley de San Luis Potosí.
    *   **Ambigüedades:** Identifica redacciones poco claras que puedan dar lugar a interpretaciones diversas.
    *   **Omisiones:** Detecta la ausencia de cláusulas importantes que deberían estar presentes para proteger los intereses de tu cliente.
    *   **Incumplimiento Normativo:** Verifica si el contrato cumple con los requisitos formales y sustantivos de la legislación de San Luis Potosí.

5.  **Recomendaciones:** Ofrece recomendaciones claras para mitigar los riesgos identificados o para mejorar la redacción del contrato.

**NOTA IMPORTANTE:** Esta es una versión demo. En la versión completa de LEXIS PRODIGIUM, podrás subir documentos completos para un análisis exhaustivo. Por ahora, por favor, pega el texto relevante del contrato directamente en tu consulta.

Analiza el siguiente contrato:
${contrato}`
      } else if (query.startsWith("Genera un borrador de escrito procesal para el siguiente caso en Jalisco:")) {
        const caso = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = `Genera un perfil estratégico del abogado o juez a partir del siguiente texto, identificando su estilo, argumentos recurrentes y patrones de decisión. Enfócate en la materia legal y la jurisdicción de San Luis Potosí si es posible:

${caso}`
      }
      } else if (query.startsWith("Genera un borrador de documento legal general:")) {
        const detalles = query.substring(query.indexOf(':') + 1).trim();
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en la redacción de documentos legales generales. Tu tarea es generar un borrador de documento legal basado en los detalles proporcionados. Asegúrate de que el documento sea formal, claro, conciso y cumpla con los requisitos generales de un documento legal.

**Instrucciones para la Generación de Documentos Legales Generales:**

1.  **Identificación del Tipo de Documento:** Determina el tipo de documento (ej. Carta Poder, Contrato de Arrendamiento Simple, Aviso de Privacidad, Acta Constitutiva Simplificada, etc.).
2.  **Partes Involucradas:** Si aplica, identifica a las partes involucradas.
3.  **Objeto del Documento:** Describe claramente el propósito del documento.
4.  **Cláusulas o Puntos Clave:** Redacta las cláusulas o puntos esenciales que debe contener el documento.
5.  **Fundamentación Legal (si aplica):** Menciona brevemente la base legal del documento.
6.  **Formato y Estructura:** Asegura un formato y estructura adecuados para el tipo de documento.

**NOTA IMPORTANTE:** Esta es una versión demo. En la versión completa de LEXIS PRODIGIUM, podrás generar documentos más complejos y personalizados. Por ahora, por favor, proporciona todos los detalles necesarios en tu consulta.

Genera un borrador de documento legal general:
${detalles}`
      }
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      const text = response.text();

      console.log('Enviando respuesta exitosa al cliente.');
      return res.status(200).json({ result: text, sources: relevantDocs.map(doc => doc.source) });

    } catch (e) {
      console.error('ERROR CRÍTICO DENTRO DEL BLOQUE DE IA:', e);
      return res.status(500).json({ error: `Hubo un error al comunicarse con el modelo de IA: ${e.message}` });
    }

  } catch (error) {
    console.error('Error procesando la solicitud:', error);
    res.status(500).json({ error: 'Falló al procesar la solicitud de la IA.' });
  }
};