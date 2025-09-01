
import React, { ReactNode, memo } from "react";
import { useAuth } from "@/hooks/auth";
import { useUserRoles } from "@/hooks/auth/useUserRoles";
import LinkedInDashboardLayout from "./LinkedInDashboardLayout";

interface DashboardLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  onMobileSidebarClose?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = memo(({ children }) => {
  const { user, authCheckComplete, profile } = useAuth();
  const { isProprietaire, userType } = useUserRoles(profile);

  console.log("DashboardLayout render:", {
    user: !!user,
    profile,
    isProprietaire: isProprietaire,
    userType: userType,
    authCheckComplete
  });

  return <LinkedInDashboardLayout>{children}</LinkedInDashboardLayout>;
});

DashboardLayout.displayName = "DashboardLayout";

export default DashboardLayout;
