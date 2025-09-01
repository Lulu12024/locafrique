
import React from "react";
import StatsCards from "./StatsCards";
import RecentActivity from "./RecentActivity";

interface LinkedInStatsPanelProps {
  onActionClick?: (action: string) => void;
}

const LinkedInStatsPanel: React.FC<LinkedInStatsPanelProps> = ({ onActionClick = () => {} }) => {
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p className="text-sm sm:text-base text-gray-600">Voici un aperçu de votre activité</p>
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Recent Activity - Now taking full width */}
      <div className="mt-4 sm:mt-6">
        <RecentActivity />
      </div>
    </div>
  );
};

export default LinkedInStatsPanel;
