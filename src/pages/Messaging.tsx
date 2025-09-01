
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMessaging from '@/components/mobile/MobileMessaging';
import ConversationsList from '@/components/messaging/ConversationsList';
import ChatArea from '@/components/messaging/ChatArea';
import { useMessagingLogic } from '@/hooks/useMessagingLogic';

const Messaging = () => {
  const isMobile = useIsMobile();
  const messagingLogic = useMessagingLogic();

  // Si on est sur mobile, utiliser le composant mobile
  if (isMobile) {
    return <MobileMessaging />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Messagerie</h1>
          <p className="text-gray-600">Échangez avec les propriétaires et locataires</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <ConversationsList
            conversations={messagingLogic.conversations}
            selectedConversation={messagingLogic.selectedConversation}
            setSelectedConversation={messagingLogic.setSelectedConversation}
            searchTerm={messagingLogic.searchTerm}
            setSearchTerm={messagingLogic.setSearchTerm}
            loading={messagingLogic.loading}
            formatTime={messagingLogic.formatTime}
          />

          <ChatArea
            selectedConversation={messagingLogic.selectedConversation}
            user={messagingLogic.user}
            newMessage={messagingLogic.newMessage}
            setNewMessage={messagingLogic.setNewMessage}
            handleSendMessage={messagingLogic.handleSendMessage}
            formatTime={messagingLogic.formatTime}
          />
        </div>
      </div>
    </div>
  );
};

export default Messaging;
