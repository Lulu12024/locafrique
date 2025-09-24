// src/pages/SecuritySettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Key, 
  Smartphone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  MapPin,
  Monitor,
  Loader2,
  LogOut,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/hooks/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface LoginSession {
  id: string;
  ip_address: string;
  user_agent: string;
  location?: string;
  last_active: string;
  is_current: boolean;
}

const SecuritySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[]
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);

  useEffect(() => {
    loadSecurityData();
  }, [user]);

  useEffect(() => {
    checkPasswordStrength(passwordForm.newPassword);
  }, [passwordForm.newPassword]);

  const loadSecurityData = async () => {
    if (!user?.id) return;

    try {
      // Charger les sessions (simulées pour cet exemple)
      const mockSessions: LoginSession[] = [
        {
          id: '1',
          ip_address: '192.168.1.1',
          user_agent: 'Chrome 120.0.0.0 Windows',
          location: 'Cotonou, Bénin',
          last_active: new Date().toISOString(),
          is_current: true
        },
        {
          id: '2',
          ip_address: '41.202.219.10',
          user_agent: 'Safari 17.0 iPhone',
          location: 'Porto-Novo, Bénin',
          last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          is_current: false
        }
      ];
      setSessions(mockSessions);

      // Charger les événements de sécurité
      const mockEvents = [
        {
          id: '1',
          type: 'login',
          description: 'Connexion réussie',
          timestamp: new Date().toISOString(),
          ip_address: '192.168.1.1'
        },
        {
          id: '2',
          type: 'password_change',
          description: 'Mot de passe modifié',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          ip_address: '192.168.1.1'
        }
      ];
      setSecurityEvents(mockEvents);

    } catch (error) {
      console.error('Erreur lors du chargement des données de sécurité:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const checkPasswordStrength = (password: string) => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: [] });
      return;
    }

    const feedback: string[] = [];
    let score = 0;

    // Longueur
    if (password.length >= 8) score += 1;
    else feedback.push('Au moins 8 caractères');

    // Majuscules
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Au moins une majuscule');

    // Minuscules
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Au moins une minuscule');

    // Chiffres
    if (/\d/.test(password)) score += 1;
    else feedback.push('Au moins un chiffre');

    // Caractères spéciaux
    if (/[!@#$%^&*]/.test(password)) score += 1;
    else feedback.push('Au moins un caractère spécial');

    setPasswordStrength({ score, feedback });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive"
      });
      return;
    }

    if (passwordStrength.score < 3) {
      toast({
        title: "Mot de passe faible",
        description: "Votre mot de passe doit être plus sécurisé.",
        variant: "destructive"
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le mot de passe.",
        variant: "destructive"
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSessionRevoke = async (sessionId: string) => {
    try {
      // Simuler la révocation de session
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      toast({
        title: "Session fermée",
        description: "La session a été fermée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de fermer cette session.",
        variant: "destructive"
      });
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      // Garder seulement la session courante
      setSessions(prev => prev.filter(session => session.is_current));
      toast({
        title: "Sessions fermées",
        description: "Toutes les autres sessions ont été fermées.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de fermer les sessions.",
        variant: "destructive"
      });
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1: return 'bg-red-500';
      case 2:
      case 3: return 'bg-yellow-500';
      case 4:
      case 5: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1: return 'Très faible';
      case 2:
      case 3: return 'Moyen';
      case 4:
      case 5: return 'Fort';
      default: return 'Aucun';
    }
  };

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
                <h1 className="text-xl font-bold text-gray-900">Sécurité</h1>
                <p className="text-sm text-gray-600">Mot de passe et authentification</p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Security status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  État de la sécurité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Email vérifié</span>
                    </div>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">2FA désactivée</span>
                    </div>
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Change password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    {passwordForm.newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div 
                              className={`h-full rounded transition-all ${getPasswordStrengthColor(passwordStrength.score)}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">
                            {getPasswordStrengthLabel(passwordStrength.score)}
                          </span>
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <ul className="text-xs text-gray-600 list-disc list-inside">
                            {passwordStrength.feedback.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isChangingPassword || passwordStrength.score < 3}
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      'Changer le mot de passe'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Active sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Sessions actives
                  </div>
                  <Badge variant="secondary">{sessions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSessions ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {session.user_agent.split(' ')[0]}
                            </span>
                            {session.is_current && (
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                Session actuelle
                              </Badge>
                            )}
                          </div>
                          {!session.is_current && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSessionRevoke(session.id)}
                            >
                              <LogOut className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {session.location} • {session.ip_address}
                        </p>
                        <p className="text-xs text-gray-500">
                          Dernière activité: {new Date(session.last_active).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    ))}

                    {sessions.filter(s => !s.is_current).length > 0 && (
                      <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={handleRevokeAllSessions}
                      >
                        Fermer toutes les autres sessions
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent security events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {securityEvents.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2">
                      <div className="p-1 bg-blue-100 rounded">
                        <Shield className="h-3 w-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{event.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleString('fr-FR')} • {event.ip_address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
              <h1 className="text-3xl font-bold text-gray-900">Sécurité et authentification</h1>
              <p className="text-gray-600">Protégez votre compte avec des paramètres de sécurité avancés</p>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Security status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    État de la sécurité
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Email vérifié</span>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-red-600" />
                      <span className="font-medium">2FA désactivée</span>
                    </div>
                    <XCircle className="h-5 w-5 text-red-600" />
                  </div>

                  <Button className="w-full mt-4" variant="outline">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Activer l'authentification 2FA
                  </Button>
                </CardContent>
              </Card>

              {/* Quick actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleRevokeAllSessions}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Fermer toutes les sessions
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <History className="h-4 w-4 mr-2" />
                    Voir l'historique complet
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Main content */}
            <div className="col-span-8 space-y-6">
              {/* Change password */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Changer le mot de passe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="currentPasswordDesktop">Mot de passe actuel</Label>
                        <div className="relative">
                          <Input
                            id="currentPasswordDesktop"
                            type={showCurrentPassword ? "text" : "password"}
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                            required
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="newPasswordDesktop">Nouveau mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="newPasswordDesktop"
                              type={showNewPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              required
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="confirmPasswordDesktop">Confirmer le mot de passe</Label>
                          <div className="relative">
                            <Input
                              id="confirmPasswordDesktop"
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              required
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 -translate-y-1/2"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {passwordForm.newPassword && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="text-sm font-medium">Force du mot de passe:</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded">
                            <div 
                              className={`h-full rounded transition-all ${getPasswordStrengthColor(passwordStrength.score)}`}
                              style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {getPasswordStrengthLabel(passwordStrength.score)}
                          </span>
                        </div>
                        {passwordStrength.feedback.length > 0 && (
                          <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                            {passwordStrength.feedback.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-4">
                      <Button type="button" variant="outline">
                        Annuler
                      </Button>
                      <Button 
                        type="submit"
                        disabled={isChangingPassword || passwordStrength.score < 3}
                      >
                        {isChangingPassword ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Modification...
                          </>
                        ) : (
                          'Changer le mot de passe'
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Active sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Sessions actives
                    </div>
                    <Badge variant="secondary">{sessions.length} sessions</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSessions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sessions.map((session) => (
                        <div key={session.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Monitor className="h-5 w-5 text-blue-600" />
                              </div>
                              
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{session.user_agent}</span>
                                  {session.is_current && (
                                    <Badge className="bg-green-100 text-green-800">
                                      Session actuelle
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {session.location} • {session.ip_address}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Dernière activité: {new Date(session.last_active).toLocaleString('fr-FR')}
                                </div>
                              </div>
                            </div>

                            {!session.is_current && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSessionRevoke(session.id)}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Fermer
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}

                      {sessions.filter(s => !s.is_current).length > 0 && (
                        <div className="flex justify-end pt-4 border-t">
                          <Button variant="outline" onClick={handleRevokeAllSessions}>
                            Fermer toutes les autres sessions
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Activité de sécurité récente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {securityEvents.map((event) => (
                      <div key={event.id} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(event.timestamp).toLocaleString('fr-FR')} • {event.ip_address}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecuritySettingsPage;