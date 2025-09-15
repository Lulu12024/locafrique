// src/utils/websocket-polyfill.ts
// Polyfill pour remplacer le module 'ws' par les WebSockets natifs du navigateur

// Classe de mock pour les environnements sans WebSocket
class MockWebSocket {
  constructor(url?: string, protocols?: string | string[]) {
    console.warn('WebSocket non disponible dans cet environnement', { url, protocols });
  }
  
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
}

// Fonction pour obtenir le WebSocket natif ou le mock
function getWebSocketImplementation() {
  if (typeof globalThis !== 'undefined' && globalThis.WebSocket) {
    return globalThis.WebSocket;
  }
  if (typeof window !== 'undefined' && window.WebSocket) {
    return window.WebSocket;
  }
  return MockWebSocket;
}

// Export par défaut
const WSImplementation = getWebSocketImplementation();
export default WSImplementation;

// Export nommé pour la compatibilité
export { WSImplementation as WebSocket };

// Constantes pour la compatibilité avec le module ws
export const CONNECTING = 0;
export const OPEN = 1;
export const CLOSING = 2;
export const CLOSED = 3;