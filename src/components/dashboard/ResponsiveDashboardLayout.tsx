
import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileDashboardHeader from "./MobileDashboardHeader";
import MobileSidebar from "./MobileSidebar";
import LinkedInSidebar from "./LinkedInSidebar";

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  activeTab,
  setActiveTab
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleMobileSidebarToggle = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header - Only visible on mobile */}
      {isMobile && (
        <MobileDashboardHeader onMenuToggle={handleMobileSidebarToggle} />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={handleMobileSidebarClose}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      <div className="flex w-full">
        {/* Desktop Sidebar - Hidden on mobile */}
        {!isMobile && (
          <div className="w-[280px] flex-shrink-0">
            <LinkedInSidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
            />
          </div>
        )}

        {/* Main Content */}
        <div className={`flex-1 ${
          isMobile 
            ? 'px-3 py-3 pt-[72px]' // Reduced padding on mobile, adjusted for header
            : 'pl-6 pr-4 py-6'
        }`}>
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
            isMobile 
              ? 'min-h-[calc(100vh-90px)]' // Optimized height for mobile
              : 'min-h-[calc(100vh-8rem)]'
          }`}>
            <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveDashboardLayout;
