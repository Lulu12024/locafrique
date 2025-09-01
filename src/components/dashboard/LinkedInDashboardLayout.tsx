
import React, { ReactNode, memo } from "react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";

interface LinkedInDashboardLayoutProps {
  children: ReactNode;
}

const LinkedInDashboardLayout: React.FC<LinkedInDashboardLayoutProps> = memo(({ children }) => {
  const { user, authCheckComplete } = useAuth();

  if (!authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {children}
      </div>
    </div>
  );
});

LinkedInDashboardLayout.displayName = "LinkedInDashboardLayout";

export default LinkedInDashboardLayout;
