export interface Participant {
  id: string;
  name: string;
  arrivalDate: string; // YYYY-MM-DD format
  departureDate: string; // YYYY-MM-DD format
}

export interface BookingSettings {
  totalCost: number;
  startDate: string; // First night date (YYYY-MM-DD)
  endDate: string; // Last night date (YYYY-MM-DD)
  currency: 'EUR' | 'USD';
  exchangeRate: number; // EUR to USD
  showUSD: boolean;
  roundUSD: boolean;
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
  finalAmountEUR: number; // Final amount after additional modules
  finalAmountUSD: number;
}

export interface CalculationResult {
  participants: ParticipantResult[];
  nightBreakdown: NightBreakdown[];
  totalNights: number;
  roundingAdjustment: number;
  additionalModules: AdditionalModuleResult[];
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

export interface AdditionalModule {
  id: string;
  type: 'loan' | 'service_provided' | 'service_purchased';
  description: string;
  amount: number;
  fromParticipantIds: string[]; // Who provide/lend (can be multiple)
  toParticipantIds: string[]; // Who receive/borrow (can be multiple)
  splitEqually: boolean; // Whether to split equally among participants
  tips: Tip[]; // Multiple tips from different people
}

export interface AdditionalModuleResult {
  id: string;
  type: 'loan' | 'service_provided' | 'service_purchased';
  description: string;
  amount: number;
  fromParticipants: string[]; // Names of providers/lenders
  toParticipants: string[]; // Names of recipients/borrowers
  amountPerProvider: number; // Amount each provider pays/provides
  amountPerRecipient: number; // Amount each recipient owes/receives
}

// Database types
export interface SavedCalculation {
  id: string;
  name: string;
  participants: Participant[];
  settings: BookingSettings;
  additionalModules: AdditionalModule[];
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseConfig {
  url: string;
  token: string;
}