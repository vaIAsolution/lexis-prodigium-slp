export const ERROR_MESSAGES = {
  API_KEY_MISSING: 'Error de configuración del servidor: La clave de API de Gemini no está configurada. Por favor, contacte al soporte técnico.',
  IP_NOT_IDENTIFIED: 'No se pudo identificar al usuario. Por favor, intente de nuevo o contacte al soporte técnico.',
  QUERY_REQUIRED: 'La consulta es requerida para procesar su solicitud.',
  METHOD_NOT_ALLOWED: 'Método no permitido. Solo se aceptan solicitudes GET y POST.',
  USAGE_LIMIT_EXCEEDED: 'Ha alcanzado el límite de usos para esta demostración. Para desbloquear el potencial completo de LEXIS PRODIGIUM y experimentar una eficiencia legal sin precedentes, le invitamos a contactar a nuestro equipo comercial. Agende una demostración exclusiva y personalizada para su bufete y descubra cómo podemos transformar su práctica jurídica.',
  KV_FETCH_ERROR: 'Error interno al verificar usos. Por favor, intente de nuevo más tarde.',
  KV_INCREMENT_ERROR: 'Error interno al registrar el uso. Su consulta fue procesada, pero hubo un problema al actualizar el contador.',
  AI_COMMUNICATION_ERROR: (message) => `Hubo un error al comunicarse con el modelo de IA: ${message}. Por favor, intente de nuevo.`, 
  UNKNOWN_ERROR: 'Ocurrió un error inesperado. Por favor, intente de nuevo o contacte al soporte técnico si el problema persiste.'
};