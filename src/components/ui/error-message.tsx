
import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  className?: string;
  variant?: 'default' | 'destructive';
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = "Une erreur est survenue",
  message,
  onRetry,
  retryText = "Réessayer",
  className,
  variant = 'destructive'
}) => {
  return (
    <Alert className={cn("border-red-200 bg-red-50", className)} variant={variant}>
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium text-red-800 mb-1">{title}</div>
          <div className="text-red-700 text-sm">{message}</div>
        </div>
        {onRetry && (
          <Button 
            onClick={onRetry} 
            size="sm" 
            variant="outline"
            className="ml-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};
