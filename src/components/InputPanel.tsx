
'use client';

import type { ChangeEvent } from 'react';
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, UploadCloud, DollarSign, Calculator, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TipJarLogo } from '@/components/TipJarLogo'; // Import the logo

interface InputPanelProps {
  totalTipPoolStr: string;
  onTotalTipPoolChange: (value: string) => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onCalculateTips: () => void;
  isOcrProcessing: boolean;
  ocrError: string | null;
  fileProcessingError: string | null;
  selectedFileName: string | null;
  isCalculating: boolean;
  calculationError: string | null;
  hasPartnerInputs: boolean;
}

export default function InputPanel({
  totalTipPoolStr,
  onTotalTipPoolChange,
  onFileChange,
  onCalculateTips,
  isOcrProcessing,
  ocrError,
  fileProcessingError,
  selectedFileName,
  isCalculating,
  calculationError,
  hasPartnerInputs,
}: InputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const totalTipPool = parseFloat(totalTipPoolStr) || 0;

  return (
    <div className="space-y-4">
      <header className="text-center mb-3 md:hidden flex justify-center">
        <TipJarLogo className="h-12" /> {/* Use logo, adjust size as needed */}
      </header>
      <Card className="bg-card shadow-xl rounded-xl">
        <CardHeader>
          <CardTitle className="font-sans text-sm sm:text-base flex items-center text-card-foreground">
            <ClipboardList className="mr-2 h-4 w-4 text-accent" />
            Tips Distribution Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center p-3 bg-background/50 rounded-lg border border-border">
            <UploadCloud className="mx-auto h-8 w-8 text-accent mb-1.5" />
            <p className="text-xs text-muted-foreground mb-2">Upload partner hours report (PDF, JPG, PNG)</p>
            <Button
              onClick={handleUploadButtonClick}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm"
              disabled={isOcrProcessing}
              size="sm"
            >
              {isOcrProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isOcrProcessing ? 'Processing...' : 'Upload Report'}
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              aria-label="Upload partner hours report"
            />
            {selectedFileName && !isOcrProcessing && !ocrError && !fileProcessingError && (
              <p className="mt-1.5 text-xs text-green-400">File: {selectedFileName}</p>
            )}
            {(ocrError || fileProcessingError) && (
              <p className="mt-1.5 text-xs text-destructive flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 mr-1" /> {ocrError || fileProcessingError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="total-tip-pool" className="flex items-center text-xs font-medium mb-1 text-card-foreground">
              <DollarSign className="h-3.5 w-3.5 mr-1.5 text-accent" />
              Total Tip Amount
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-muted-foreground text-xs">
                $
              </span>
              <Input
                id="total-tip-pool"
                type="number"
                value={totalTipPoolStr}
                onChange={(e) => onTotalTipPoolChange(e.target.value)}
                placeholder="0.00"
                className="pl-6 pr-2 py-1.5 bg-input border-border rounded-md focus:ring-primary focus:border-primary text-foreground text-sm h-9"
                min="0"
                step="0.01"
                aria-label="Total tip amount"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={onCalculateTips}
        disabled={isCalculating || isOcrProcessing || !hasPartnerInputs || totalTipPool <= 0}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md text-sm"
      >
        {isCalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
        {isCalculating ? 'Calculating...' : 'Calculate Distribution'}
      </Button>

      {calculationError && (
        <Alert variant="destructive" className="mt-3 shadow-md rounded-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-sans text-xs">Calculation Error</AlertTitle>
          <AlertDescription className="font-sans text-xs">{calculationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

