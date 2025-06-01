import type { ExtractTipDataFromImageOutput } from '@/ai/flows/extract-tip-data-from-image';

export type PartnerInputData = ExtractTipDataFromImageOutput['partnerData'][0];

export interface BillBreakdown {
  twenties: number;
  tens: number;
  fives: number;
  ones: number;
}

export interface CalculatedPartnerTipData extends PartnerInputData {
  calculatedTip: number;
  billBreakdown: BillBreakdown;
}
