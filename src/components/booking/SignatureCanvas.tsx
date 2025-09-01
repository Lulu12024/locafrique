
import React, { useRef } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button } from '@/components/ui/button';

interface SignatureCanvasProps {
  onSave: (signature: string) => void;
}

export function SignatureCanvas({ onSave }: SignatureCanvasProps) {
  const sigCanvas = useRef<SignaturePad>(null);
  
  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };
  
  const save = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      const signatureData = sigCanvas.current.toDataURL();
      onSave(signatureData);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="border border-gray-300 rounded-md bg-white">
        <SignaturePad
          ref={sigCanvas}
          canvasProps={{
            className: "w-full h-40"
          }}
        />
      </div>
      
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={clear}>
          Effacer
        </Button>
        <Button onClick={save}>
          Signer
        </Button>
      </div>
    </div>
  );
}
