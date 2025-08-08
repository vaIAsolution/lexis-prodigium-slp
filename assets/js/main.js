<<<<<<< HEAD
// New function for processing legal citations
function processLegalCitations(htmlString) {
    // This regex attempts to find common legal citation patterns.
    // It looks for "Artículo", "Art.", "Ley", "Código", "Constitución" followed by
    // numbers, names, or combinations.
    const citationRegex = /(Artículo|Art\.|Ley|Código|Constitución)\s+(\d+\s*(?:bis)?(?:(?:\s+al\s+\d+)?(?:\s+de\s+la)?(?:\s+del)?(?:\s+de)?\s+[A-Z][\w\s\d\.]*?)(?:\s+de\s+\d{4})?)/gi;

    return htmlString.replace(citationRegex, (match, p1, p2) => {
        const fullCitation = `${p1} ${p2}`.trim();
        const searchQuery = encodeURIComponent(fullCitation);

        // For now, still links to Google. In a future iteration, this would trigger a modal
        // to display the article content directly within the app.
        return `<a href="https://www.google.com/search?q=${searchQuery}" target="_blank" class="text-blue-600 hover:underline" data-article-citation="${fullCitation}">${match}</a>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes y Variables ---
    const API_URL = '/api/proxy';
    let isLoading = false;

    // --- Selectores de Elementos ---
    const allButtons = document.querySelectorAll('button[id^="run-"]');

=======
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuBtn = document.getElementById('menu-btn');
    const startDemoBtn = document.getElementById('start-demo-btn');
    const navItems = document.querySelectorAll('.sidebar-item');
    const demoSections = document.querySelectorAll('.demo-section');
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('spinner');
    const resultContent = document.getElementById('result-content');
    const errorMessage = document.getElementById('error-message');
<<<<<<< HEAD
    const resultActions = document.getElementById('result-actions'); // Nuevo selector para los botones de acción

    // --- Funciones Principales ---

    // Llama a la API con una consulta
    const callApi = async (type, query, context = '') => {
        if (isLoading) return; // Previene llamadas duplicadas
        isLoading = true;

        // Mostrar spinner y ocultar resultados anteriores
        resultContainer.classList.remove('hidden');
        spinner.classList.remove('hidden');
        resultcontent.classList.add('hidden');
        errorMessage.classList.add('hidden');
        resultActions.classList.add('hidden'); // Ocultar botones de acción al iniciar una nueva consulta

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, query, context }),
            });

            const data = await response.json();

            // --- Log para depuración en el frontend ---
            console.log('Respuesta recibida del servidor:', JSON.stringify(data, null, 2));

            if (!response.ok) throw new Error(data.error || 'Ocurrió un error desconocido.');
            
            // Renderizar el contenido Markdown a HTML y procesar citas legales
            let processedHtml = marked.parse(data.result);
            processedHtml = processLegalCitations(processedHtml);
            resultcontent.innerHTML = processedHtml; 
            resultcontent.classList.remove('hidden'); 
            resultActions.classList.remove('hidden'); 

            // Mostrar mensaje de ahorro de tiempo
            const timeSavingMessage = document.getElementById('time-saving-message');
            const humanTimeSpan = document.getElementById('human-time');
            const aiTimeSpan = document.getElementById('ai-time');

            // Lógica simple para simular ahorro de tiempo
            const humanTimeOptions = ["varias horas", "un día completo", "varios días"];
            const aiTimeOptions = ["segundos", "menos de un minuto"];

            humanTimeSpan.textContent = humanTimeOptions[Math.floor(Math.random() * humanTimeOptions.length)];
            aiTimeSpan.textContent = aiTimeOptions[Math.floor(Math.random() * aiTimeOptions.length)];
            timeSavingMessage.classList.remove('hidden');

        } catch (error) {
            document.getElementById('error-text').textContent = error.message;
            errorMessage.classList.remove('hidden');
        } finally {
            spinner.classList.add('hidden');
            isLoading = false;
        }
    };
=======
    const resultActions = document.getElementById('result-actions');
    const timeSavingMessage = document.getElementById('time-saving-message');
    const toast = document.getElementById('toast-notification');
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
    
    // Mobile menu toggle
    menuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
    });
    
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    });
    
    // Start demo button
    startDemoBtn.addEventListener('click', () => {
        document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const demoId = item.getAttribute('data-demo');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding demo section
            demoSections.forEach(section => {
                section.classList.add('hidden');
                section.classList.remove('fade-in');
            });
            
            const activeSection = document.getElementById(`demo-${demoId}`);
            activeSection.classList.remove('hidden');
            setTimeout(() => activeSection.classList.add('fade-in'), 10);
            
            // Hide results
            resultContainer.classList.add('hidden');
<<<<<<< HEAD
            errorMessage.classList.add('hidden');
            resultcontent.classList.add('hidden');
            resultActions.classList.add('hidden');
            document.getElementById('time-saving-message').classList.add('hidden'); // Ocultar mensaje de ahorro de tiempo

            // 4. Set the correct active section and nav item
            document.querySelectorAll('.demo-section').forEach(section => {
                section.classList.toggle('active', section.id === `demo-${demoId}`);
            });

            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('bg-brand-blue-600'));
            e.currentTarget.classList.add('bg-brand-blue-600');
        });
    });

    // --- Asignación de Eventos a Botones ---
    document.getElementById('run-contratos').addEventListener('click', () => {
        const context = document.getElementById('contratos-context').value;
        if (context) {
            callApi('contratos', context);
        }
    });

    document.getElementById('run-strategy').addEventListener('click', () => {
        const context = document.getElementById('strategy-context').value;
        if (context) {
            callApi('strategy', context);
        }
    });

    document.getElementById('run-document').addEventListener('click', () => {
        const query = document.getElementById('document-query').value;
        const context = document.getElementById('document-context').value;
        if (query && context) {
            callApi('document', query, context);
        }
    });

    document.getElementById('run-perfiles').addEventListener('click', () => {
        const context = document.getElementById('perfiles-context').value;
        if (context) {
            callApi('perfiles', context);
=======
            
            // Close mobile menu
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    });
    
    // Demo buttons
    document.getElementById('run-contratos').addEventListener('click', () => {
        const context = document.getElementById('contratos-context').value;
        if (context.trim()) {
            simulateAnalysis('contratos', context);
        } else {
            showToast('Por favor, ingrese el texto del contrato', 'warning');
        }
    });
    
    document.getElementById('run-strategy').addEventListener('click', () => {
        const context = document.getElementById('strategy-context').value;
        if (context.trim()) {
            simulateAnalysis('strategy', context);
        } else {
            showToast('Por favor, ingrese el resumen del caso', 'warning');
        }
    });
    
    document.getElementById('run-document').addEventListener('click', () => {
        const query = document.getElementById('document-query').value;
        const context = document.getElementById('document-context').value;
        if (query.trim() && context.trim()) {
            simulateAnalysis('document', query, context);
        } else {
            showToast('Por favor, complete todos los campos', 'warning');
        }
    });
    
    document.getElementById('run-perfiles').addEventListener('click', () => {
        const context = document.getElementById('perfiles-context').value;
        if (context.trim()) {
            simulateAnalysis('perfiles', context);
        } else {
            showToast('Por favor, ingrese el texto para análisis', 'warning');
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
        }
    });
    
    // Result actions
    document.getElementById('copy-button').addEventListener('click', () => {
        const textToCopy = resultContent.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            showToast('Texto copiado al portapapeles', 'success');
        }).catch(err => {
            console.error('Error al copiar el texto: ', err);
            showToast('Error al copiar el texto', 'error');
        });
    });
<<<<<<< HEAD

                document.getElementById('download-button').addEventListener('click', () => {
                const textToDownload = resultcontent.innerText;
                const blob = new Blob([textToDownload], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'resultado-lexis-prodigium.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });

            document.getElementById('google-search-button').addEventListener('click', () => {
                const selection = window.getSelection().toString().trim();
                const textToSearch = selection || resultcontent.innerText;
                if (textToSearch) {
                    window.open(`https://www.google.com/search?q=${encodeURIComponent(textToSearch)}`, '_blank');
                }
            });

=======
    
    document.getElementById('download-button').addEventListener('click', () => {
        const textToDownload = resultContent.innerText;
        const blob = new Blob([textToDownload], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'resultado-lexis-prodigium.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Descarga iniciada', 'success');
    });
    
    document.getElementById('google-search-button').addEventListener('click', () => {
        const selection = window.getSelection().toString().trim();
        const textToSearch = selection || resultContent.innerText;
        if (textToSearch) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(textToSearch)}`, '_blank');
        }
    });
    
    // Simulate analysis function
    function simulateAnalysis(type, query, context = '') {
        // Show spinner
        resultContainer.classList.remove('hidden');
        spinner.classList.remove('hidden');
        resultContent.classList.add('hidden');
        errorMessage.classList.add('hidden');
        resultActions.classList.add('hidden');
        timeSavingMessage.classList.add('hidden');
        
        // Scroll to results
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Simulate API call delay
        setTimeout(() => {
            spinner.classList.add('hidden');
            
            // Generate mock results based on type
            let mockResult = '';
            
            switch(type) {
                case 'contratos':
                    mockResult = generateContractAnalysis(query);
                    break;
                case 'strategy':
                    mockResult = generateStrategyAnalysis(query);
                    break;
                case 'document':
                    mockResult = generateDocumentDraft(query, context);
                    break;
                case 'perfiles':
                    mockResult = generateProfileAnalysis(query);
                    break;
            }
            
            // Display results
            resultContent.innerHTML = mockResult;
            resultContent.classList.remove('hidden');
            resultActions.classList.remove('hidden');
            
            // Show time saving message
            document.getElementById('human-time').textContent = ['varias horas', 'un día completo', 'varios días'][Math.floor(Math.random() * 3)];
            document.getElementById('ai-time').textContent = ['segundos', 'menos de un minuto'][Math.floor(Math.random() * 2)];
            timeSavingMessage.classList.remove('hidden');
            
            // Add fade-in animation
            resultContent.classList.add('fade-in');
        }, 2000);
    }
    
    // ====== ELITE RESPONSE GENERATORS ======
    
    function generateContractAnalysis(contract) {
        return `
        <h2 class="text-2xl font-bold mb-4 serif-font">Informe de Inteligencia Contractual Minera v4.0 <span class="precision-indicator precision-high">PRECISIÓN ALTA</span></h2>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">1. Diagnóstico Estratégico y Contexto Jurídico</h3>
            <p>El contrato analizado es un <strong>Joint Venture para explotación minera en Cedral, SLP</strong>, regulado por:</p>
            <ul class="list-disc pl-5 mt-2">
                <li><strong>Ley Minera</strong> (Arts. 6, 15, 19 - Reforma 2023)</li>
                <li><strong>Ley General de Sociedades Mercantiles</strong> (Art. 122)</li>
                <li><strong>Ley de Inversión Extranjera</strong> (Art. 5 - Reservas 2024)</li>
                <li><strong>T-MEC</strong> (Cap. 10: Solución de Controversias)</li>
            </ul>
            <div class="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p class="font-bold text-blue-800">Contexto Crítico SLP:</p>
                <p>Cedral concentra el 45% de la producción de plata en SLP. El 78% de proyectos mineros enfrentan conflictos sociales (TSJSLP 2020-2024). La Ley Minera 2023 exige 1% de utilidades para comunidades.</p>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">2. Matriz de Riesgos y Oportunidades</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full bg-white border border-gray-200">
                    <thead>
                        <tr class="bg-gray-100">
                            <th class="py-2 px-4 border-b">Cláusula</th>
                            <th class="py-2 px-4 border-b">Riesgo</th>
                            <th class="py-2 px-4 border-b">Impacto</th>
                            <th class="py-2 px-4 border-b">Nivel</th>
                            <th class="py-2 px-4 border-b">Fundamento Legal</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="py-2 px-4 border-b">Segunda</td>
                            <td class="py-2 px-4 border-b">Distribución 65%-35%</td>
                            <td class="py-2 px-4 border-b">$32-58 MDP</td>
                            <td class="py-2 px-4 border-b"><span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Crítico</span></td>
                            <td class="py-2 px-4 border-b">Art. 19 Ley Minera 2023</td>
                        </tr>
                        <tr>
                            <td class="py-2 px-4 border-b">Quinta</td>
                            <td class="py-2 px-4 border-b">Responsabilidad ambiental insuficiente</td>
                            <td class="py-2 px-4 border-b">$35-70 MDP</td>
                            <td class="py-2 px-4 border-b"><span class="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Crítico</span></td>
                            <td class="py-2 px-4 border-b">Art. 28 LGEEPA, Art. 15 Ley Estatal EE 2024</td>
                        </tr>
                        <tr>
                            <td class="py-2 px-4 border-b">Decimosexta</td>
                            <td class="py-2 px-4 border-b">Arbitraje en Miami</td>
                            <td class="py-2 px-4 border-b">$12-22 MDP</td>
                            <td class="py-2 px-4 border-b"><span class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">Alto</span></td>
                            <td class="py-2 px-4 border-b">Art. 1425 CCom, Tesis PC.III.C. J/5/2023 TSJSLP</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">3. Cláusulas Críticas Ausentes</h3>
            <div class="space-y-3">
                <div class="legal-reference risk-high">
                    <h4 class="font-semibold">Cláusula RSE (Art. 6 Ley Minera 2023)</h4>
                    <p><strong>Riesgo Crítico:</strong> Omite 1% de utilidades para comunidades. En SLP, el 92% de proyectos sin RSE han enfrentado bloqueos (TSJSLP 2023).</p>
                    <p><strong>Consecuencia:</strong> Multas SEMARNAT hasta $50 MDP + paralización (Art. 171 Ley Estatal EE).</p>
                </div>
                <div class="legal-reference risk-medium">
                    <h4 class="font-semibold">Cláusula Consulta Indígena</h4>
                    <p><strong>Riesgo Alto:</strong> Cedral tiene comunidades huastecas. Convenio 169 OIT y Ley de Consulta Indígena 2023 exigen protocolo previo.</p>
                    <p><strong>Jurisprudencia:</strong> Tesis PC.III.C. J/12/2023 TSJSLP: "La omisión invalida contratos mineros".</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">4. Recomendaciones Estratégicas</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-blue-50 p-4 rounded">
                    <h4 class="font-semibold text-blue-800">Modificaciones Inmediatas</h4>
                    <ul class="list-disc pl-5 mt-2">
                        <li>Distribución: 58%-42% + revisión bianual</li>
                        <li>Responsabilidad ambiental: Mancomunada sin límite</li>
                        <li>Arbitraje: Cambiar a Cd. México con derecho mexicano</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-4 rounded">
                    <h4 class="font-semibold text-green-800">Cláusulas Adicionales</h4>
                    <ul class="list-disc pl-5 mt-2">
                        <li>RSE: 2.5% utilidades para desarrollo comunitario</li>
                        <li>Consulta indígena: Protocolo conforme a estándares OIT</li>
                        <li>Transición energética: 40% energías renovables para 2030</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <div class="flex items-start">
                <i class="fas fa-chart-line text-green-500 mt-1 mr-3"></i>
                <div>
                    <p class="font-bold">ROI de la Mitigación:</p>
                    <p>Implementar estas recomendaciones reduciría riesgo legal 97% y ahorraría <strong>$85-165 MDP</strong> en costos de litigio y multas. Mejoraría acceso a financiamiento internacional (reducción spread 150-200 puntos base).</p>
                </div>
            </div>
        </div>
        `;
    }
    
    function generateStrategyAnalysis(caseSummary) {
        return `
        <h2 class="text-2xl font-bold mb-4 serif-font">Directiva de Campaña Legal - Conflicto Hídrico v4.0 <span class="precision-indicator precision-high">PRECISIÓN ALTA</span></h2>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">1. Teatro de Operaciones</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><strong>Conflicto:</strong> INDUSTRIAS QUÍMICAS POTOSINAS vs. Ejido San José del Llano</p>
                    <p><strong>Ubicación:</strong> Villa de Reyes, SLP</p>
                    <p><strong>Recurso:</strong> 120 l/s de agua</p>
                </div>
                <div>
                    <p><strong>Inversión en riesgo:</strong> $280 millones USD</p>
                    <p><strong>Empleos en riesgo:</strong> 450 directos</p>
                    <p><strong>Contratos de exportación:</strong> $180 millones USD/año</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">2. Marco Legal Actualizado 2024</h3>
            <div class="space-y-3">
                <div class="legal-reference">
                    <h4 class="font-semibold">Federal</h4>
                    <ul class="list-disc pl-5">
                        <li><strong>Ley de Aguas Nacionales:</strong> Arts. 3, 14, 27 (Reforma 2024)</li>
                        <li><strong>Código Agrario:</strong> Arts. 117-120 (derechos de comunidades)</li>
                    </ul>
                </div>
                <div class="legal-reference">
                    <h4 class="font-semibold">Estatal (SLP)</h4>
                    <ul class="list-disc pl-5">
                        <li><strong>Ley Estatal de Aguas:</strong> Arts. 5, 12, 25 (Reforma 2024)</li>
                        <li><strong>Acuerdo Estatal de Aguas 2024:</strong> Prioridades de uso</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">3. Mapeo de Stakeholders</h3>
            <div class="space-y-4">
                <div class="bg-red-50 p-4 rounded">
                    <h4 class="font-semibold text-red-800">Comunidad Agrícola (Adversario Principal)</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <p><strong>Perfil:</strong> 120 familias | Líder: Juan Pérez García</p>
                            <p><strong>Historial:</strong> 3 conflictos similares (2019-2023)</p>
                        </div>
                        <div>
                            <p><strong>Puntos débiles:</strong> Documentación desorganizada</p>
                            <p><strong>Estrategia probable:</strong> Bloqueos físicos (78% probabilidad)</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 p-4 rounded">
                    <h4 class="font-semibold text-blue-800">CONAGUA (Autoridad Clave)</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <p><strong>Delegado:</strong> Ing. Roberto Mendoza</p>
                            <p><strong>Tendencia:</strong> 60% favorable a comunidades</p>
                        </div>
                        <div>
                            <p><strong>Puntos de presión:</strong> Estudios técnicos independientes</p>
                            <p><strong>Estrategia recomendada:</strong> Negociación con propuesta de uso compartido</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">4. Hoja de Ruta Estratégica</h3>
            <div class="space-y-4">
                <div class="strategy-phase">
                    <h4 class="font-semibold mb-2">Fase 1: Inteligencia (0-30 días)</h4>
                    <ul class="list-disc pl-5">
                        <li>Estudio hidrogeológico por terceros independientes</li>
                        <li>Contacto con líderes comunitarios moderados</li>
                        <li>Alianza con Cámara Nacional de la Industria Química</li>
                    </ul>
                </div>
                <div class="strategy-phase">
                    <h4 class="font-semibold mb-2">Fase 2: Negociación (31-90 días)</h4>
                    <ul class="list-disc pl-5">
                        <li>Propuesta de uso compartido del recurso</li>
                        <li>Programa de desarrollo comunitario</li>
                        <li>Sistema de monitoreo transparente</li>
                    </ul>
                </div>
                <div class="strategy-phase">
                    <h4 class="font-semibold mb-2">Fase 3: Fortalecimiento (91+ días)</h4>
                    <ul class="list-disc pl-5">
                        <li>Implementar tecnología de reúso de agua</li>
                        <li>Fondo comunitario para desarrollo sostenible</li>
                        <li>Programa de transparencia y RSE</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <div class="flex items-start">
                <i class="fas fa-lightbulb text-blue-500 mt-1 mr-3"></i>
                <div>
                    <p class="font-bold">Indicadores de Éxito:</p>
                    <p>Acuerdo formal en 90 días (85% probabilidad) | Reducción consumo agua 40% | Mejora percepción pública 50% | ROI: Cada $1 invertido ahorra $7 en costos de litigio</p>
                </div>
            </div>
        </div>
        `;
    }
    
    function generateDocumentDraft(documentType, caseDetails) {
        return `
        <h2 class="text-2xl font-bold mb-4 serif-font">Demanda de Amparo Indirecto <span class="precision-indicator precision-high">PRECISIÓN ALTA</span></h2>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">1. Identificación del Documento</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><strong>Tipo:</strong> Demanda de Amparo Indirecto</p>
                    <p><strong>Juzgado:</strong> Juzgado Segundo de Distrito en Materia Administrativa</p>
                    <p><strong>Expediente:</strong> Amparo Indirecto 456/2024-I</p>
                </div>
                <div>
                    <p><strong>Quejoso:</strong> CERVECERÍA CENTRO, S.A. DE C.V.</p>
                    <p><strong>Autoridad:</strong> Congreso del Estado de SLP</p>
                    <p><strong>Materia:</strong> Constitucional-Administrativa</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">2. Conceptos de Violación</h3>
            <div class="space-y-4">
                <div class="document-section">
                    <h4 class="font-semibold mb-2">PRIMERO. Violación al Art. 14 Constitucional</h4>
                    <p>La ley impugnada establece carga tributaria adicional sin fundamentación suficiente, violando principios de proporcionalidad y equidad.</p>
                    <p class="mt-2"><strong>Jurisprudencia:</strong> Tesis P./J. 72/2010, 2a./J. 123/2010, PC.III.A. J/12/2023 TSJSLP</p>
                </div>
                <div class="document-section">
                    <h4 class="font-semibold mb-2">SEGUNDO. Violación al Art. 1o Constitucional</h4>
                    <p>La ley establece trato discriminatorio entre productores locales e importados, afectando la competitividad de empresas potosinas.</p>
                    <p class="mt-2"><strong>Jurisprudencia:</strong> Tesis 1a./J. 45/2022 SCJN, P./J. 18/2010</p>
                </div>
                <div class="document-section">
                    <h4 class="font-semibold mb-2">TERCERO. Violación al Art. 73 Constitucional</h4>
                    <p>La ley estatal invade facultades exclusivas de la federación en materia de IEPS, violando el principio de concurrencia fiscal.</p>
                    <p class="mt-2"><strong>Jurisprudencia:</strong> Tesis P./J. 120/2000, 2a./J. 67/2015</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">3. Petitorio</h3>
            <div class="bg-blue-50 p-4 rounded">
                <ol class="list-decimal pl-5">
                    <li>Se conceda la suspensión definitiva del acto reclamado</li>
                    <li>Se conceda el amparo y protección solicitados</li>
                    <li>Se deje sin efectos el Art. 5° de la Ley de IEPS local</li>
                    <li>Se condene a la autoridad responsable al pago de daños y perjuicios</li>
                </ol>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">4. Observaciones Estratégicas</h3>
            <div class="space-y-3">
                <div class="bg-yellow-50 p-4 rounded">
                    <h4 class="font-semibold text-yellow-800">Verificación Crítica</h4>
                    <ul class="list-disc pl-5">
                        <li>Confirme competencia del Juzgado Segundo de Distrito</li>
                        <li>Verifique fecha exacta de publicación de la ley</li>
                        <li>Asegure que el acto reclamado sea de naturaleza administrativa</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-4 rounded">
                    <h4 class="font-semibold text-green-800">Estrategia Procesal</h4>
                    <ul class="list-disc pl-5">
                        <li>Solicite medida cautelar para evitar cobro del impuesto</li>
                        <li>Ofrezca pruebas periciales contables</li>
                        <li>Presente estudios comparativos con otras entidades</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div class="flex items-start">
                <i class="fas fa-exclamation-triangle text-red-500 mt-1 mr-3"></i>
                <div>
                    <p class="font-bold">Advertencia:</p>
                    <p>Este documento es un borrador generado por IA y debe ser revisado por un abogado calificado. Verifique la vigencia de todas las disposiciones legales citadas.</p>
                </div>
            </div>
        </div>
        `;
    }
    
    function generateProfileAnalysis(text) {
        return `
        <h2 class="text-2xl font-bold mb-4 serif-font">Análisis de Perfil Legal v4.0 <span class="precision-indicator precision-high">PRECISIÓN ALTA</span></h2>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">1. Identificación del Sujeto</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><strong>Nombre:</strong> Mtro. Roberto García Morales</p>
                    <p><strong>Adscripción:</strong> Juzgado Segundo de lo Contencioso Administrativo (SLP)</p>
                    <p><strong>Antigüedad:</strong> 8 años en el Poder Judicial</p>
                </div>
                <div>
                    <p><strong>Especialidad:</strong> Derecho Fiscal y Administrativo</p>
                    <p><strong>Formación:</strong> UASLP (Licenciatura), UNAM (Maestría)</p>
                    <p><strong>Cursos:</strong> 120 horas en derecho administrativo (2023)</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">2. Estadísticas Jurisdiccionales (2020-2024)</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-blue-50 p-4 rounded text-center">
                    <p class="text-3xl font-bold">1,245</p>
                    <p>Expedientes resueltos</p>
                </div>
                <div class="bg-green-50 p-4 rounded text-center">
                    <p class="text-3xl font-bold">52%</p>
                    <p>Sentencias favorables a contribuyentes</p>
                </div>
                <div class="bg-yellow-50 p-4 rounded text-center">
                    <p class="text-3xl font-bold">4.2</p>
                    <p>Meses promedio de resolución</p>
                </div>
                <div class="bg-red-50 p-4 rounded text-center">
                    <p class="text-3xl font-bold">18%</p>
                    <p>Recursos de revisión admitidos</p>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">3. Patrones de Decisión</h3>
            <div class="space-y-4">
                <div class="bg-green-50 p-4 rounded">
                    <h4 class="font-semibold text-green-800">Tendencias Favorables</h4>
                    <ul class="list-disc pl-5">
                        <li>78% de sentencias favorables en casos de compensación de IVA</li>
                        <li>Admite nulidades por defectos en notificaciones (Art. 38 CFF)</li>
                        <li>Declara prescripción en 65% de casos (Art. 146 CFF)</li>
                    </ul>
                </div>
                <div class="bg-red-50 p-4 rounded">
                    <h4 class="font-semibold text-red-800">Tendencias Desfavorables</h4>
                    <ul class="list-disc pl-5">
                        <li>Rechaza 92% de amparos contra actos de Hacienda Estatal</li>
                        <li>Exige requisitos estrictos para pruebas periciales</li>
                        <li>Concede intereses moratorios solo con prueba fehaciente</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">4. Jurisprudencia de Aplicación Frecuente</h3>
            <div class="space-y-3">
                <div class="legal-reference">
                    <h4 class="font-semibold">Tesis PC.II.A. J/8/2023 (TSJSLP)</h4>
                    <p>"Las notificaciones electrónicas deben cumplir con los requisitos del Art. 38 Bis CFF"</p>
                    <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Frecuencia: 85%</span>
                </div>
                <div class="legal-reference">
                    <h4 class="font-semibold">Tesis 2a./J. 67/2022 (SCJN)</h4>
                    <p>"La compensación de impuestos opera automáticamente por ministerio de ley"</p>
                    <span class="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Frecuencia: 78%</span>
                </div>
            </div>
        </div>
        
        <div class="mb-6">
            <h3 class="text-xl font-semibold mb-2">5. Estrategias Recomendadas</h3>
            <div class="space-y-4">
                <div class="strategy-phase">
                    <h4 class="font-semibold mb-2">Para Demandas</h4>
                    <ul class="list-disc pl-5">
                        <li>Presentar pruebas documentales exhaustivas (preferentemente certificadas)</li>
                        <li>Citar explícitamente sus tesis favorables (PC.II.A. J/8/2023)</li>
                        <li>Incluir análisis de jurisprudencia reciente</li>
                    </ul>
                </div>
                <div class="strategy-phase">
                    <h4 class="font-semibold mb-2">Para Audiencias</h4>
                    <ul class="list-disc pl-5">
                        <li>Preparar argumentos técnicos (contables, jurídicos)</li>
                        <li>Evitar discusiones emocionales o políticas</li>
                        <li>Proponer soluciones prácticas (ej: pagos diferidos)</li>
                    </ul>
                </div>
            </div>
        </div>
        
        <div class="p-4 bg-green-50 border-l-4 border-green-500 rounded">
            <div class="flex items-start">
                <i class="fas fa-lightbulb text-green-500 mt-1 mr-3"></i>
                <div>
                    <p class="font-bold">Recomendación Estratégica:</p>
                    <p>Para maximizar posibilidades de éxito ante el Mtro. García Morales, prepare casos con sólidos fundamentos jurídicos, especial atención al cumplimiento de formalidades, y presente argumentos que respeten el status quo mientras propone soluciones prácticas.</p>
                </div>
            </div>
        </div>
        `;
    }
    
    // Toast notification function
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = 'toast show';
        
        if (type === 'warning') {
            toast.style.background = '#f59e0b';
        } else if (type === 'error') {
            toast.style.background = '#ef4444';
        } else {
            toast.style.background = '#10b981';
        }
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
>>>>>>> 6a07b471908bc4310c22b16d4813b80155d11059
});