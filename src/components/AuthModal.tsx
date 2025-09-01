
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/auth";
import { SignInParams, SignUpParams } from "@/hooks/auth/index";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: "login" | "register";
}

const loginSchema = z.object({
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe d'au moins 6 caractères" }),
});

const registerSchema = z.object({
  firstName: z.string().min(2, { message: "Prénom requis" }),
  lastName: z.string().min(2, { message: "Nom requis" }),
  email: z.string().email({ message: "Email invalide" }),
  password: z.string().min(6, { message: "Mot de passe d'au moins 6 caractères" }),
  userType: z.enum(["locataire", "proprietaire"], { 
    required_error: "Veuillez sélectionner un type d'utilisateur" 
  })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
}) => {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      userType: "locataire",
    },
  });

  const handleLogin = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Tentative de connexion depuis le modal...");
      
      // Explicitly cast to SignInParams to ensure it matches the required type
      const signInData: SignInParams = {
        email: data.email,
        password: data.password
      };
      
      const result = await signIn(signInData);
      
      if (result.success) {
        console.log("Connexion réussie depuis le modal");
        onClose();
        loginForm.reset();
      } else if (result.error) {
        console.error("Erreur de connexion:", result.error);
        setError(typeof result.error === 'string' 
          ? result.error 
          : result.error.message || "Une erreur s'est produite lors de la connexion");
      }
    } catch (err) {
      console.error("Erreur inattendue lors de la connexion:", err);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Tentative d'inscription depuis le modal...");
      
      // Explicitly cast to SignUpParams to ensure it matches the required type
      const signUpData: SignUpParams = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        userType: data.userType
      };
      
      const result = await signUp(signUpData);
      
      if (result.success) {
        console.log("Inscription réussie depuis le modal");
        setMode("login");
        registerForm.reset();
        toast({
          title: "Inscription réussie",
          description: "Veuillez vous connecter avec vos identifiants.",
        });
      } else if (result.error) {
        console.error("Erreur d'inscription:", result.error);
        setError(typeof result.error === 'string' 
          ? result.error 
          : result.error.message || "Une erreur s'est produite lors de l'inscription");
      }
    } catch (err) {
      console.error("Erreur inattendue lors de l'inscription:", err);
      setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser l'état du modal à la fermeture
  const handleClose = () => {
    setError(null);
    loginForm.reset();
    registerForm.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            {mode === "login" ? "Connexion" : "Inscription"}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={mode} onValueChange={(value) => {setMode(value as "login" | "register"); setError(null);}}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login">Connexion</TabsTrigger>
            <TabsTrigger value="register">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemple.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full bg-terracotta hover:bg-terracotta/90" disabled={loading}>
                  {loading ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input placeholder="Jean" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input placeholder="Dupont" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemple.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="userType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Type de compte</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="locataire" id="mod-locataire" />
                            <Label htmlFor="mod-locataire">
                              <div className="flex flex-col">
                                <span className="font-medium">Locataire</span>
                                <span className="text-xs text-gray-500">Je souhaite louer des équipements</span>
                              </div>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="proprietaire" id="mod-proprietaire" />
                            <Label htmlFor="mod-proprietaire">
                              <div className="flex flex-col">
                                <span className="font-medium">Propriétaire</span>
                                <span className="text-xs text-gray-500">Je souhaite mettre des équipements en location</span>
                              </div>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-terracotta hover:bg-terracotta/90"
                  disabled={loading}
                >
                  {loading ? "Création en cours..." : "S'inscrire"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="sm:justify-center pt-2 text-center">
          <p className="text-xs text-center text-gray-500">
            {mode === "login"
              ? "Vous n'avez pas de compte ?"
              : "Vous avez déjà un compte ?"}
            <button
              onClick={() => {setMode(mode === "login" ? "register" : "login"); setError(null);}}
              className="text-terracotta hover:underline ml-1"
            >
              {mode === "login" ? "Inscrivez-vous" : "Connectez-vous"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
