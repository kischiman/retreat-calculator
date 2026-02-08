import type { Participant, BookingSettings } from '../types';

export const exampleParticipants: Omit<Participant, 'id'>[] = [
  {
    name: 'Andrej',
    arrivalDate: '2025-10-16',
    departureDate: '2025-10-28'
  },
  {
    name: 'Jane',
    arrivalDate: '2025-10-16',
    departureDate: '2025-10-28'
  },
  {
    name: 'Brentis',
    arrivalDate: '2025-10-16',
    departureDate: '2025-10-28'
  },
  {
    name: 'Kirill',
    arrivalDate: '2025-10-16',
    departureDate: '2025-10-28'
  },
  {
    name: 'Anna',
    arrivalDate: '2025-10-16',
    departureDate: '2025-10-26'
  },
  {
    name: 'Sho',
    arrivalDate: '2025-10-23',
    departureDate: '2025-10-27'
  },
  {
    name: 'Taichi',
    arrivalDate: '2025-10-23',
    departureDate: '2025-10-27'
  },
  {
    name: 'Tore',
    arrivalDate: '2025-10-23',
    departureDate: '2025-10-27'
  },
  {
    name: 'Marcus',
    arrivalDate: '2025-10-23',
    departureDate: '2025-10-26'
  },
  {
    name: 'Hanami',
    arrivalDate: '2025-10-23',
    departureDate: '2025-10-24'
  }
];

export const exampleSettings: Partial<BookingSettings> = {
  totalCost: 2905,
  startDate: '2025-10-16',
  endDate: '2025-10-28',
  currency: 'EUR',
  exchangeRate: 1.07,
  showUSD: false,
  roundUSD: false,
  splitEvenly: false,
  calculationMethod: 'equal'
};