declare global {
  interface Window {
    kkiapay: {
      open: (config: {
        amount: number;
        position?: string;
        callback?: string;
        data?: string;
        theme?: string;
        sandbox?: boolean;
        key: string;
        success?: (response: any) => void;
        failed?: (error: any) => void;
      }) => void;
    };
  }
}

export {};