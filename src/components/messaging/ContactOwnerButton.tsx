// src/components/messaging/ContactOwnerButton.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { useMessages } from '@/hooks/useMessages';
import { toast } from '@/components/ui/use-toast';

interface ContactOwnerButtonProps {
  ownerId: string;
  ownerName: string;
  equipmentId?: string;
  equipmentTitle?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

const ContactOwnerButton: React.FC<ContactOwnerButtonProps> = ({
  ownerId,
  ownerName,
  equipmentId,
  equipmentTitle,
  variant = 'default',
  size = 'default',
  className = '',
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendMessage } = useMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Message par défaut si c'est pour un équipement
  const defaultMessage = equipmentTitle
    ? `Bonjour,\n\nJe suis intéressé(e) par votre annonce "${equipmentTitle}".\n\nPouvez-vous me donner plus d'informations ?\n\nMerci !`
    : `Bonjour,\n\nJ'aimerais vous contacter.\n\nMerci !`;

  React.useEffect(() => {
    if (isOpen && !message) {
      setMessage(defaultMessage);
    }
  }, [isOpen, defaultMessage]);

  const handleSendMessage = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour envoyer un message",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message vide",
        description: "Veuillez saisir un message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);

    try {
      const success = await sendMessage(ownerId, message);

      if (success) {
        toast({
          title: "Message envoyé",
          description: "Votre message a été envoyé avec succès",
        });
        setIsOpen(false);
        setMessage('');
        
        // Rediriger vers la messagerie après 1 seconde
        setTimeout(() => {
          navigate('/messages');
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur envoi message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleClick = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour contacter le propriétaire",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Vérifier qu'on ne contacte pas soi-même
    if (user.id === ownerId) {
      toast({
        title: "Action impossible",
        description: "Vous ne pouvez pas vous contacter vous-même",
        variant: "destructive",
      });
      return;
    }

    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={handleClick}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Contacter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contacter {ownerName}</DialogTitle>
          <DialogDescription>
            {equipmentTitle
              ? `Envoyez un message au propriétaire concernant "${equipmentTitle}"`
              : `Envoyez un message à ${ownerName}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder="Votre message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSending}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactOwnerButton;