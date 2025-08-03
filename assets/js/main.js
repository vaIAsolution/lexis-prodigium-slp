// New function for processing legal citations
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

function processLegalCitations(htmlString) {
    // This regex attempts to find common legal citation patterns.
    // It looks for "Artículo", "Art.", "Ley", "Código", "Constitución" followed by
    // numbers, names, or combinations.
    const citationRegex = /(Artículo|Art\.|Ley|Código|Constitución)\s+(\d+\s*(?:bis)?(?:(?:\s+al\s+\d+)?(?:(?:\s+de\s+la)?(?:\s+del)?(?:\s+de)?\s+[A-Z][\w\s\d\.]*?)(?:\s+de\s+\d{4})?)/gi;

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

    const resultContainer = document.getElementById('result-container');
    const spinner = document.getElementById('spinner');
    const resultcontent = document.getElementById('result-content');
    const resultActions = document.getElementById('result-actions'); // Nuevo selector para los botones de acción

    // --- Funciones Principales ---

    // Habilitar todos los botones al cargar la página
    allButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
    });

    // Llama a la API con una consulta
    const callApi = async (query, context = '', type) => {
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
                body: JSON.stringify({ query, context, type }),
            });

            // Obtener los usos restantes de la cabecera
            // Ya no es necesario, la demo es ilimitada
            // const remainingUsesHeader = response.headers.get('X-Usage-Remaining');
            // if (remainingUsesHeader !== null) {
            //     updateUsageUI(parseInt(remainingUsesHeader, 10));
            // }

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

            // Mostrar fuentes RAG si existen
            const sourcesContainer = document.getElementById('sources-container');
            const sourcesList = document.getElementById('sources-list');
            if (data.sources && data.sources.length > 0) {
                sourcesList.innerHTML = ''; // Clear previous sources
                data.sources.forEach(source => {
                    const li = document.createElement('li');
                    li.textContent = source;
                    sourcesList.appendChild(li);
                });
                sourcesContainer.classList.remove('hidden');
            } else {
                sourcesContainer.classList.add('hidden');
            } 

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
            document.getElementById('sources-container').classList.add('hidden'); // Ocultar contenedor de fuentes

            // 4. Set the correct active section and nav item
            console.log('Clicked nav item:', demoId); // Debugging
            document.querySelectorAll('.demo-section').forEach(section => {
                console.log('Processing section:', section.id, 'Is active:', section.id === `demo-${demoId}`); // Debugging
                section.classList.toggle('active', section.id === `demo-${demoId}`);
            });

            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('bg-brand-blue-600'));
            e.currentTarget.classList.add('bg-brand-blue-600');
        });
    });

    // --- Asignación de Eventos a Botones ---
    document.getElementById('run-contratos').addEventListener('click', async () => {
        const textAreaContext = document.getElementById('contratos-context').value;
        const fileInput = document.getElementById('contratos-file');
        let context = textAreaContext;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type === 'text/plain') {
                context = await readFileContent(file);
            } else {
                // For PDF/DOCX, we'll need backend processing. For now, just indicate.
                context = `[CONTENIDO DE ARCHIVO ${file.name} - REQUIERE PROCESAMIENTO EN BACKEND]`;
                alert('La carga de archivos PDF/DOCX requiere procesamiento en el servidor. Por favor, pegue el texto directamente por ahora.');
                return; // Prevent API call for unsupported file types in demo
            }
        }

        if (context) {
            callApi(context, '', 'contratos');
        }
    });

    document.getElementById('run-strategy').addEventListener('click', async () => {
        const textAreaContext = document.getElementById('strategy-context').value;
        const fileInput = document.getElementById('strategy-file');
        let context = textAreaContext;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type === 'text/plain') {
                context = await readFileContent(file);
            } else {
                context = `[CONTENIDO DE ARCHIVO ${file.name} - REQUIERE PROCESAMIENTO EN BACKEND]`;
                alert('La carga de archivos PDF/DOCX requiere procesamiento en el servidor. Por favor, pegue el texto directamente por ahora.');
                return;
            }
        }

        if (context) {
            callApi(context, '', 'strategy');
        }
    });

    document.getElementById('run-document').addEventListener('click', async () => {
        const query = document.getElementById('document-query').value;
        const textAreaContext = document.getElementById('document-context').value;
        const fileInput = document.getElementById('document-file');
        let context = textAreaContext;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type === 'text/plain') {
                context = await readFileContent(file);
            } else {
                context = `[CONTENIDO DE ARCHIVO ${file.name} - REQUIERE PROCESAMIENTO EN BACKEND]`;
                alert('La carga de archivos PDF/DOCX requiere procesamiento en el servidor. Por favor, pegue el texto directamente por ahora.');
                return;
            }
        }

        if (query && context) {
            callApi(query, context, 'document');
        }
    });

    document.getElementById('run-perfiles').addEventListener('click', async () => {
        const textAreaContext = document.getElementById('perfiles-context').value;
        const fileInput = document.getElementById('perfiles-file');
        let context = textAreaContext;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.type === 'text/plain') {
                context = await readFileContent(file);
            } else {
                context = `[CONTENIDO DE ARCHIVO ${file.name} - REQUIERE PROCESAMIENTO EN BACKEND]`;
                alert('La carga de archivos PDF/DOCX requiere procesamiento en el servidor. Por favor, pegue el texto directamente por ahora.');
                return;
            }
        }

        if (context) {
            callApi(context, '', 'perfiles');
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

    // --- Inicialización ---
});