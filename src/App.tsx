
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import { NotificationSystem } from "@/components/NotificationSystem";
import { MobileOptimizedLayout } from "@/components/mobile/MobileOptimizedLayout";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import EquipmentDetail from "./pages/EquipmentDetail";
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

function App() {
  return (
    <Router>
      <MobileOptimizedLayout>
        <div className="min-h-screen bg-background font-sans antialiased">
          <Navbar />
          <NotificationSystem />
          <Toaster />
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/search" element={<Search />} />
          <Route path="/equipments/details/:id" element={<EquipmentDetail />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/become-owner" element={<BecomeOwner />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/wallet-recharge-success" element={<WalletRechargeSuccess />} />
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
          </Route>
        </Routes>
        </div>
      </MobileOptimizedLayout>
    </Router>
  );
}

export default App;
