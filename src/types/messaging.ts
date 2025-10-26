// src/types/messaging.ts

/**
 * Types et interfaces pour le système de messagerie
 */

// =============================================
// TYPES DE BASE
// =============================================

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  booking_id?: string | null;
}

export interface MessageInsert {
  sender_id: string;
  receiver_id: string;
  content: string;
  read?: boolean;
  booking_id?: string | null;
}

export interface MessageUpdate {
  read?: boolean;
  content?: string;
}

// =============================================
// TYPES DE PARTICIPANT
// =============================================

export interface ConversationParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  user_type?: 'particulier' | 'professionnel';
}

// =============================================
// TYPES DE CONVERSATION
// =============================================

export interface Conversation {
  id: string;
  participant: ConversationParticipant;
  messages: Message[];
  lastMessage: Message | null;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationListItem {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessageContent: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline?: boolean;
}

// =============================================
// TYPES D'ÉTAT
// =============================================

export interface MessagingState {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export interface SendMessagePayload {
  receiverId: string;
  content: string;
  bookingId?: string;
}

export interface MessageNotification {
  messageId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

// =============================================
// TYPES DE FILTRE ET TRI
// =============================================

export type MessageFilterType = 'all' | 'unread' | 'archived' | 'important';

export type MessageSortType = 'recent' | 'oldest' | 'unread-first';

export interface MessageFilters {
  type: MessageFilterType;
  searchTerm?: string;
  dateFrom?: string;
  dateTo?: string;
  participantId?: string;
}

// =============================================
// TYPES D'ACTION
// =============================================

export type MessageAction = 
  | 'mark_read'
  | 'mark_unread'
  | 'archive'
  | 'unarchive'
  | 'delete'
  | 'report'
  | 'block';

export interface MessageActionPayload {
  messageId: string;
  action: MessageAction;
  reason?: string;
}

// =============================================
// TYPES DE STATISTIQUES
// =============================================

export interface MessagingStats {
  totalConversations: number;
  totalMessages: number;
  unreadMessages: number;
  averageResponseTime: number; // en minutes
  mostActiveConversation: string | null;
}

// =============================================
// TYPES D'ÉVÉNEMENT REAL-TIME
// =============================================

export type RealtimeEventType = 
  | 'message_received'
  | 'message_read'
  | 'user_typing'
  | 'user_online'
  | 'user_offline';

export interface RealtimeEvent {
  type: RealtimeEventType;
  data: any;
  timestamp: string;
  userId?: string;
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
  isTyping: boolean;
}

export interface OnlineStatusEvent {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

// =============================================
// TYPES DE PARAMÈTRES DE HOOK
// =============================================

export interface UseMessagesOptions {
  autoFetch?: boolean;
  enableRealtime?: boolean;
  pollInterval?: number; // en millisecondes
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
}

export interface UseConversationOptions {
  conversationId: string;
  markAsReadOnOpen?: boolean;
  loadHistory?: boolean;
  historyLimit?: number;
}

// =============================================
// TYPES DE RÉPONSE API
// =============================================

export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface SendMessageResponse {
  success: boolean;
  message?: Message;
  error?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  hasMore: boolean;
}

// =============================================
// TYPES DE VALIDATION
// =============================================

export interface MessageValidation {
  isValid: boolean;
  errors: string[];
}

export const MESSAGE_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 5000,
  MAX_ATTACHMENTS: 5,
  ALLOWED_ATTACHMENT_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024, // 5MB
} as const;

// =============================================
// TYPES D'ERREUR
// =============================================

export class MessagingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MessagingError';
  }
}

export enum MessagingErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  MESSAGE_TOO_LONG = 'MESSAGE_TOO_LONG',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CONVERSATION_NOT_FOUND = 'CONVERSATION_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
}

// =============================================
// TYPES DE CONFIGURATION
// =============================================

export interface MessagingConfig {
  enableRealtime: boolean;
  enableNotifications: boolean;
  enableTypingIndicator: boolean;
  enableOnlineStatus: boolean;
  messageRetentionDays: number;
  maxMessageLength: number;
  autoMarkAsRead: boolean;
  pollInterval: number;
}

export const DEFAULT_MESSAGING_CONFIG: MessagingConfig = {
  enableRealtime: true,
  enableNotifications: true,
  enableTypingIndicator: true,
  enableOnlineStatus: true,
  messageRetentionDays: 90,
  maxMessageLength: 5000,
  autoMarkAsRead: true,
  pollInterval: 30000, // 30 secondes
};

// =============================================
// TYPES UTILITAIRES
// =============================================

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export type ConversationType = 'direct' | 'group' | 'support';

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';

// =============================================
// GUARDS DE TYPE (Type Guards)
// =============================================

export function isMessage(obj: any): obj is Message {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'sender_id' in obj &&
    'receiver_id' in obj &&
    'content' in obj &&
    'created_at' in obj
  );
}

export function isConversation(obj: any): obj is Conversation {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'participant' in obj &&
    'messages' in obj &&
    Array.isArray(obj.messages)
  );
}

// =============================================
// TYPES POUR WEBSOCKET/REAL-TIME
// =============================================

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'read' | 'status';
  payload: any;
  timestamp: number;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: number;
}

// =============================================
// EXPORT DES CONSTANTES
// =============================================

export const MESSAGING_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 5000,
  MAX_CONVERSATION_NAME_LENGTH: 100,
  TYPING_TIMEOUT: 3000, // 3 secondes
  ONLINE_TIMEOUT: 300000, // 5 minutes
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 seconde
} as const;