import { useState } from 'react';
import type { CalculationResult } from '../types';
import { format, parseISO } from 'date-fns';

interface ResultsTablesProps {
  result: CalculationResult;
  showUSD: boolean;
  roundUSD: boolean;
  onUpdateSettings: (settings: { showUSD?: boolean; roundUSD?: boolean }) => void;
}

export function ResultsTables({ result, showUSD, roundUSD, onUpdateSettings }: ResultsTablesProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (result.participants.length === 0) {
    return (
      <div className="results-tables">
        <div className="no-results">
          <p>Add participants to see cost breakdown</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: 'EUR' | 'USD') => {
    const symbol = currency === 'EUR' ? '€' : '$';
    const value = currency === 'USD' && roundUSD ? Math.round(amount) : amount;
    return `${symbol}${value.toFixed(currency === 'USD' && roundUSD ? 0 : 2)}`;
  };

  const totalEUR = result.participants.reduce((sum, p) => sum + p.amountEUR, 0);
  const totalFinalEUR = result.participants.reduce((sum, p) => sum + p.finalAmountEUR, 0);
  const totalFinalUSD = result.participants.reduce((sum, p) => sum + (roundUSD ? Math.round(p.finalAmountUSD) : p.finalAmountUSD), 0);
  const totalCharges = result.participants.reduce((sum, p) => sum + p.additionalCharges, 0);
  const totalCredits = result.participants.reduce((sum, p) => sum + p.additionalCredits, 0);

  return (
    <div className="results-tables">
      <div className="results-header">
        <h3>Cost Breakdown</h3>
        
        <div className="display-options">
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={showUSD}
                onChange={(e) => onUpdateSettings({ showUSD: e.target.checked })}
              />
              Show USD amounts
            </label>
          </div>

          {showUSD && (
            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={roundUSD}
                  onChange={(e) => onUpdateSettings({ roundUSD: e.target.checked })}
                />
                Round USD to whole dollars
              </label>
            </div>
          )}
        </div>
      </div>
      
      {/* Participants Summary Table */}
      <div className="participants-results">
        <h4>Participant Summary</h4>
        <table className="results-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Arrival</th>
              <th>Departure</th>
              <th>Nights</th>
              <th>Base Amount (€)</th>
              <th>Add'l Charges</th>
              <th>Add'l Credits</th>
              <th>Final Amount (€)</th>
              {showUSD && <th>Final Amount ($)</th>}
              <th>Effective €/night</th>
            </tr>
          </thead>
          <tbody>
            {result.participants.map((participant) => (
              <tr key={participant.id}>
                <td>{participant.name}</td>
                <td>{format(parseISO(participant.arrivalDate), 'MMM dd')}</td>
                <td>{format(parseISO(participant.departureDate), 'MMM dd')}</td>
                <td>{participant.nights}</td>
                <td>{formatCurrency(participant.amountEUR, 'EUR')}</td>
                <td className="charges-cell">
                  {participant.additionalCharges > 0 
                    ? `+€${participant.additionalCharges.toFixed(2)}` 
                    : '-'}
                </td>
                <td className="credits-cell">
                  {participant.additionalCredits > 0 
                    ? `-€${participant.additionalCredits.toFixed(2)}` 
                    : '-'}
                </td>
                <td className="final-amount"><strong>{formatCurrency(participant.finalAmountEUR, 'EUR')}</strong></td>
                {showUSD && <td className="final-amount"><strong>{formatCurrency(participant.finalAmountUSD, 'USD')}</strong></td>}
                <td>€{participant.effectivePerNightEUR.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={4}><strong>Total</strong></td>
              <td><strong>{formatCurrency(totalEUR, 'EUR')}</strong></td>
              <td><strong>+€{totalCharges.toFixed(2)}</strong></td>
              <td><strong>-€{totalCredits.toFixed(2)}</strong></td>
              <td><strong>{formatCurrency(totalFinalEUR, 'EUR')}</strong></td>
              {showUSD && <td><strong>{formatCurrency(totalFinalUSD, 'USD')}</strong></td>}
              <td></td>
            </tr>
          </tfoot>
        </table>
        
        {Math.abs(result.roundingAdjustment) > 0.001 && (
          <div className="rounding-note">
            <p>⚠️ Rounding adjustment applied: €{result.roundingAdjustment.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Night Breakdown Toggle */}
      <div className="breakdown-toggle">
        <button 
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="toggle-button"
        >
          {showBreakdown ? 'Hide' : 'Show'} Night-by-Night Breakdown
        </button>
      </div>

      {/* Night-by-Night Breakdown */}
      {showBreakdown && (
        <div className="night-breakdown">
          <h4>Night-by-Night Breakdown</h4>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Night Date</th>
                <th>People Present</th>
                <th>Count</th>
                <th>Nightly Cost</th>
                <th>Per-Person Cost</th>
              </tr>
            </thead>
            <tbody>
              {result.nightBreakdown.map((night) => (
                <tr key={night.date}>
                  <td>{format(parseISO(night.date), 'MMM dd, yyyy')}</td>
                  <td className="participants-list">
                    {night.presentParticipants.length > 0 
                      ? night.presentParticipants.join(', ')
                      : 'None'
                    }
                  </td>
                  <td>{night.participantCount}</td>
                  <td>€{night.nightlyCost.toFixed(2)}</td>
                  <td>€{night.perPersonCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {result.nightBreakdown.some(night => night.participantCount === 0) && (
            <div className="warning-note">
              <p>⚠️ Warning: Some nights have no participants present</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}