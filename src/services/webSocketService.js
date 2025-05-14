import { API_URL } from "../config";
import authService from "./authService";

/**
 * Service pour gérer les connexions WebSocket
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.listeners = [];
    this.wsUrl = this.getWebSocketUrl();
  }

  /**
   * Convertit l'URL HTTP/HTTPS en URL WebSocket (ws/wss)
   */
  getWebSocketUrl() {
    // Extraire le domaine et le port de l'URL de l'API
    const apiUrl = new URL(API_URL);
    const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = apiUrl.host;
    
    // Utiliser le port 8080 pour WebSocket
    return `${protocol}//${host.split(':')[0]}:8080`;
  }

  /**
   * Initialise la connexion WebSocket
   */
  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket déjà connecté ou en cours de connexion');
      return;
    }

    try {
      console.log(`Connexion au serveur WebSocket: ${this.wsUrl}`);
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Erreur lors de la création de la connexion WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Gère l'ouverture de la connexion
   */
  handleOpen() {
    console.log('Connexion WebSocket établie');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Authentifier l'utilisateur
    this.authenticate();
  }

  /**
   * Authentifie l'utilisateur auprès du serveur WebSocket
   */
  authenticate() {
    const user = authService.getCurrentUser();
    if (user && user.token) {
      this.send({
        type: 'auth',
        token: user.token,
        userId: user.id
      });
      console.log('Authentification WebSocket envoyée');
    } else {
      console.warn('Impossible d\'authentifier: aucun utilisateur connecté');
    }
  }

  /**
   * Gère la réception d'un message
   */
  handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('Message WebSocket reçu:', data);
      
      // Notifier tous les écouteurs
      this.notifyListeners(data);
    } catch (error) {
      console.error('Erreur lors du traitement du message WebSocket:', error);
    }
  }

  /**
   * Gère la fermeture de la connexion
   */
  handleClose(event) {
    console.log(`Connexion WebSocket fermée: ${event.code} ${event.reason}`);
    this.isConnected = false;
    
    // Tenter de se reconnecter si la fermeture n'était pas intentionnelle
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Gère les erreurs de connexion
   */
  handleError(error) {
    console.error('Erreur WebSocket:', error);
    this.isConnected = false;
  }

  /**
   * Planifie une tentative de reconnexion
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Tentative de reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Envoie un message au serveur WebSocket
   */
  send(data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Impossible d\'envoyer le message: WebSocket non connecté');
      return false;
    }

    try {
      this.socket.send(JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message WebSocket:', error);
      return false;
    }
  }

  /**
   * Ferme la connexion WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Déconnexion volontaire');
      this.socket = null;
    }
    
    this.isConnected = false;
    clearTimeout(this.reconnectTimeout);
  }

  /**
   * Ajoute un écouteur pour les messages WebSocket
   */
  addListener(callback) {
    if (typeof callback === 'function' && !this.listeners.includes(callback)) {
      this.listeners.push(callback);
      return true;
    }
    return false;
  }

  /**
   * Supprime un écouteur
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Notifie tous les écouteurs d'un nouveau message
   */
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Erreur dans un écouteur WebSocket:', error);
      }
    });
  }
}

// Exporter une instance unique du service
const webSocketService = new WebSocketService();
export default webSocketService;
