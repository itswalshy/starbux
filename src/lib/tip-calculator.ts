
import type { PartnerInputData, CalculatedPartnerTipData, BillBreakdown } from '@/types';

interface PartnerWithIntermediateCalculations extends PartnerInputData {
  baseTipMaterialized: number; // Tip amount after truncated rate * hours, before any cent rounding or distribution
  centPreciseTip: number; // Tip amount in cents after distribution of truncation residuals
  shareBeforeFinalRounding: number; // Tip amount as float after cent distribution
}


export function calculateIndividualTips(
  partners: PartnerInputData[],
  totalTipPool: number
): CalculatedPartnerTipData[] {
  if (!partners || partners.length === 0) {
    return [];
  }

  if (totalTipPool <= 0) {
    return partners.map(p => ({
      ...p,
      calculatedTip: 0,
      billBreakdown: allocateBills(0),
    }));
  }

  const totalHoursWorked = partners.reduce((sum, partner) => sum + partner.hoursWorked, 0);
  const totalTipPoolInCents = Math.round(totalTipPool * 100);

  let intermediatePartners: PartnerWithIntermediateCalculations[];

  if (totalHoursWorked <= 0) {
    // Distribute pool equally if no hours worked
    const baseSharePerPartnerInCents = Math.floor(totalTipPoolInCents / partners.length);
    let remainingCents = totalTipPoolInCents % partners.length;

    // Sort partners by name for consistent distribution of remaining cents
    const sortedPartnersForZeroHours = [...partners].sort((a, b) => (a.partnerName || '').localeCompare(b.partnerName || ''));

    intermediatePartners = sortedPartnersForZeroHours.map((p, index) => {
      let currentPartnerCentPreciseTip = baseSharePerPartnerInCents;
      if (remainingCents > 0) {
        currentPartnerCentPreciseTip += 1;
        remainingCents--;
      }
      return {
        ...p,
        baseTipMaterialized: currentPartnerCentPreciseTip / 100, // For consistency, though not strictly "base"
        centPreciseTip: currentPartnerCentPreciseTip,
        shareBeforeFinalRounding: currentPartnerCentPreciseTip / 100,
      };
    });

  } else {
    // Calculate with truncated hourly rate
    const rawRate = totalTipPool / totalHoursWorked;
    const truncatedHourlyRate = Math.floor(rawRate * 100) / 100;

    intermediatePartners = partners.map((p, index) => {
      const baseTipMaterialized = p.hoursWorked * truncatedHourlyRate;
      return {
        ...p,
        baseTipMaterialized, // Store the float value before rounding to cent
        centPreciseTip: Math.round(baseTipMaterialized * 100),
        shareBeforeFinalRounding: 0, // Will be set after cent distribution
        originalIndex: index, // Keep original index for stable sort if needed later
      };
    });

    let sumOfBaseCentPreciseTips = intermediatePartners.reduce((sum, p) => sum + p.centPreciseTip, 0);
    let centsDifference = totalTipPoolInCents - sumOfBaseCentPreciseTips;

    // Sort for fair distribution of centsDifference
    // Prioritize those who lost more from Math.round(baseTipMaterialized * 100) or gained less
    intermediatePartners.sort((a, b) => {
      // For adding cents (centsDifference > 0): sort by who was rounded down more
      // (baseTipMaterialized * 100 - centPreciseTip) will be positive and larger for those rounded down more.
      // For subtracting cents (centsDifference < 0): sort by who was rounded up more
      // (centPreciseTip - baseTipMaterialized * 100) will be positive and larger for those rounded up more.
      const roundingEffectA = a.centPreciseTip - (a.baseTipMaterialized * 100);
      const roundingEffectB = b.centPreciseTip - (b.baseTipMaterialized * 100);

      if (centsDifference > 0) { // Adding cents, give to those who lost more (or gained less)
        if (roundingEffectA !== roundingEffectB) {
          return roundingEffectA - roundingEffectB; // Smaller (more negative or less positive) roundingEffect first
        }
      } else { // Subtracting cents, take from those who gained more
        if (roundingEffectA !== roundingEffectB) {
          return roundingEffectB - roundingEffectA; // Larger (more positive) roundingEffect first
        }
      }
      // Tie-breaking
      if (b.hoursWorked !== a.hoursWorked) return b.hoursWorked - a.hoursWorked;
      return (a.partnerName || '').localeCompare(b.partnerName || '');
    });
    
    let partnerIndex = 0;
    while (centsDifference !== 0 && intermediatePartners.length > 0) {
      const adjustment = centsDifference > 0 ? 1 : -1;
      const currentPartner = intermediatePartners[partnerIndex % intermediatePartners.length];
      currentPartner.centPreciseTip += adjustment;
      centsDifference -= adjustment;
      partnerIndex++;
    }

    intermediatePartners.forEach(p => {
      p.shareBeforeFinalRounding = p.centPreciseTip / 100;
    });
  }

  // Final step: Round each partner's share to the nearest whole dollar
  const finalResults = intermediatePartners.map(p => {
    const calculatedTip = Math.round(p.shareBeforeFinalRounding);
    return {
      partnerName: p.partnerName,
      partnerNumber: p.partnerNumber,
      hoursWorked: p.hoursWorked,
      calculatedTip: calculatedTip,
      billBreakdown: allocateBills(calculatedTip),
    };
  });
  
  // Restore original partner order if changed (e.g. by zero hours sorting)
  // This ensures the output array matches the input order if consumers rely on it.
  // However, if partnerNumber is the key for display, order might not matter as much.
  // For now, we'll return based on processing order which might be sorted.
  // If original order is paramount, map back using an ID or original index.
  // The current logic for zero hours sorts by name, otherwise by intermediate sort.
  // Let's try to map back to original order if possible, primarily for non-zero-hour case.
  if (totalHoursWorked > 0) {
     const originalOrderMap = new Map(partners.map((p, i) => [p.partnerNumber || `${p.partnerName}-${i}`, i]));
     finalResults.sort((a,b) => {
        const idxA = originalOrderMap.get(a.partnerNumber || `${a.partnerName}-${partners.findIndex(op => op.partnerName === a.partnerName && op.hoursWorked === a.hoursWorked)}`);
        const idxB = originalOrderMap.get(b.partnerNumber || `${b.partnerName}-${partners.findIndex(op => op.partnerName === b.partnerName && op.hoursWorked === b.hoursWorked)}`);
        if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
        return 0; // fallback
     });
  }


  return finalResults;
}

export function allocateBills(amount: number): BillBreakdown {
  // Amount is expected to be a whole dollar amount here
  let remainingAmountInCents = Math.round(amount * 100);

  const twenties = Math.floor(remainingAmountInCents / 2000);
  remainingAmountInCents %= 2000;

  const tens = Math.floor(remainingAmountInCents / 1000);
  remainingAmountInCents %= 1000;

  const fives = Math.floor(remainingAmountInCents / 500);
  remainingAmountInCents %= 500;

  const ones = Math.floor(remainingAmountInCents / 100);
  
  return { twenties, tens, fives, ones };
}

export function calculateTotalBillBreakdown(results: CalculatedPartnerTipData[]): BillBreakdown {
  const totalBreakdown: BillBreakdown = { twenties: 0, tens: 0, fives: 0, ones: 0 };
  if (!results) return totalBreakdown;

  results.forEach(partner => {
    totalBreakdown.twenties += partner.billBreakdown.twenties;
    totalBreakdown.tens += partner.billBreakdown.tens;
    totalBreakdown.fives += partner.billBreakdown.fives;
    totalBreakdown.ones += partner.billBreakdown.ones;
  });

  return totalBreakdown;
}

