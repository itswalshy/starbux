
'use client';

import type { CalculatedPartnerTipData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleUserRound, Clock, Sigma, Landmark } from 'lucide-react';

interface PartnerResultCardProps {
  partner: CalculatedPartnerTipData;
  displayedRate: number; 
}

export function PartnerResultCard({ partner, displayedRate }: PartnerResultCardProps) {
  if (!partner) return null;

  const { partnerName, hoursWorked, calculatedTip, billBreakdown } = partner;

  const billColors = {
    twenties: 'hsl(var(--bill-20))',
    tens: 'hsl(var(--bill-10))',
    fives: 'hsl(var(--bill-5))',
    ones: 'hsl(var(--bill-1))',
  };

  return (
    <Card className="bg-card shadow-lg rounded-lg w-full">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="font-sans text-xs flex justify-between items-center text-card-foreground">
          <span className="flex items-center">
            <CircleUserRound className="mr-1.5 h-3.5 w-3.5 text-accent" />
            {partnerName || 'N/A'}
          </span>
          <Badge variant="secondary" className="bg-primary/20 text-primary font-medium text-xs px-1.5 py-px">
            ${calculatedTip.toFixed(2)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-1.5 text-xs">
        <div className="flex items-center text-muted-foreground">
          <Clock className="mr-1.5 h-3 w-3 text-accent" />
          Hours: {hoursWorked.toFixed(2)}
        </div>
        <div className="flex items-center text-muted-foreground">
          <Sigma className="mr-1.5 h-3 w-3 text-accent" />
          Calculation: {hoursWorked.toFixed(2)} hrs × ${displayedRate.toFixed(2)}/hr = ${calculatedTip.toFixed(2)}
        </div>
        <div className="pt-0.5">
          <div className="flex items-center text-muted-foreground mb-1">
            <Landmark className="mr-1.5 h-3 w-3 text-accent" />
            Bill Breakdown:
          </div>
          <div className="flex flex-wrap gap-1">
            {billBreakdown.twenties > 0 && <Badge style={{ backgroundColor: billColors.twenties }} className="text-bill font-medium px-1 py-px text-xs">{billBreakdown.twenties}x $20</Badge>}
            {billBreakdown.tens > 0 && <Badge style={{ backgroundColor: billColors.tens }} className="text-bill font-medium px-1 py-px text-xs">{billBreakdown.tens}x $10</Badge>}
            {billBreakdown.fives > 0 && <Badge style={{ backgroundColor: billColors.fives }} className="text-bill font-medium px-1 py-px text-xs">{billBreakdown.fives}x $5</Badge>}
            {billBreakdown.ones > 0 && <Badge style={{ backgroundColor: billColors.ones }} className="text-bill font-medium px-1 py-px text-xs">{billBreakdown.ones}x $1</Badge>}
            {calculatedTip > 0 && billBreakdown.twenties === 0 && billBreakdown.tens === 0 && billBreakdown.fives === 0 && billBreakdown.ones === 0 && (
                 <Badge variant="outline" className="text-muted-foreground px-1 py-px text-xs">No whole bills</Badge>
            )}
             {calculatedTip === 0 && (
                 <Badge variant="outline" className="text-muted-foreground px-1 py-px text-xs">No payout</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

