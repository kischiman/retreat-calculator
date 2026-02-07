import { addDays, eachDayOfInterval, format, parseISO, differenceInDays } from 'date-fns';
import type { Participant, BookingSettings, NightBreakdown, ParticipantResult, CalculationResult, ValidationError, AdditionalModule, AdditionalModuleResult } from '../types';

export function validateInputs(
  participants: Participant[],
  settings: BookingSettings
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // Validate booking dates
  const startDate = parseISO(settings.startDate);
  const endDate = parseISO(settings.endDate);
  
  if (startDate >= endDate) {
    errors.push({
      type: 'error',
      message: 'Booking end date must be after start date'
    });
    return errors;
  }
  
  // Validate total cost
  if (settings.totalCost <= 0) {
    errors.push({
      type: 'error',
      message: 'Total cost must be greater than 0'
    });
  }
  
  // Validate participants
  participants.forEach(participant => {
    if (!participant.name.trim()) {
      errors.push({
        type: 'error',
        message: 'Participant name cannot be empty',
        participantId: participant.id
      });
    }
    
    const arrivalDate = parseISO(participant.arrivalDate);
    const departureDate = parseISO(participant.departureDate);
    
    if (arrivalDate >= departureDate) {
      errors.push({
        type: 'error',
        message: 'Departure date must be after arrival date',
        participantId: participant.id
      });
    }
    
    // Warning if participant stay is outside booking range
    if (arrivalDate < startDate || departureDate > addDays(endDate, 1)) {
      errors.push({
        type: 'warning',
        message: 'Participant stay extends outside booking period',
        participantId: participant.id
      });
    }
  });
  
  return errors;
}

export function calculateNights(arrivalDate: string, departureDate: string): number {
  const arrival = parseISO(arrivalDate);
  const departure = parseISO(departureDate);
  return differenceInDays(departure, arrival);
}

export function calculateCostSplit(
  participants: Participant[],
  settings: BookingSettings,
  additionalModules: AdditionalModule[] = []
): CalculationResult {
  const startDate = parseISO(settings.startDate);
  const endDate = parseISO(settings.endDate);
  
  // Generate all booking nights (nights from startDate to endDate inclusive)
  const bookingNights = eachDayOfInterval({ start: startDate, end: endDate });
  const totalNights = bookingNights.length;
  const nightlyCost = settings.totalCost / totalNights;
  
  // Calculate night breakdown
  const nightBreakdown: NightBreakdown[] = bookingNights.map(night => {
    const nightDateStr = format(night, 'yyyy-MM-dd');
    
    // Find participants present this night
    const presentParticipants = participants.filter(participant => {
      const arrival = parseISO(participant.arrivalDate);
      const departure = parseISO(participant.departureDate);
      return night >= arrival && night < departure;
    });
    
    const participantCount = presentParticipants.length;
    const perPersonCost = participantCount > 0 ? nightlyCost / participantCount : 0;
    
    return {
      date: nightDateStr,
      presentParticipants: presentParticipants.map(p => p.name),
      participantCount,
      nightlyCost,
      perPersonCost
    };
  });
  
  // Calculate additional modules
  const moduleResults: AdditionalModuleResult[] = additionalModules.map(module => {
    const fromParticipants = module.fromParticipantIds
      .map(id => participants.find(p => p.id === id)?.name)
      .filter(Boolean) as string[];
    const toParticipants = module.toParticipantIds
      .map(id => participants.find(p => p.id === id)?.name)
      .filter(Boolean) as string[];
    
    const amountPerProvider = module.amount / module.fromParticipantIds.length;
    const amountPerRecipient = module.amount / module.toParticipantIds.length;
    
    return {
      id: module.id,
      type: module.type,
      description: module.description,
      amount: module.amount,
      fromParticipants,
      toParticipants,
      amountPerProvider,
      amountPerRecipient
    };
  });

  // Calculate participant totals
  const participantResults: ParticipantResult[] = participants.map(participant => {
    const nights = calculateNights(participant.arrivalDate, participant.departureDate);
    
    // Sum up costs for all nights this participant is present
    let totalCostEUR = 0;
    nightBreakdown.forEach(night => {
      if (night.presentParticipants.includes(participant.name)) {
        totalCostEUR += night.perPersonCost;
      }
    });

    // Calculate additional charges and credits
    let additionalCharges = 0; // Money owed due to loans/services
    let additionalCredits = 0; // Money to be received from loans/services

    additionalModules.forEach(module => {
      const amountPerProvider = module.amount / module.fromParticipantIds.length;
      const amountPerRecipient = module.amount / module.toParticipantIds.length;
      
      if (module.type === 'loan') {
        if (module.toParticipantIds.includes(participant.id)) {
          // This participant borrowed money
          additionalCharges += amountPerRecipient;
        }
        if (module.fromParticipantIds.includes(participant.id)) {
          // This participant lent money
          additionalCredits += amountPerProvider;
        }
      } else if (module.type === 'service_provided') {
        if (module.fromParticipantIds.includes(participant.id)) {
          // This participant provided a service
          additionalCredits += amountPerProvider;
          // Add tips if they received any
          if (module.tips && module.tips.length > 0) {
            const totalTips = module.tips.reduce((sum, tip) => sum + tip.amount, 0);
            additionalCredits += totalTips / module.fromParticipantIds.length;
          }
        }
        if (module.toParticipantIds.includes(participant.id)) {
          // This participant received a service
          additionalCharges += amountPerRecipient;
        }
      } else if (module.type === 'service_purchased') {
        if (module.fromParticipantIds.includes(participant.id)) {
          // This participant purchased a service for others
          additionalCredits += amountPerProvider;
        }
        if (module.toParticipantIds.includes(participant.id)) {
          // This participant owes for a service purchased for them
          additionalCharges += amountPerRecipient;
          // Add tips if they received any
          if (module.tips && module.tips.length > 0) {
            const totalTips = module.tips.reduce((sum, tip) => sum + tip.amount, 0);
            additionalCredits += totalTips / module.toParticipantIds.length;
          }
        }
      }
      
      // Handle tip payments separately
      if (module.tips && module.tips.length > 0) {
        const participantTips = module.tips.filter(tip => tip.fromParticipantId === participant.id);
        additionalCharges += participantTips.reduce((sum, tip) => sum + tip.amount, 0);
      }
    });

    const finalAmountEUR = totalCostEUR + additionalCharges - additionalCredits;
    const totalCostUSD = totalCostEUR * settings.exchangeRate;
    const finalAmountUSD = finalAmountEUR * settings.exchangeRate;
    const effectivePerNightEUR = nights > 0 ? totalCostEUR / nights : 0;
    const effectivePerNightUSD = nights > 0 ? totalCostUSD / nights : 0;
    
    const calculation = `${nights} × €${effectivePerNightEUR.toFixed(2)} = €${totalCostEUR.toFixed(2)}`;
    
    return {
      id: participant.id,
      name: participant.name,
      arrivalDate: participant.arrivalDate,
      departureDate: participant.departureDate,
      nights,
      amountEUR: totalCostEUR,
      amountUSD: totalCostUSD,
      effectivePerNightEUR,
      effectivePerNightUSD,
      calculation,
      additionalCharges,
      additionalCredits,
      finalAmountEUR,
      finalAmountUSD
    };
  });
  
  // Calculate rounding adjustment
  const totalCalculated = participantResults.reduce((sum, p) => sum + p.amountEUR, 0);
  const roundingAdjustment = settings.totalCost - totalCalculated;
  
  // Apply rounding adjustment to last participant if needed
  if (participantResults.length > 0 && Math.abs(roundingAdjustment) > 0.001) {
    const lastParticipant = participantResults[participantResults.length - 1];
    lastParticipant.amountEUR += roundingAdjustment;
    lastParticipant.amountUSD = lastParticipant.amountEUR * settings.exchangeRate;
    lastParticipant.effectivePerNightEUR = lastParticipant.nights > 0 ? lastParticipant.amountEUR / lastParticipant.nights : 0;
    lastParticipant.effectivePerNightUSD = lastParticipant.nights > 0 ? lastParticipant.amountUSD / lastParticipant.nights : 0;
    lastParticipant.calculation = `${lastParticipant.nights} × €${lastParticipant.effectivePerNightEUR.toFixed(2)} = €${lastParticipant.amountEUR.toFixed(2)}`;
    
    // IMPORTANT: Recalculate final amounts after rounding adjustment
    lastParticipant.finalAmountEUR = lastParticipant.amountEUR + lastParticipant.additionalCharges - lastParticipant.additionalCredits;
    lastParticipant.finalAmountUSD = lastParticipant.finalAmountEUR * settings.exchangeRate;
  }
  
  // Apply USD rounding if enabled
  if (settings.roundUSD) {
    participantResults.forEach(participant => {
      participant.amountUSD = Math.round(participant.amountUSD);
      participant.finalAmountUSD = Math.round(participant.finalAmountUSD);
      participant.effectivePerNightUSD = participant.nights > 0 ? participant.amountUSD / participant.nights : 0;
    });
  }
  
  return {
    participants: participantResults,
    nightBreakdown,
    totalNights,
    roundingAdjustment,
    additionalModules: moduleResults
  };
}