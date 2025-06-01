
'use client';

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { extractTipDataFromImage, type ExtractTipDataFromImageInput, type ExtractTipDataFromImageOutput } from '@/ai/flows/extract-tip-data-from-image';
import { calculateIndividualTips, calculateTotalBillBreakdown, allocateBills } from '@/lib/tip-calculator';
import type { PartnerInputData, CalculatedPartnerTipData, BillBreakdown } from '@/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import InputPanel from '@/components/InputPanel';
import { PartnerResultCard } from '@/components/PartnerResultCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, AlertTriangle, Sparkles, LayoutGrid, Settings2, ListChecks, Sigma, Users, CalendarDays, Hourglass, TrendingUp, Wallet, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Helper function to convert File to Data URI
const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function HomePage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [partnerInputs, setPartnerInputs] = useLocalStorage<PartnerInputData[] | null>('tipjar_partnerInputs', null);
  const [totalTipPoolStr, setTotalTipPoolStr] = useLocalStorage<string>('tipjar_totalTipPoolStr', '');
  
  const [calculatedResults, setCalculatedResults] = useState<CalculatedPartnerTipData[] | null>(null);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileProcessingError, setFileProcessingError] = useState<string | null>(null);
  const [distributionDate, setDistributionDate] = useState<Date | null>(null);
  
  const totalTipPool = parseFloat(totalTipPoolStr) || 0;

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setOcrError(null);
    setFileProcessingError(null);
    setSelectedFileName(null);
    setPartnerInputs(null); // Clear previous inputs
    setCalculatedResults(null); // Clear previous results
    setDistributionDate(null);

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setFileProcessingError('Invalid file type. Please upload PDF, JPG, or PNG.');
        toast({ title: 'File Error', description: 'Invalid file type. Please upload PDF, JPG, or PNG.', variant: 'destructive' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setFileProcessingError('File is too large. Maximum size is 10MB.');
        toast({ title: 'File Error', description: 'File is too large. Maximum size is 10MB.', variant: 'destructive' });
        return;
      }
      
      setSelectedFileName(file.name);
      setIsOcrProcessing(true);
      try {
        const dataUri = await fileToDataUri(file);
        const input: ExtractTipDataFromImageInput = { photoDataUri: dataUri };
        const result: ExtractTipDataFromImageOutput = await extractTipDataFromImage(input);
        
        if (result.partnerData && result.partnerData.length > 0) {
          setPartnerInputs(result.partnerData.map(p => ({...p, partnerNumber: p.partnerNumber || `PN-${Math.random().toString(36).substr(2, 5).toUpperCase()}`}))); // Ensure partnerNumber for key
          toast({
            title: 'Report Processed!',
            description: `${result.partnerData.length} partners found. Enter total tip pool to calculate.`,
          });
        } else {
          setOcrError('No partner data found in the uploaded file. Try a clearer image or check content.');
          toast({ title: 'OCR Issue', description: 'No partner data found.', variant: 'destructive' });
        }
      } catch (error) {
        console.error('OCR or File Read Error:', error);
        let errorMessage = 'Failed to process the report. Please try again.';
        if (error instanceof Error) errorMessage = error.message;
        setOcrError(errorMessage);
        toast({ title: 'Processing Error', description: errorMessage, variant: 'destructive' });
      } finally {
        setIsOcrProcessing(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleCalculateTips = () => {
    setCalculationError(null);
    if (!partnerInputs || partnerInputs.length === 0) {
      setCalculationError('No partner data available. Please upload and process a report first.');
      return;
    }
    if (totalTipPool <= 0) {
      setCalculationError('Total tip pool must be a positive number.');
      return;
    }

    setIsCalculating(true);
    setDistributionDate(new Date()); 
    setTimeout(() => {
      try {
        const results = calculateIndividualTips(partnerInputs, totalTipPool);
        setCalculatedResults(results);
        toast({
          title: 'Tips Calculated!',
          description: 'Distribution summary and details are now available.',
          action: <Sparkles className="h-5 w-5 text-accent" />,
        });
      } catch (error) {
        console.error('Calculation Error:', error);
        let errorMessage = 'An error occurred during tip calculation.';
        if (error instanceof Error) errorMessage = error.message;
        setCalculationError(errorMessage);
        toast({ title: 'Calculation Error', description: errorMessage, variant: 'destructive' });
      } finally {
        setIsCalculating(false);
      }
    }, 300); 
  };
  
  useEffect(() => {
    setCalculatedResults(null); 
    setDistributionDate(null);
  }, [partnerInputs, totalTipPoolStr]);

  const totalHoursFromInputs = useMemo(() => {
    return partnerInputs?.reduce((sum, p) => sum + p.hoursWorked, 0) || 0;
  }, [partnerInputs]);

  const rawRatePreTruncation = useMemo(() => {
    if (totalHoursFromInputs > 0 && totalTipPool > 0) {
      return totalTipPool / totalHoursFromInputs;
    }
    return 0;
  }, [totalTipPool, totalHoursFromInputs]);

  const baseTruncatedHourlyRate = useMemo(() => {
    if (totalHoursFromInputs > 0 && totalTipPool > 0) {
      return Math.floor(rawRatePreTruncation * 100) / 100;
    }
    return 0;
  }, [rawRatePreTruncation, totalTipPool, totalHoursFromInputs]);


  const calculationStepDetails = useMemo(() => {
    if (!partnerInputs || totalTipPool <= 0 || totalHoursFromInputs <= 0) {
      return null;
    }
    const totalTipPoolInCents = Math.round(totalTipPool * 100);
    
    let sumOfBaseMaterializedTips = 0;
    partnerInputs.forEach(p => {
        sumOfBaseMaterializedTips += p.hoursWorked * baseTruncatedHourlyRate;
    });
    const sumOfBaseMaterializedTipsInCents = Math.round(sumOfBaseMaterializedTips * 100);
    const centsToRedistribute = totalTipPoolInCents - sumOfBaseMaterializedTipsInCents;

    return {
      totalTipPoolDisplay: totalTipPool.toFixed(2),
      totalHoursFromInputsDisplay: totalHoursFromInputs.toFixed(2),
      rawRatePreTruncationDisplay: rawRatePreTruncation.toFixed(6),
      baseTruncatedHourlyRateDisplay: baseTruncatedHourlyRate.toFixed(2),
      sumOfBaseMaterializedTipsDisplay: (sumOfBaseMaterializedTipsInCents / 100).toFixed(2),
      totalTipPoolInCentsDisplay: totalTipPoolInCents,
      sumOfBaseMaterializedTipsInCentsDisplay: sumOfBaseMaterializedTipsInCents,
      centsToRedistributeDisplay: centsToRedistribute,
    };
  }, [partnerInputs, totalTipPool, totalHoursFromInputs, baseTruncatedHourlyRate, rawRatePreTruncation]);


  const totalHoursCalculated = calculatedResults?.reduce((sum, r) => sum + r.hoursWorked, 0) || 0;
  const totalTipsDistributed = calculatedResults?.reduce((sum, r) => sum + r.calculatedTip, 0) || 0;
  const totalBillsNeeded = calculatedResults ? calculateTotalBillBreakdown(calculatedResults) : allocateBills(0);


  const billColors = {
    twenties: 'hsl(var(--bill-20))',
    tens: 'hsl(var(--bill-10))',
    fives: 'hsl(var(--bill-5))',
    ones: 'hsl(var(--bill-1))',
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-2 sm:p-3 lg:p-4">
      <header className="text-center mb-4 sm:mb-6 flex justify-center">
         {/* Logo removed as per request */}
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-1 space-y-4">
          <InputPanel
            totalTipPoolStr={totalTipPoolStr}
            onTotalTipPoolChange={setTotalTipPoolStr}
            onFileChange={handleFileChange}
            onCalculateTips={handleCalculateTips}
            isOcrProcessing={isOcrProcessing}
            ocrError={ocrError}
            fileProcessingError={fileProcessingError}
            selectedFileName={selectedFileName}
            isCalculating={isCalculating}
            calculationError={calculationError}
            hasPartnerInputs={!!partnerInputs && partnerInputs.length > 0}
          />
        </div>

        <div className="lg:col-span-2 space-y-4">
          {(isCalculating || (calculatedResults && calculatedResults.length > 0)) && (
            <>
              <Card className="bg-card shadow-xl rounded-xl">
                <CardHeader>
                  <CardTitle className="font-sans text-sm sm:text-base flex items-center text-card-foreground">
                    <LayoutGrid className="mr-2 h-4 w-4 text-accent" />
                    Distribution Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center"><Hourglass className="mr-1 h-3 w-3" />Total Hours</p>
                    <p className="font-semibold text-sm text-card-foreground">{totalHoursCalculated.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center"><TrendingUp className="mr-1 h-3 w-3" />Hourly Rate</p>
                    <p className="font-semibold text-sm text-card-foreground">${baseTruncatedHourlyRate.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center"><Wallet className="mr-1 h-3 w-3" />Total Distributed</p>
                    <p className="font-semibold text-sm text-card-foreground">${totalTipsDistributed.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs flex items-center"><CalendarDays className="mr-1 h-3 w-3" />Distribution Date</p>
                    <p className="font-semibold text-sm text-card-foreground">{distributionDate ? format(distributionDate, 'MMM dd, yyyy') : 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card shadow-xl rounded-xl">
                <CardHeader>
                  <CardTitle className="font-sans text-sm sm:text-base flex items-center text-card-foreground">
                    <Settings2 className="mr-2 h-4 w-4 text-accent" />
                    Calculation Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center p-2 bg-background/30 rounded-md text-card-foreground text-xs">
                    <Sigma className="mr-2 h-4 w-4 text-accent flex-shrink-0" />
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                      <span>Total Tips: <span className="font-semibold">${totalTipsDistributed.toFixed(2)}</span></span>
                      <span className="text-muted-foreground mx-0.5">+</span>
                      <span>Total Hours: <span className="font-semibold">{totalHoursCalculated.toFixed(2)}</span></span>
                      <span className="text-muted-foreground mx-0.5">=</span>
                      <span className="font-semibold text-accent">${baseTruncatedHourlyRate.toFixed(2)}</span>
                      <span>per hour</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground mb-1 flex items-center text-xs">
                      <ListChecks className="mr-2 h-3.5 w-3.5 text-accent" /> Total Bills Needed:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {totalBillsNeeded.twenties > 0 && <Badge style={{backgroundColor: billColors.twenties}} className="text-bill font-medium px-1.5 py-0.5 text-xs">{totalBillsNeeded.twenties}x $20</Badge>}
                      {totalBillsNeeded.tens > 0 && <Badge style={{backgroundColor: billColors.tens}} className="text-bill font-medium px-1.5 py-0.5 text-xs">{totalBillsNeeded.tens}x $10</Badge>}
                      {totalBillsNeeded.fives > 0 && <Badge style={{backgroundColor: billColors.fives}} className="text-bill font-medium px-1.5 py-0.5 text-xs">{totalBillsNeeded.fives}x $5</Badge>}
                      {totalBillsNeeded.ones > 0 && <Badge style={{backgroundColor: billColors.ones}} className="text-bill font-medium px-1.5 py-0.5 text-xs">{totalBillsNeeded.ones}x $1</Badge>}
                      {totalTipsDistributed > 0 && totalBillsNeeded.twenties === 0 && totalBillsNeeded.tens === 0 && totalBillsNeeded.fives === 0 && totalBillsNeeded.ones === 0 && (
                        <Badge variant="outline" className="text-muted-foreground px-1.5 py-0.5 text-xs">No whole bills for total</Badge>
                      )}
                      {totalTipsDistributed === 0 && (
                        <Badge variant="outline" className="text-muted-foreground px-1.5 py-0.5 text-xs">No tips to distribute</Badge>
                      )}
                    </div>
                  </div>
                   {Math.abs(totalTipPool - totalTipsDistributed) > 0.001 && (
                    <p className="mt-1.5 text-xs text-destructive/80">
                      Note: Difference of <span className="font-semibold">${(totalTipPool - totalTipsDistributed).toFixed(2)}</span> between pool and distributed due to final whole dollar rounding.
                    </p>
                  )}
                  {calculationStepDetails && (
                    <Accordion type="single" collapsible className="w-full pt-1.5">
                      <AccordionItem value="item-1" className="border-t border-border/50">
                        <AccordionTrigger className="text-xs hover:no-underline text-muted-foreground hover:text-accent py-2">
                          <Info className="mr-2 h-3 w-3" /> Show Detailed Calculation Steps
                        </AccordionTrigger>
                        <AccordionContent className="text-xs space-y-1 pt-1.5 text-muted-foreground/90">
                          <p><strong>Initial Setup:</strong></p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Total Tip Pool Entered: <span className="font-semibold text-foreground">${calculationStepDetails.totalTipPoolDisplay}</span></li>
                            <li>Total Hours from Report: <span className="font-semibold text-foreground">{calculationStepDetails.totalHoursFromInputsDisplay} hours</span></li>
                            <li>Raw Hourly Rate (Pool / Hours): <span className="font-semibold text-foreground">${calculationStepDetails.rawRatePreTruncationDisplay}</span></li>
                            <li>Truncated Hourly Rate Used: <span className="font-semibold text-foreground">${calculationStepDetails.baseTruncatedHourlyRateDisplay}</span> (Truncated to $0.01)</li>
                          </ul>
                          <p className="pt-0.5"><strong>Step 1: Calculate Base Tip per Partner</strong></p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Each partner's hours are multiplied by the Truncated Hourly Rate (${calculationStepDetails.baseTruncatedHourlyRateDisplay}).</li>
                            <li>Sum of All Partners' Base Tips (before cent adjustments): <span className="font-semibold text-foreground">${calculationStepDetails.sumOfBaseMaterializedTipsDisplay}</span></li>
                          </ul>
                          <p className="pt-0.5"><strong>Step 2: Adjust for Cent Precision</strong></p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Total Tip Pool in Cents: <span className="font-semibold text-foreground">{calculationStepDetails.totalTipPoolInCentsDisplay} cents</span></li>
                            <li>Sum of Base Tips in Cents: <span className="font-semibold text-foreground">{calculationStepDetails.sumOfBaseMaterializedTipsInCentsDisplay} cents</span></li>
                            <li>Cents to Redistribute: <span className="font-semibold text-foreground">{calculationStepDetails.centsToRedistributeDisplay} cents</span></li>
                            <li className="text-muted-foreground/70 italic">These cents are distributed one by one to partners (prioritizing those who lost more in initial rounding, then by hours/name) until the sum of partner tips exactly matches the Total Tip Pool.</li>
                          </ul>
                           <p className="pt-0.5"><strong>Step 3: Round Each Partner's Tip to Nearest Whole Dollar</strong></p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li>Each partner's cent-precise tip amount is rounded to the nearest whole dollar. (e.g., $22.49 rounds to $22, $22.50 rounds to $23).</li>
                            <li>Final Total Distributed (Sum of whole dollar tips): <span className="font-semibold text-foreground">${totalTipsDistributed.toFixed(2)}</span></li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )}
                </CardContent>
              </Card>
              
              <h2 className="font-sans text-base sm:text-lg flex items-center text-foreground mt-4 mb-2">
                <Users className="mr-2 h-5 w-5 text-accent" /> Partner Payouts
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {isCalculating && (
                  Array.from({ length: partnerInputs?.length || 3 }).map((_, idx) => (
                    <Card key={idx} className="bg-card shadow-lg rounded-lg p-3 animate-pulse">
                      <div className="h-3 bg-muted rounded w-3/4 mb-1.5"></div>
                      <div className="h-2.5 bg-muted rounded w-1/2 mb-1"></div>
                      <div className="h-2.5 bg-muted rounded w-1/2 mb-1"></div>
                      <div className="h-2.5 bg-muted rounded w-full"></div>
                    </Card>
                  ))
                )}
                {!isCalculating && calculatedResults?.map((partner) => (
                  <PartnerResultCard key={partner.partnerNumber || partner.partnerName} partner={partner} displayedRate={baseTruncatedHourlyRate} />
                ))}
              </div>
            </>
          )}

          {!isCalculating && !calculatedResults && partnerInputs && partnerInputs.length > 0 && totalTipPool > 0 && (
            <Alert className="mt-4 shadow-md rounded-xl bg-card text-card-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              <AlertTitle className="font-sans text-sm">Ready to Calculate!</AlertTitle>
              <AlertDescription className="font-sans text-xs">
                  Partner data for {partnerInputs.length} partners and total tip pool entered. Click "Calculate Distribution".
              </AlertDescription>
            </Alert>
          )}
          
          {!isCalculating && !isOcrProcessing && (!partnerInputs || partnerInputs.length === 0) && (
             <Card className="bg-card shadow-xl rounded-xl">
                <CardContent className="pt-4 text-center text-muted-foreground">
                  <Wallet className="mx-auto h-10 w-10 text-accent/50 mb-2" />
                  <p className="font-medium text-sm">Upload a partner report and enter the total tip amount to get started.</p>
                  <p className="text-xs mt-0.5">Results will appear here once calculated.</p>
                </CardContent>
              </Card>
          )}

        </div>
      </main>

      <footer className="mt-auto pt-10 pb-4 text-center">
        <p className="text-xs text-muted-foreground font-sans">
          Made by William Walsh
        </p>
      </footer>
    </div>
  );
}

