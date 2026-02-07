// Quick test of the calculation logic with the example data
import { calculateCostSplit } from './calculations';
import type { Participant, BookingSettings } from '../types';

const testParticipants: Participant[] = [
  { id: '1', name: 'Andrej', arrivalDate: '2025-10-16', departureDate: '2025-10-28' },
  { id: '2', name: 'Jane', arrivalDate: '2025-10-16', departureDate: '2025-10-28' },
  { id: '3', name: 'Anna', arrivalDate: '2025-10-16', departureDate: '2025-10-26' },
  { id: '4', name: 'Sho', arrivalDate: '2025-10-23', departureDate: '2025-10-27' },
  { id: '5', name: 'Hanami', arrivalDate: '2025-10-23', departureDate: '2025-10-24' }
];

const testSettings: BookingSettings = {
  totalCost: 1300, // Simplified amount for testing
  startDate: '2025-10-16',
  endDate: '2025-10-28', // 13 nights
  currency: 'EUR',
  exchangeRate: 1.07,
  showUSD: false,
  roundUSD: false
};

// Run test calculation
const result = calculateCostSplit(testParticipants, testSettings);

console.log('Test Calculation Results:');
console.log('Total nights:', result.totalNights);
console.log('Night cost:', testSettings.totalCost / result.totalNights);

result.participants.forEach(p => {
  console.log(`${p.name}: ${p.nights} nights, €${p.amountEUR.toFixed(2)}, €${p.effectivePerNightEUR.toFixed(2)}/night`);
});

const totalCalculated = result.participants.reduce((sum, p) => sum + p.amountEUR, 0);
console.log('Total calculated:', totalCalculated.toFixed(2));
console.log('Original total:', testSettings.totalCost.toFixed(2));
console.log('Rounding adjustment:', result.roundingAdjustment.toFixed(2));