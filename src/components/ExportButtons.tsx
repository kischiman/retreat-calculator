import type { CalculationResult, BookingSettings } from '../types';
import { format, parseISO } from 'date-fns';

interface ExportButtonsProps {
  result: CalculationResult;
  showUSD: boolean;
  roundUSD: boolean;
  totalCost: number;
  settings: BookingSettings;
}

export function ExportButtons({ result, showUSD, roundUSD, totalCost, settings }: ExportButtonsProps) {
  const formatCurrency = (amount: number, currency: 'EUR' | 'USD') => {
    const symbol = currency === 'EUR' ? '€' : '$';
    const value = currency === 'USD' && roundUSD ? Math.round(amount) : amount;
    return `${symbol}${value.toFixed(currency === 'USD' && roundUSD ? 0 : 2)}`;
  };

  const generateSummaryText = () => {
    const lines: string[] = [];
    lines.push('RETREAT COST SPLIT SUMMARY');
    lines.push('='.repeat(30));
    lines.push('');
    
    lines.push(`Total Cost: €${totalCost.toFixed(2)}`);
    lines.push(`Total Nights: ${result.totalNights}`);
    lines.push('');
    
    lines.push('PARTICIPANT BREAKDOWN:');
    lines.push('-'.repeat(20));
    
    result.participants.forEach(participant => {
      lines.push(`${participant.name}:`);
      lines.push(`  Dates: ${format(parseISO(participant.arrivalDate), 'MMM dd')} - ${format(parseISO(participant.departureDate), 'MMM dd')}`);
      lines.push(`  Nights: ${participant.nights}`);
      lines.push(`  Amount: ${formatCurrency(participant.amountEUR, 'EUR')}`);
      if (showUSD) {
        lines.push(`  Amount (USD): ${formatCurrency(participant.amountUSD, 'USD')}`);
      }
      lines.push(`  Effective per night: €${participant.effectivePerNightEUR.toFixed(2)}`);
      lines.push('');
    });
    
    const totalEUR = result.participants.reduce((sum, p) => sum + p.amountEUR, 0);
    const totalUSD = result.participants.reduce((sum, p) => sum + (roundUSD ? Math.round(p.amountUSD) : p.amountUSD), 0);
    
    lines.push(`TOTAL: ${formatCurrency(totalEUR, 'EUR')}`);
    if (showUSD) {
      lines.push(`TOTAL (USD): ${formatCurrency(totalUSD, 'USD')}`);
    }
    
    return lines.join('\n');
  };

  const generateCSV = () => {
    // Export format for import compatibility
    const rows = [];
    
    // Settings section
    rows.push('SETTINGS');
    rows.push('Total Cost,Start Date,End Date,Exchange Rate,Show USD,Round USD');
    rows.push(`${settings.totalCost},${settings.startDate},${settings.endDate},${settings.exchangeRate},${settings.showUSD},${settings.roundUSD}`);
    rows.push('');
    
    // Participants section  
    rows.push('PARTICIPANTS');
    rows.push('Name,Arrival Date,Departure Date');
    result.participants.forEach(participant => {
      rows.push(`${participant.name},${participant.arrivalDate},${participant.departureDate}`);
    });
    rows.push('');
    
    // Additional activities section
    if (result.additionalActivities && result.additionalActivities.length > 0) {
      rows.push('ADDITIONAL_ACTIVITIES');
      rows.push('Type,Description,Amount,From Participants,To Participants');
      result.additionalActivities.forEach(activity => {
        const fromParticipants = activity.fromParticipants.join(';');
        const toParticipants = activity.toParticipants.join(';');
        rows.push(`${activity.type},"${activity.description}",${activity.amount},"${fromParticipants}","${toParticipants}"`);
      });
      rows.push('');
    }
    
    // Results section (for reference)
    rows.push('RESULTS');
    const headers = ['Name', 'Arrival Date', 'Departure Date', 'Nights', 'Base Amount (EUR)', 'Additional Charges', 'Additional Credits', 'Final Amount (EUR)'];
    if (showUSD) {
      headers.push('Final Amount (USD)');
    }
    rows.push(headers.join(','));
    
    result.participants.forEach(participant => {
      const row = [
        participant.name,
        participant.arrivalDate,
        participant.departureDate,
        participant.nights.toString(),
        participant.amountEUR.toFixed(2),
        participant.additionalCharges.toFixed(2),
        participant.additionalCredits.toFixed(2),
        participant.finalAmountEUR.toFixed(2)
      ];
      
      if (showUSD) {
        row.push(participant.finalAmountUSD.toFixed(roundUSD ? 0 : 2));
      }
      
      rows.push(row.join(','));
    });
    
    // Add night breakdown
    rows.push('');
    rows.push('NIGHT BREAKDOWN');
    rows.push('Date,People Present,Count,Nightly Cost,Per-Person Cost');
    
    result.nightBreakdown.forEach(night => {
      rows.push([
        night.date,
        `"${night.presentParticipants.join(', ')}"`,
        night.participantCount.toString(),
        night.nightlyCost.toFixed(2),
        night.perPersonCost.toFixed(2)
      ].join(','));
    });
    
    return rows.join('\n');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
      alert('Copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Copied to clipboard!');
    });
  };

  const downloadCSV = () => {
    const csv = generateCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'retreat-cost-breakdown.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (result.participants.length === 0) {
    return null;
  }

  return (
    <div className="export-buttons">
      <h4>Export Options</h4>
      <div className="button-group">
        <button 
          onClick={() => copyToClipboard(generateSummaryText())}
          className="export-button"
        >
          📋 Copy Summary
        </button>
        <button 
          onClick={downloadCSV}
          className="export-button"
        >
          📊 Download CSV
        </button>
      </div>
    </div>
  );
}