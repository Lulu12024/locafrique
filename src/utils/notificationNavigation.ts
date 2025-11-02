// src/utils/notificationNavigation.ts
// Utilitaire pour gérer la navigation selon le type de notification

export const getNotificationRoute = (notificationType: string): string => {
  const routeMap: Record<string, string> = {
    // Notifications pour le propriétaire
    'new_booking': '/received-bookings',           // Nouvelle demande de réservation
    'equipment_approved': '/my-equipments',        // Équipement approuvé
    'equipment_rejected': '/my-equipments',        // Équipement rejeté
    
    // Notifications pour le locataire
    'booking_confirmed': '/my-bookings',           // Réservation acceptée
    'booking_rejected': '/my-bookings',            // Réservation refusée
    'rental_started': '/my-bookings',              // Location démarrée
    'rental_completed': '/my-bookings',            // Location terminée (laisser avis)
    
    // Notifications communes
    'payment_received': '/my-wallet',              // Paiement reçu
    'review_received': '/overview',                // Avis reçu
    'message_received': '/messages',               // Nouveau message
    'maintenance_reminder': '/my-equipments',      // Rappel maintenance
  };

  return routeMap[notificationType] || '/overview';
};

export const getNotificationDescription = (notificationType: string): string => {
  const descriptionMap: Record<string, string> = {
    'new_booking': 'Voir la demande de réservation',
    'equipment_approved': 'Voir votre équipement approuvé',
    'equipment_rejected': 'Voir les détails du rejet',
    'booking_confirmed': 'Voir votre réservation confirmée',
    'booking_rejected': 'Voir les autres équipements disponibles',
    'rental_started': 'Voir votre location en cours',
    'rental_completed': 'Laisser un avis',
    'payment_received': 'Voir votre portefeuille',
    'review_received': 'Voir l\'avis reçu',
    'message_received': 'Lire le message',
    'maintenance_reminder': 'Gérer la maintenance',
  };

  return descriptionMap[notificationType] || 'Voir les détails';
};