
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPanelProps {
  title: string;
}

const PlaceholderPanel: React.FC<PlaceholderPanelProps> = ({ title }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          Cette fonctionnalité sera bientôt disponible
        </div>
      </CardContent>
    </Card>
  );
};

export default PlaceholderPanel;
