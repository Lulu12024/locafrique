// src/pages/NotificationSettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Bell, 
  Mail, 
  MessageCircle, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  Smartphone,
  Volume2,
  VolumeX,
  Clock,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface NotificationPreferences {
  // Notifications par email
  email_bookings: boolean;
  email_payments: boolean;
  email_messages: boolean;
  email_marketing: boolean;
  email_security: boolean;
  
  // Notifications push
  push_bookings: boolean;
  push_payments: boolean;
  push_messages: boolean;
  push_reminders: boolean;
  
  // Paramètres généraux
  sound_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
}

const NotificationSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_bookings: true,
    email_payments: true,
    email_messages: true,
    email_marketing: false,
    email_security: true,
    push_bookings: true,
    push_payments: true,
    push_messages: true,
    push_reminders: true,
    sound_enabled: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    digest_frequency: 'immediate'
  });

  useEffect(() => {
    checkPushSupport();
    loadPreferences();
  }, [user]);

  const checkPushSupport = () => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSupported(isSupported);
  };

  const loadPreferences = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Charger les préférences depuis la base de données
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          email_bookings: data.email_bookings ?? true,
          email_payments: data.email_payments ?? true,
          email_messages: data.email_messages ?? true,
          email_marketing: data.email_marketing ?? false,
          email_security: data.email_security ?? true,
          push_bookings: data.push_bookings ?? true,
          push_payments: data.push_payments ?? true,
          push_messages: data.push_messages ?? true,
          push_reminders: data.push_reminders ?? true,
          sound_enabled: data.sound_enabled ?? true,
          quiet_hours_start: data.quiet_hours_start ?? '22:00',
          quiet_hours_end: data.quiet_hours_end ?? '08:00',
          digest_frequency: data.digest_frequency ?? 'immediate'
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des préférences:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos préférences de notification.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user?.id) return;

    try {
      setIsSaving(true);

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences de notification ont été mises à jour.",
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateTimePreference = (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const requestPushPermission = async () => {
    if (!pushSupported) return;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications activées",
          description: "Vous recevrez maintenant des notifications push.",
        });
        // Ici vous pourriez enregistrer le token FCM/VAPID
      } else {
        toast({
          title: "Notifications refusées",
          description: "Vous ne recevrez pas de notifications push.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erreur permission notifications:', error);
    }
  };

  const notificationCategories = [
    {
      title: 'Réservations',
      description: 'Nouvelles réservations et mises à jour',
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      emailKey: 'email_bookings' as keyof NotificationPreferences,
      pushKey: 'push_bookings' as keyof NotificationPreferences
    },
    {
      title: 'Paiements',
      description: 'Confirmations et rappels de paiement',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      emailKey: 'email_payments' as keyof NotificationPreferences,
      pushKey: 'push_payments' as keyof NotificationPreferences
    },
    {
      title: 'Messages',
      description: 'Nouveaux messages et conversations',
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      emailKey: 'email_messages' as keyof NotificationPreferences,
      pushKey: 'push_messages' as keyof NotificationPreferences
    },
    {
      title: 'Sécurité',
      description: 'Alertes de sécurité importantes',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      emailKey: 'email_security' as keyof NotificationPreferences,
      pushKey: null
    }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p>Veuillez vous connecter pour accéder aux paramètres.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        // VERSION MOBILE
        <div className="pb-6">
          {/* Header mobile */}
          <div className="bg-white border-b border-gray-200 px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-600">Configurez vos préférences</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Push notification status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Notifications push
                  </div>
                  {Notification.permission === 'granted' ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activées
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Désactivées</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Notification.permission !== 'granted' && pushSupported && (
                  <Button onClick={requestPushPermission} className="w-full">
                    Activer les notifications push
                  </Button>
                )}
                {!pushSupported && (
                  <p className="text-sm text-gray-600">
                    Les notifications push ne sont pas supportées sur cet appareil.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Notification categories */}
            {notificationCategories.map((category) => (
              <Card key={category.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${category.bgColor}`}>
                      <category.icon className={`h-5 w-5 ${category.color}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{category.title}</h3>
                      <p className="text-sm text-gray-600 font-normal">{category.description}</p>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch
                      checked={preferences[category.emailKey]}
                      onCheckedChange={() => togglePreference(category.emailKey)}
                    />
                  </div>
                  
                  {category.pushKey && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">Push</span>
                      </div>
                      <Switch
                        checked={preferences[category.pushKey]}
                        onCheckedChange={() => togglePreference(category.pushKey)}
                        disabled={Notification.permission !== 'granted'}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* General settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Paramètres généraux
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sons de notification</Label>
                    <p className="text-sm text-gray-600">Jouer un son lors des notifications</p>
                  </div>
                  <Switch
                    checked={preferences.sound_enabled}
                    onCheckedChange={() => togglePreference('sound_enabled')}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing</Label>
                    <p className="text-sm text-gray-600">Offres et promotions</p>
                  </div>
                  <Switch
                    checked={preferences.email_marketing}
                    onCheckedChange={() => togglePreference('email_marketing')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quiet hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Heures silencieuses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quiet_start">Début</Label>
                  <input
                    id="quiet_start"
                    type="time"
                    value={preferences.quiet_hours_start}
                    onChange={(e) => updateTimePreference('quiet_hours_start', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <Label htmlFor="quiet_end">Fin</Label>
                  <input
                    id="quiet_end"
                    type="time"
                    value={preferences.quiet_hours_end}
                    onChange={(e) => updateTimePreference('quiet_hours_end', e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save button */}
            <Button 
              onClick={savePreferences} 
              className="w-full" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                'Sauvegarder les préférences'
              )}
            </Button>
          </div>
        </div>
      ) : (
        // VERSION DESKTOP
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header desktop */}
          <div className="flex items-center gap-6 mb-8">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Préférences de notification</h1>
              <p className="text-gray-600">Gérez comment et quand vous souhaitez être notifié</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="col-span-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    État des notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <span className="text-sm font-medium">Push</span>
                    </div>
                    {Notification.permission === 'granted' ? (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Activées
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Désactivées</Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Activées
                    </Badge>
                  </div>

                  {Notification.permission !== 'granted' && pushSupported && (
                    <Button onClick={requestPushPermission} className="w-full mt-4">
                      Activer les notifications push
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="col-span-8 space-y-6">
              {/* Notification categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Types de notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {notificationCategories.map((category) => (
                      <div key={category.title} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${category.bgColor} flex-shrink-0`}>
                            <category.icon className={`h-6 w-6 ${category.color}`} />
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-1">{category.title}</h3>
                            <p className="text-gray-600 text-sm mb-4">{category.description}</p>
                            
                            <div className="flex gap-8">
                              <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium">Email</span>
                                <Switch
                                  checked={preferences[category.emailKey]}
                                  onCheckedChange={() => togglePreference(category.emailKey)}
                                />
                              </div>
                              
                              {category.pushKey && (
                                <div className="flex items-center gap-3">
                                  <Bell className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm font-medium">Push</span>
                                  <Switch
                                    checked={preferences[category.pushKey]}
                                    onCheckedChange={() => togglePreference(category.pushKey)}
                                    disabled={Notification.permission !== 'granted'}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* General settings */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5" />
                      Paramètres généraux
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sons de notification</Label>
                        <p className="text-sm text-gray-600">Jouer un son</p>
                      </div>
                      <Switch
                        checked={preferences.sound_enabled}
                        onCheckedChange={() => togglePreference('sound_enabled')}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Marketing</Label>
                        <p className="text-sm text-gray-600">Offres et promotions</p>
                      </div>
                      <Switch
                        checked={preferences.email_marketing}
                        onCheckedChange={() => togglePreference('email_marketing')}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Heures silencieuses
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="quiet_start_desktop">Début</Label>
                      <input
                        id="quiet_start_desktop"
                        type="time"
                        value={preferences.quiet_hours_start}
                        onChange={(e) => updateTimePreference('quiet_hours_start', e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiet_end_desktop">Fin</Label>
                      <input
                        id="quiet_end_desktop"
                        type="time"
                        value={preferences.quiet_hours_end}
                        onChange={(e) => updateTimePreference('quiet_hours_end', e.target.value)}
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Annuler
                </Button>
                <Button 
                  onClick={savePreferences} 
                  disabled={isSaving}
                  className="min-w-32"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    'Sauvegarder'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPage;