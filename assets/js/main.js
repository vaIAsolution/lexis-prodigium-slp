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
        return `<a href="https://www.google.com/search?q=${searchQuery}" target="_blank" class="text-brand-blue-500 hover:underline" data-article-citation="${fullCitation}">${match}</a>`;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes y Variables ---
    const API_URL = '/api/proxy';
    let isLoading = false;

    // --- Selectores de Elementos ---
    const allButtons = document.querySelectorAll('button[id^="run-"]');

    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('spinner');
    const resultcontent = document.getElementById('result-content');
    const errorMessage = document.getElementById('error-message');
    const resultActions = document.getElementById('result-actions'); // Nuevo selector para los botones de acción

    // --- Funciones Principales ---

    // Función para obtener y mostrar los usos restantes
    const fetchUsage = async () => {
        try {
            const response = await fetch(API_URL, { method: 'GET' });
            const data = await response.json();
            const usageMessage = document.getElementById('usage-message');
            const usageContainer = document.getElementById('usage-container');

            if (response.ok) {
                usageMessage.textContent = `Usos restantes: ${data.remaining} de ${data.max}`;
                usageContainer.classList.remove('hidden');
            } else {
                usageMessage.textContent = `Error al cargar usos: ${data.error || 'Desconocido'}`;
                usageContainer.classList.remove('hidden');
                usageContainer.classList.add('text-red-400');
            }
        } catch (error) {
            console.error('Error al obtener usos:', error);
            const usageMessage = document.getElementById('usage-message');
            const usageContainer = document.getElementById('usage-container');
            usageMessage.textContent = 'Error al cargar usos.';
            usageContainer.classList.remove('hidden');
            usageContainer.classList.add('text-red-400');
        }
    };

    // Llama a la API con una consulta
    const callApi = async (query, context = '') => {
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
                body: JSON.stringify({ query, context }),
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

            // Actualizar usos restantes
            fetchUsage(); 

            // Mostrar mensaje de ahorro de tiempo
            const timeSavingMessage = document.getElementById('time-saving-message');
            const humanTimeSpan = document.getElementById('human-time');
            const aiTimeSpan = document.getElementById('ai-time');

            // Lógica simple para simular ahorro de tiempo
            const humanTimeOptions = ["varias horas de investigación legal", "un día completo de análisis jurídico", "semanas de preparación de casos complejos"];
            const aiTimeOptions = ["escasos segundos", "pocos minutos clave"];

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
    
    // --- Lógica de Navegación ---
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const demoId = e.currentTarget.getAttribute('data-demo');

            // --- MASTER RESET ---
            // 1. Reset logic state
            isLoading = false;

            // 2. Force all action buttons to be enabled
            allButtons.forEach(btn => {
                btn.disabled = false;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
            });

            // 3. Hide all result-related containers
            spinner.classList.add('hidden');
            resultContainer.classList.add('hidden');
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
            const query = `Analiza el siguiente contrato para identificar riesgos bajo la legislación de San Luis Potosí: ${context}`;
            callApi(query);
        }
    });

    document.getElementById('run-strategy').addEventListener('click', () => {
        const context = document.getElementById('strategy-context').value;
        if (context) {
            const query = `Realiza un análisis de estrategia legal tipo FODA para el siguiente caso: ${context}`;
            callApi(query);
        }
    });

    document.getElementById('run-document').addEventListener('click', () => {
        const docQuery = document.getElementById('document-query').value;
        const docContext = document.getElementById('document-context').value;
        if (docQuery && docContext) {
            let finalQuery = '';
            if (docQuery.startsWith("Genera un borrador de escrito procesal")) {
                finalQuery = `Genera un borrador de escrito procesal para el siguiente caso en San Luis Potosí: ${docContext}`;
            } else {
                finalQuery = `Genera un borrador de documento legal general: ${docContext}`;
            }
            callApi(finalQuery);
        }
    });

    document.getElementById('run-perfiles').addEventListener('click', () => {
        const context = document.getElementById('perfiles-context').value;
        if (context) {
            const query = `Genera un perfil estratégico del abogado o juez a partir del siguiente texto: ${context}`;
            callApi(query);
        }
    });

    // --- Lógica de Botones de Acción de Resultado ---
    document.getElementById('copy-button').addEventListener('click', () => {
        const textToCopy = resultcontent.innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const toast = document.getElementById('toast-notification');
            toast.classList.remove('hidden');
            setTimeout(() => { toast.classList.remove('opacity-0'); }, 10); // Start fade in
            setTimeout(() => {
                toast.classList.add('opacity-0');
                setTimeout(() => { toast.classList.add('hidden'); }, 300); // Fade out and hide
            }, 2000); // Toast visible for 2 seconds
        }).catch(err => {
            console.error('Error al copiar el texto: ', err);
            // Optionally, show an error toast
        });
    });

    // Llamar a fetchUsage al cargar la página
    fetchUsage();

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

});