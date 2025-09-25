// src/App.tsx - Section des routes à modifier (ajoutez la ligne marquée d'un commentaire)

import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { NotificationSystem } from "@/components/NotificationSystem";
import { MobileOptimizedLayout } from "@/components/mobile/MobileOptimizedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import EquipmentDetail from "./pages/EquipmentDetail";
import OwnerProfile from "./pages/OwnerProfile"; // AJOUT DE L'IMPORT
import Overview from "./pages/Overview";
import Messaging from "./pages/Messaging";
import HowItWorks from "./pages/HowItWorks";
import BecomeOwner from "./pages/BecomeOwner";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Favorites from "./pages/Favorites";
import Activity from "./pages/Activity";
import { RequireAuth } from "@/components/auth/RequireAuth";
import MyEquipments from "./pages/MyEquipments";
import MyBookings from "./pages/MyBookings";
import MyContracts from "./pages/MyContracts";
import MyWallet from "./pages/MyWallet";
import MyHistory from "./pages/MyHistory";
import MySettings from "./pages/MySettings";
import PaymentSuccess from "./pages/PaymentSuccess";
import WalletRechargeSuccess from '@/pages/WalletRechargeSuccess';
import { OwnerDashboard } from "./pages/OwnerDashboard";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import SecuritySettingsPage from "./pages/SecuritySettingsPage";


// Composant pour gérer le layout conditionnel
function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  
  // Pages qui ne doivent PAS avoir la navigation (navbar + bottom navigation)
  const detailPages = [
    '/equipments/details',
    '/owner/profile' , // AJOUT DE LA PAGE OWNER PROFILE
    '/settings'
  ];
  
  // Vérifier si on est sur une page de détails
  const isDetailPage = detailPages.some(path => location.pathname.startsWith(path));
  
  if (isDetailPage) {
    // Pour les pages de détails : pas de navigation
    return (
      <div className="min-h-screen bg-background font-sans antialiased">
        <NotificationSystem />
        <Toaster />
        {children}
      </div>
    );
  }
  
  // Pour les autres pages : navigation normale
  return (
    <MobileOptimizedLayout>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <NotificationSystem />
        <Toaster />
        {children}
      </div>
    </MobileOptimizedLayout>
  );
}

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/search" element={<Search />} />
          <Route path="/equipments/details/:id" element={<EquipmentDetail />} />
          <Route path="/owner/profile/:id" element={<OwnerProfile />} />  {/* NOUVELLE ROUTE */}
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/become-owner" element={<BecomeOwner />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/wallet-recharge-success" element={<WalletRechargeSuccess />} />
          <Route path="/owner/myprofile/:id" element={<OwnerProfile />} />
          
          {/* Protected Routes */}
          <Route element={<RequireAuth />}>
            <Route path="/overview" element={<Overview />} />
            <Route path="/messaging" element={<Messaging />} />
            <Route path="/my-equipments" element={<MyEquipments />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/my-contracts" element={<MyContracts />} />
            <Route path="/my-wallet" element={<MyWallet />} />
            <Route path="/my-history" element={<MyHistory />} />
            <Route path="/my-settings" element={<MySettings />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/owner-dashboard" element={<OwnerDashboard />} />
            <Route path="/received-bookings" element={<OwnerDashboard />} />

            <Route path="/settings/profile" element={<ProfileSettingsPage />} />
            <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
            <Route path="/settings/security" element={<SecuritySettingsPage />} />
          </Route>
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;