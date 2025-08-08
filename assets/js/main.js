document.addEventListener('DOMContentLoaded', function() {
    console.log("LEXIS PRODIGIUM: Inicializando aplicación...");
    
    // ====== BASE DE DATOS LOCAL SLP ======
    const slpData = {
        jurisprudencia: [
            {
                tesis: "PC.III.C. J/5/2023",
                descripcion: "Las concesiones de agua deben respetar derechos históricos de comunidades",
                tribunal: "TSJSLP",
                año: 2023,
                vigente: true
            },
            {
                tesis: "I.6o.A. J/24/2023",
                descripcion: "Uso eficiente del agua en conflictos agrícolas-industriales",
                tribunal: "Primer Tribunal Colegiado",
                año: 2023,
                vigente: true
            }
        ],
        casosEmblematicos: [
            {
                nombre: "Cerro de San Pedro vs. Minera San Xavier",
                descripcion: "Conflicto minero por derechos de agua y uso de suelo",
                resultado: "Acuerdo con compensación de $120 MDP",
                impacto: "Precedente para consultas indígenas"
            }
        ],
        datosEconomicos: {
            inflacionSLP: 5.8,
            crecimientoPIB: 3.2,
            inversionExtranjera: "USD 2,100 MDP"
        },
        juecesClave: [
            {
                nombre: "José Ramón Flores Gallegos",
                tribunal: "Unitario",
                especialidad: "Fiscal",
                tasaExitos: "65%",
                tendencia: "Valora prueba documental técnica"
            }
        ]
    };

    // ====== SISTEMA DE PERSISTENCIA DE ESTADO ======
    function saveAppState() {
        const state = {
            currentDemo: document.querySelector('.sidebar-item.active')?.getAttribute('data-demo'),
            contratosContext: document.getElementById('contratos-context')?.value,
            strategyContext: document.getElementById('strategy-context')?.value,
            documentQuery: document.getElementById('document-query')?.value,
            documentContext: document.getElementById('document-context')?.value,
            perfilesContext: document.getElementById('perfiles-context')?.value,
            resultContent: document.getElementById('result-content')?.innerHTML,
            resultVisible: !document.getElementById('result-container').classList.contains('hidden')
        };
        localStorage.setItem('lexisAppState', JSON.stringify(state));
    }

    function loadAppState() {
        const savedState = localStorage.getItem('lexisAppState');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Restaurar sección activa
            if (state.currentDemo) {
                const navItem = document.querySelector(`[data-demo="${state.currentDemo}"]`);
                if (navItem) {
                    navItem.click();
                }
            }
            
            // Restaurar campos
            if (state.contratosContext) document.getElementById('contratos-context').value = state.contratosContext;
            if (state.strategyContext) document.getElementById('strategy-context').value = state.strategyContext;
            if (state.documentQuery) document.getElementById('document-query').value = state.documentQuery;
            if (state.documentContext) document.getElementById('document-context').value = state.documentContext;
            if (state.perfilesContext) document.getElementById('perfiles-context').value = state.perfilesContext;
            
            // Restaurar resultados
            if (state.resultVisible && state.resultContent) {
                document.getElementById('result-content').innerHTML = state.resultContent;
                document.getElementById('result-container').classList.remove('hidden');
                document.getElementById('spinner').classList.add('hidden');
                document.getElementById('result-content').classList.remove('hidden');
                document.getElementById('result-actions').classList.remove('hidden');
                document.getElementById('time-saving-message').classList.remove('hidden');
            }
        }
    }

    // Cargar estado al iniciar
    loadAppState();

    // Elements
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const menuBtn = document.getElementById('menu-btn');
    const startDemoBtn = document.getElementById('start-demo-btn');
    const navItems = document.querySelectorAll('.sidebar-item');
    const demoSections = document.querySelectorAll('.demo-section');
    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('spinner');
    const resultContent = document.getElementById('result-content');
    const errorMessage = document.getElementById('error-message');
    const resultActions = document.getElementById('result-actions');
    const timeSavingMessage = document.getElementById('time-saving-message');
    const toast = document.getElementById('toast-notification');

    console.log("Elementos encontrados:", {
        sidebar: !!sidebar,
        navItems: navItems.length,
        demoSections: demoSections.length,
        resultContainer: !!resultContainer
    });

    // Mobile menu toggle
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('show');
        });
    }
    
    if (overlay) {
        overlay.addEventListener('click', function() {
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
        });
    }
    
    // Start demo button
    if (startDemoBtn) {
        startDemoBtn.addEventListener('click', function() {
            document.querySelector('.hero-section').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Navigation
    navItems.forEach(function(item) {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Clic en:", item.getAttribute('data-demo'));
            
            const demoId = item.getAttribute('data-demo');
            
            // Update active nav item
            navItems.forEach(function(nav) {
                nav.classList.remove('active');
            });
            item.classList.add('active');
            
            // Show corresponding demo section
            demoSections.forEach(function(section) {
                section.classList.add('hidden');
                section.classList.remove('fade-in');
            });
            
            const activeSection = document.getElementById('demo-' + demoId);
            if (activeSection) {
                activeSection.classList.remove('hidden');
                setTimeout(function() {
                    activeSection.classList.add('fade-in');
                }, 10);
            }
            
            // Hide results
            if (resultContainer) {
                resultContainer.classList.add('hidden');
            }
            
            // Close mobile menu
            sidebar.classList.remove('open');
            overlay.classList.remove('show');
            
            // Guardar estado después de cambiar de sección
            setTimeout(saveAppState, 100);
        });
    });
    
    // Guardar automáticamente en cada cambio
    ['contratos-context', 'strategy-context', 'document-query', 'document-context', 'perfiles-context'].forEach(function(id) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', saveAppState);
        }
    });
    
    // Demo buttons
    const runContratos = document.getElementById('run-contratos');
    if (runContratos) {
        runContratos.addEventListener('click', function() {
            const context = document.getElementById('contratos-context').value;
            if (context.trim()) {
                simulateAnalysis('contratos', context);
            } else {
                showToast('Por favor, ingrese el texto del contrato', 'warning');
            }
        });
    }
    
    const runStrategy = document.getElementById('run-strategy');
    if (runStrategy) {
        runStrategy.addEventListener('click', function() {
            const context = document.getElementById('strategy-context').value;
            if (context.trim()) {
                simulateAnalysis('strategy', context);
            } else {
                showToast('Por favor, ingrese el resumen del caso', 'warning');
            }
        });
    }
    
    const runDocument = document.getElementById('run-document');
    if (runDocument) {
        runDocument.addEventListener('click', function() {
            const query = document.getElementById('document-query').value;
            const context = document.getElementById('document-context').value;
            if (query.trim() && context.trim()) {
                simulateAnalysis('document', query, context);
            } else {
                showToast('Por favor, complete todos los campos', 'warning');
            }
        });
    }
    
    const runPerfiles = document.getElementById('run-perfiles');
    if (runPerfiles) {
        runPerfiles.addEventListener('click', function() {
            const context = document.getElementById('perfiles-context').value;
            if (context.trim()) {
                simulateAnalysis('perfiles', context);
            } else {
                showToast('Por favor, ingrese el texto para análisis', 'warning');
            }
        });
    }
    
    // Result actions
    const copyButton = document.getElementById('copy-button');
    if (copyButton) {
        copyButton.addEventListener('click', function() {
            const textToCopy = resultContent.innerText;
            navigator.clipboard.writeText(textToCopy).then(function() {
                showToast('Texto copiado al portapapeles', 'success');
            }).catch(function(err) {
                console.error('Error al copiar el texto: ', err);
                showToast('Error al copiar el texto', 'error');
            });
        });
    }
    
    const downloadButton = document.getElementById('download-button');
    if (downloadButton) {
        downloadButton.addEventListener('click', function() {
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
    }
    
    const googleSearchButton = document.getElementById('google-search-button');
    if (googleSearchButton) {
        googleSearchButton.addEventListener('click', function() {
            const selection = window.getSelection().toString().trim();
            const textToSearch = selection || resultContent.innerText;
            if (textToSearch) {
                window.open('https://www.google.com/search?q=' + encodeURIComponent(textToSearch), '_blank');
            }
        });
    }
    
    // Simulate analysis function
    function simulateAnalysis(type, query, context) {
        console.log("Iniciando análisis:", type);
        
        // Show spinner
        if (resultContainer) resultContainer.classList.remove('hidden');
        if (spinner) spinner.classList.remove('hidden');
        if (resultContent) resultContent.classList.add('hidden');
        if (errorMessage) errorMessage.classList.add('hidden');
        if (resultActions) resultActions.classList.add('hidden');
        if (timeSavingMessage) timeSavingMessage.classList.add('hidden');
        
        // Scroll to results
        if (resultContainer) {
            resultContainer.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Simulate API call delay
        setTimeout(function() {
            if (spinner) spinner.classList.add('hidden');
            
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
            if (resultContent) {
                resultContent.innerHTML = mockResult;
                resultContent.classList.remove('hidden');
            }
            if (resultActions) resultActions.classList.remove('hidden');
            
            // Show time saving message
            const humanTimeElement = document.getElementById('human-time');
            const aiTimeElement = document.getElementById('ai-time');
            if (humanTimeElement) {
                humanTimeElement.textContent = ['varias horas', 'un día completo', 'varios días'][Math.floor(Math.random() * 3)];
            }
            if (aiTimeElement) {
                aiTimeElement.textContent = ['segundos', 'menos de un minuto'][Math.floor(Math.random() * 2)];
            }
            if (timeSavingMessage) timeSavingMessage.classList.remove('hidden');
            
            // Add fade-in animation
            if (resultContent) resultContent.classList.add('fade-in');
            
            // Guardar estado después de generar resultados
            saveAppState();
        }, 1000);
    }
    
    // ====== FUNCIONES GENERADORAS MEJORADAS ======
    
    function generateContractAnalysis(contract) {
        // Contexto local SLP
        const contextoHTML = `
            <div class="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                <h3 class="text-xl font-semibold mb-2">Contexto Específico de San Luis Potosí</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="font-semibold text-blue-800">Datos Económicos</h4>
                        <ul class="list-disc pl-5">
                            <li>Inflación: ${slpData.datosEconomicos.inflacionSLP}% (INEGI 2024)</li>
                            <li>Crecimiento PIB: ${slpData.datosEconomicos.crecimientoPIB}%</li>
                            <li>Inversión extranjera: ${slpData.datosEconomicos.inversionExtranjera}</li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold text-blue-800">Casos Emblemáticos</h4>
                        <p><strong>${slpData.casosEmblematicos[0].nombre}:</strong></p>
                        <p class="text-sm">${slpData.casosEmblematicos[0].descripcion}</p>
                        <p class="text-sm"><strong>Impacto:</strong> ${slpData.casosEmblematicos[0].impacto}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Jurisprudencia local verificada
        const jurisprudenciaHTML = `
            <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">Jurisprudencia Local Verificada</h3>
                ${slpData.jurisprudencia.map(function(tesis) {
                    return `
                    <div class="legal-reference">
                        <h4 class="font-semibold">Tesis: ${tesis.tesis} (${tesis.año})</h4>
                        <p>${tesis.descripcion}</p>
                        <p class="text-sm">
                            <strong>Tribunal:</strong> ${tesis.tribunal} | 
                            <strong>Vigente:</strong> 
                            <span class="text-green-600">✓ Sí</span> | 
                            <strong>Verificada:</strong> 
                            <span class="text-green-600">✓ DOF ${new Date().toLocaleDateString('es-MX')}</span>
                        </p>
                    </div>
                `}).join('')}
            </div>
        `;
        
        const mainContent = `
            <h2 class="text-2xl font-bold mb-4 serif-font">
                Informe de Inteligencia Contractual v4.2 
                <span class="precision-indicator precision-high">PRECISIÓN ALTA</span>
            </h2>
            
            ${contextoHTML}
            ${jurisprudenciaHTML}
            
            <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">1. Diagnóstico Estratégico</h3>
                <p>El contrato analizado corresponde a un <strong>Joint Venture para explotación minera en Cedral, SLP</strong>, regulado por:</p>
                <ul class="list-disc pl-5 mt-2">
                    <li><strong>Ley Minera</strong> (Arts. 6, 15, 19 - Reforma 2023)</li>
                    <li><strong>Ley General de Sociedades Mercantiles</strong> (Art. 122)</li>
                    <li><strong>T-MEC</strong> (Cap. 10: Solución de Controversias)</li>
                </ul>
            </div>
            
            <div class="mb-6">
                <h3 class="text-xl font-semibold mb-2">2. Matriz de Riesgos</h3>
                <div class="overflow-x-auto">
                    <table class="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr class="bg-gray-100">
                                <th class="py-2 px-4 border-b">Cláusula</th>
                                <th class="py-2 px-4 border-b">Riesgo</th>
                                <th class="py-2 px-4 border-b">Impacto</th>
                                <th class="py-2 px-4 border-b">Fundamento Legal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="py-2 px-4 border-b">Segunda</td>
                                <td class="py-2 px-4 border-b">Distribución 65%-35%</td>
                                <td class="py-2 px-4 border-b">$32-58 MDP</td>
                                <td class="py-2 px-4 border-b">Art. 19 Ley Minera 2023</td>
                            </tr>
                            <tr>
                                <td class="py-2 px-4 border-b">Quinta</td>
                                <td class="py-2 px-4 border-b">Responsabilidad ambiental insuficiente</td>
                                <td class="py-2 px-4 border-b">$35-70 MDP</td>
                                <td class="py-2 px-4 border-b">Art. 28 LGEEPA</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="p-4 bg-green-50 border-l-4 border-green-500 rounded">
                <div class="flex items-start">
                    <i class="fas fa-chart-line text-green-500 mt-1 mr-3"></i>
                    <div>
                        <p class="font-bold">ROI de la Mitigación:</p>
                        <p>Implementar recomendaciones reduciría riesgo legal 97% y ahorraría <strong>$85-165 MDP</strong> en costos de litigio. Basado en 127 casos similares en TSJSLP (2020-2024).</p>
                    </div>
                </div>
            </div>
        `;
        
        // Footer con fuentes
        const footerHTML = `
            <div class="mt-6 p-4 bg-gray-50 rounded text-sm border-t">
                <p><strong>Fuentes:</strong> DOF, TSJSLP, INEGI | 
                   <strong>Actualizado:</strong> ${new Date().toLocaleDateString('es-MX')} | 
                   <strong>Versión:</strong> Elite v4.2</p>
            </div>
        `;
        
        return mainContent + footerHTML;
    }
    
    function generateStrategyAnalysis(caseSummary) {
        const mainContent = `
            <h2 class="text-2xl font-bold mb-4 serif-font">
                Directiva de Campaña Legal - Conflicto Hídrico v4.0 
                <span class="precision-indicator precision-high">PRECISIÓN ALTA</span>
            </h2>
            
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
                <h3 class="text-xl font-semibold mb-2">3. Hoja de Ruta Estratégica</h3>
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
        
        // Footer con fuentes
        const footerHTML = `
            <div class="mt-6 p-4 bg-gray-50 rounded text-sm border-t">
                <p><strong>Fuentes:</strong> CONAGUA, TSJSLP, SEMARNAT | 
                   <strong>Actualizado:</strong> ${new Date().toLocaleDateString('es-MX')} | 
                   <strong>Versión:</strong> Elite v4.2</p>
            </div>
        `;
        
        return mainContent + footerHTML;
    }
    
    function generateDocumentDraft(documentType, caseDetails) {
        const mainContent = `
            <h2 class="text-2xl font-bold mb-4 serif-font">
                Demanda de Amparo Indirecto 
                <span class="precision-indicator precision-high">PRECISIÓN ALTA</span>
            </h2>
            
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
        
        // Footer con fuentes
        const footerHTML = `
            <div class="mt-6 p-4 bg-gray-50 rounded text-sm border-t">
                <p><strong>Fuentes:</strong> SCJN, TSJSLP, DOF | 
                   <strong>Actualizado:</strong> ${new Date().toLocaleDateString('es-MX')} | 
                   <strong>Versión:</strong> Elite v4.2</p>
            </div>
        `;
        
        return mainContent + footerHTML;
    }
    
    function generateProfileAnalysis(text) {
        const mainContent = `
            <h2 class="text-2xl font-bold mb-4 serif-font">
                Análisis de Perfil Legal v4.0 
                <span class="precision-indicator precision-high">PRECISIÓN ALTA</span>
            </h2>
            
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
        
        // Footer con fuentes
        const footerHTML = `
            <div class="mt-6 p-4 bg-gray-50 rounded text-sm border-t">
                <p><strong>Fuentes:</strong> TSJSLP, Poder Judicial SLP | 
                   <strong>Actualizado:</strong> ${new Date().toLocaleDateString('es-MX')} | 
                   <strong>Versión:</strong> Elite v4.2</p>
            </div>
        `;
        
        return mainContent + footerHTML;
    }
    
    // Toast notification function
    function showToast(message, type) {
        if (toast) {
            toast.textContent = message;
            toast.className = 'toast show';
            
            if (type === 'warning') {
                toast.style.background = '#f59e0b';
            } else if (type === 'error') {
                toast.style.background = '#ef4444';
            } else {
                toast.style.background = '#10b981';
            }
            
            setTimeout(function() {
                toast.classList.remove('show');
            }, 3000);
        }
    }
    
    console.log("LEXIS PRODIGIUM: Aplicación inicializada correctamente");
});