export interface Participant {
  id: string;
  name: string;
  arrivalDate: string; // YYYY-MM-DD format
  departureDate: string; // YYYY-MM-DD format
}

export type CalculationMethod = 'equal' | 'nightly' | 'weekly';

export interface BookingSettings {
  totalCost: number;
  startDate: string; // First night date (YYYY-MM-DD)
  endDate: string; // Last night date (YYYY-MM-DD)
  currency: 'EUR' | 'USD';
  exchangeRate: number; // EUR to USD
  showUSD: boolean;
  roundUSD: boolean;
  splitEvenly: boolean; // Split total cost evenly among all participants regardless of stay duration
  calculationMethod: CalculationMethod; // How to calculate costs: equal split, nightly rate, or weekly rate
}

export interface NightBreakdown {
  date: string;
  presentParticipants: string[];
  participantCount: number;
  nightlyCost: number;
  perPersonCost: number;
}

export interface ParticipantResult {
  id: string;
  name: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
  amountEUR: number;
  amountUSD: number;
  effectivePerNightEUR: number;
  effectivePerNightUSD: number;
  calculation: string;
  additionalCharges: number; // From loans taken, services purchased
  additionalCredits: number; // From loans given, services provided
  finalAmountEUR: number; // Final amount after additional activities
  finalAmountUSD: number;
}

export interface CalculationResult {
  participants: ParticipantResult[];
  nightBreakdown: NightBreakdown[];
  totalNights: number;
  roundingAdjustment: number;
  additionalActivities: AdditionalActivityResult[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  participantId?: string;
}

export interface Tip {
  id: string;
  amount: number;
  fromParticipantId: string; // Who gives the tip
}

export interface AdditionalActivity {
  id: string;
  type: 'loan' | 'service_provided' | 'service_purchased';
  description: string;
  amount: number;
  fromParticipantIds: string[]; // Who provide/lend (can be multiple)
  toParticipantIds: string[]; // Who receive/borrow (can be multiple)
  splitEqually: boolean; // Whether to split equally among participants
  tips: Tip[]; // Multiple tips from different people
}

export interface AdditionalActivityResult {
  id: string;
  type: 'loan' | 'service_provided' | 'service_purchased';
  description: string;
  amount: number;
  fromParticipants: string[]; // Names of providers/lenders
  toParticipants: string[]; // Names of recipients/borrowers
  amountPerProvider: number; // Amount each provider pays/provides
  amountPerRecipient: number; // Amount each recipient owes/receives
}

