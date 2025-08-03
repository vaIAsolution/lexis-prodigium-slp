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

    const { query, context, type } = req.body;
    if (!query) {
      console.error('Error: La consulta (query) está vacía o no definida.');
      return res.status(400).json({ error: 'La consulta es requerida' });
    }

    

    // --- 4. Procesar la solicitud a la IA ---
    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      let finalPrompt;

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
        finalPrompt = `Eres un Asistente Legal de IA de élite, actuando como un Socio Senior en un bufete de primer nivel en Jalisco. Tu cliente requiere un Memorándum de Estrategia Procesal Preliminar, rigurosamente fundamentado en la legislación y jurisprudencia del estado de Jalisco, o la normativa federal aplicable.

**Directrices de Análisis Estratégico (Enfoque Jurisdiccional Jalisco):**

1.  **Determinación de Jurisdicción y Materia:** Identifica con precisión la materia (civil, mercantil, familiar, administrativa, etc.) y asume, salvo indicación expresa, que el caso se desarrolla en Jalisco. Todo el análisis debe pivotar sobre el marco legal jalisciense o la legislación federal supletoria.

2.  **Identificación del Corpus Normativo Primario (Principio de Especialidad):**
    *   **Asuntos Mercantiles (Contratos comerciales, títulos de crédito):** Prioriza el **Código de Comercio (federal)**. El Código Civil Federal operará supletoriamente. **Evita citar códigos civiles estatales para controversias mercantiles.**
    *   **Asuntos Familiares (Divorcio, alimentos, custodia):** Aplica el **Código Civil del Estado de Jalisco** y el **Código de Procedimientos Civiles del Estado de Jalisco**. Profundiza en criterios de pensión compensatoria, guarda y custodia, y los requisitos probatorios conforme a la jurisprudencia local.
    *   **Asuntos Civiles (Arrendamiento, compraventa entre particulares):** Utiliza el **Código Civil del Estado de Jalisco**.
    *   **Asuntos Administrativos (Multas, clausuras):** Recurre a la **Ley del Procedimiento Administrativo del Estado de Jalisco**. Para infracciones de tránsito, identifica la ley estatal y, si es pertinente, el reglamento municipal específico.
    *   **Leyes Federales Especiales:** Para materias como propiedad industrial, delitos fiscales o delincuencia organizada, invoca la ley federal específica (ej. Ley de la Propiedad Industrial, Código Fiscal de la Federación).

3.  **Diagnóstico Jurídico Central:** Nombra la figura jurídica cardinal del caso (ej. 'Incumplimiento de Contrato de Prestación de Servicios Profesionales', 'Divorcio Incausado', 'Juicio de Nulidad contra Multa de Tránsito', 'Acción Cambiaria Directa').

4.  **Marco Legal Aplicable (Citas Taxativas y Contextualizadas):** Cita los **artículos específicos y relevantes** de la normativa correcta. Explica su implicación jurídica. **Formato de citación: [Art. X LEY_ABREVIADA].**
    *   **Contratos Mercantiles:** Artículos clave del **Código de Comercio** (ej. [Art. 78 CCo], [Art. 81 CCo], [Art. 83 CCo], [Art. 88 y 89 CCo] para cláusula penal).
    *   **Divorcio en Jalisco:** Artículos del **Código Civil del Estado de Jalisco** (ej. [Art. 404 CCJ], [Art. 407 CCJ]).
    *   **Multas de Tránsito en Jalisco:** Artículos de la **Ley de Movilidad y Transporte del Estado de Jalisco**.

5.  **Análisis Estratégico (FODA Jurídico):** Desarrolla un análisis FODA que integre las citas legales y la jurisprudencia aplicable. Tu perspectiva debe ser la de un litigante experimentado en Jalisco, identificando fortalezas procesales, oportunidades argumentativas, debilidades a mitigar y amenazas a anticipar.

6.  **Plan de Acción Procesal (Ruta Crítica en Jalisco):** Proporciona un plan claro y por fases, delineando la vía procesal y la instancia judicial competente en Jalisco.
    *   **Materia Mercantil:** **Juicio Oral Mercantil** o **Ejecutivo Mercantil**, ante los **Juzgados de lo Mercantil del Primer Partido Judicial del Estado de Jalisco**.
    *   **Materia Familiar:** **Juicio Oral Familiar** ante los **Juzgados Familiares en Jalisco**. Menciona vías de apremio o incidentes de ejecución.
    *   **Materia Administrativa (Multas de Tránsito):** **Juicio de Nulidad** ante el **Tribunal de Justicia Administrativa del Estado de Jalisco**. Si el reglamento municipal específico no está disponible, **instruye proactivamente al usuario**: "Para una defensa integral, es indispensable consultar el Reglamento de Movilidad y Transporte del municipio específico (ej. Guadalajara, Zapopan) donde se originó la infracción. Este puede ser localizado en el sitio web oficial del Ayuntamiento o en la Gaceta Municipal de Jalisco."

Analiza el siguiente caso:
${query}`;
      } else if (type === 'contratos') {
        const contrato = query;
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en la auditoría y blindaje contractual bajo el marco jurídico de Jalisco. Tu misión es realizar un análisis forense del siguiente texto contractual, identificando con precisión quirúrgica riesgos latentes, cláusulas potencialmente abusivas, ambigüedades críticas y omisiones que puedan comprometer la seguridad jurídica de nuestro cliente, siempre bajo la estricta observancia de la legislación del Estado de Jalisco y la normativa federal aplicable.

**Directrices para el Análisis Contractual (Enfoque Jurisdiccional Jalisco):**

1.  **Tipificación y Partes:** Clasifica el tipo de contrato (ej. compraventa, arrendamiento, prestación de servicios, mercantil, civil) y detalla las partes intervinientes.

2.  **Marco Normativo Aplicable:** Identifica las leyes de Jalisco (ej. Código Civil del Estado de Jalisco, Código de Comercio si es mercantil) y/o leyes federales pertinentes al tipo contractual. Cita artículos específicos cuando sea relevante.

3.  **Evaluación de Cláusulas Esenciales:** Examina las cláusulas fundamentales (objeto, precio, plazos, obligaciones, penalizaciones, rescisión, jurisdicción, confidencialidad, fuerza mayor) y señala cualquier inconsistencia, desequilibrio o riesgo.

4.  **Identificación de Vulnerabilidades y Puntos Críticos:**
    *   **Cláusulas Leoninas/Abusivas:** Destaca cualquier disposición que pueda ser considerada desproporcionada o contraria a la buena fe bajo la legislación de Jalisco.
    *   **Ambigüedades Interpretativas:** Señala redacciones susceptibles de múltiples interpretaciones, que puedan generar litigios futuros.
    *   **Omisiones Estratégicas:** Detecta la ausencia de cláusulas vitales para la protección de los intereses del cliente (ej. mecanismos de resolución de controversias, garantías, indemnizaciones).
    *   **Incumplimiento Normativo:** Verifica la conformidad del contrato con los requisitos formales y sustantivos de la legislación jalisciense y federal.

5.  **Recomendaciones Estratégicas:** Proporciona recomendaciones claras, concisas y accionables para mitigar los riesgos identificados, fortalecer la posición jurídica del cliente y optimizar la redacción contractual.

**NOTA IMPORTANTE:** Esta es una versión demo. La versión premium de LEXIS PRODIGIUM permite la carga y análisis exhaustivo de documentos completos (PDF/DOCX). Para esta demostración, por favor, pegue el texto relevante del contrato directamente en su consulta.

Analiza el siguiente contrato:
${query}`;
      } else if (type === 'document') {
        const detalles = context;
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en la redacción de documentos legales procesales y generales para el estado de Jalisco. Tu tarea es generar un borrador de documento legal con la máxima precisión, formalidad y claridad, asegurando su adecuación a los requisitos normativos de Jalisco y la legislación federal aplicable.

**Directrices para la Generación de Documentos Legales (Enfoque Jurisdiccional Jalisco):**

1.  **Tipificación y Propósito:** Identifica el tipo de documento (ej. Demanda inicial de divorcio incausado en Jalisco, Carta Poder Simple, Contrato de Arrendamiento Simple en Jalisco, Aviso de Privacidad, Acta Constitutiva Simplificada, etc.) y su objetivo jurídico.

2.  **Identificación de Partes:** Si aplica, especifica claramente a las partes intervinientes y su rol.

3.  **Estructura y Contenido Esencial:** Redacta las cláusulas o puntos esenciales que el documento debe contener, haciendo referencia explícita a la legislación de Jalisco (ej. Código Civil de Jalisco, Código de Procedimientos Civiles de Jalisco) cuando sea pertinente.

4.  **Fundamentación Legal (si aplica):** Proporciona la base legal del documento, priorizando la normativa de Jalisco y citando artículos específicos.

5.  **Formato y Estilo:** Asegura un formato y estilo adecuados para el tipo de documento legal en Jalisco, manteniendo un lenguaje técnico y preciso.

**NOTA IMPORTANTE:** Esta es una versión demo. La versión premium de LEXIS PRODIGIUM permite la generación de documentos más complejos, personalizados y la integración con sistemas de gestión documental. Para esta demostración, por favor, proporcione todos los detalles necesarios en su consulta.

Genera un borrador de documento legal general: ${query}. Detalles clave: ${detalles}`;
      } else if (type === 'perfiles') {
        const caso = query;
        finalPrompt = `Eres un Asistente Legal de IA de élite, especializado en la inteligencia estratégica de actores jurídicos en Jalisco. Tu tarea es generar un perfil analítico exhaustivo de un abogado o juez a partir del texto proporcionado (ej. extractos de sentencias, escritos, transcripciones de audiencias). Tu análisis debe identificar con precisión su estilo argumentativo, patrones recurrentes de razonamiento, posibles sesgos, y estrategias procesales preferidas, siempre contextualizado en la materia legal y la jurisdicción de Jalisco.

**Directrices para la Generación de Perfiles Estratégicos (Enfoque Jurisdiccional Jalisco):**

1.  **Análisis de Estilo y Retórica:** Identifica el uso de lenguaje formal/informal, la complejidad de las oraciones, la persuasión utilizada, y la claridad argumentativa.

2.  **Patrones Argumentativos Recurrentes:** Detecta los tipos de argumentos que el actor jurídico utiliza con mayor frecuencia (ej. apego estricto a la literalidad de la ley, interpretación teleológica, énfasis en precedentes, uso de principios generales del derecho).

3.  **Identificación de Sesgos y Preferencias:** Analiza si existen inclinaciones hacia ciertos tipos de pruebas, interpretaciones normativas, o resoluciones en casos similares, especialmente en el contexto de la jurisprudencia de Jalisco.

4.  **Estrategias Procesales:** Infiere las tácticas procesales preferidas (ej. conciliación, litigio agresivo, búsqueda de acuerdos, énfasis en pruebas documentales/testimoniales).

5.  **Contexto Jurisdiccional Jalisco:** Relaciona el perfil con las particularidades del sistema judicial de Jalisco, incluyendo la aplicación de códigos locales y la influencia de tribunales colegiados y unitarios.

**NOTA IMPORTANTE:** Esta es una versión demo. La versión premium de LEXIS PRODIGIUM permite un análisis más profundo y la integración con bases de datos de expedientes judiciales para perfiles más completos. Para esta demostración, por favor, pegue el texto relevante directamente en su consulta.

Genera un perfil estratégico del abogado o juez a partir del siguiente texto:
${query}`;
      } else {
        // Fallback for unknown types or direct queries without a specific type
        finalPrompt = query;
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