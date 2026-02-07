import type { BookingSettings as BookingSettingsType } from '../types';
import { differenceInDays, parseISO } from 'date-fns';

interface BookingSettingsProps {
  settings: BookingSettingsType;
  onUpdateSettings: (settings: Partial<BookingSettingsType>) => void;
  onLoadExample: () => void;
  csvImportComponent?: React.ReactNode;
}

export function BookingSettings({ 
  settings, 
  onUpdateSettings, 
  onLoadExample,
  csvImportComponent
}: BookingSettingsProps) {
  const totalNights = settings.startDate && settings.endDate 
    ? Math.max(0, differenceInDays(parseISO(settings.endDate), parseISO(settings.startDate)) + 1)
    : 0;

  return (
    <div className="booking-settings">
      <div className="settings-header">
        <h2>Retreat Cost Split Calculator</h2>
        <div className="header-actions">
          <button onClick={onLoadExample} className="load-example-button">
            Load Example Data
          </button>
          {csvImportComponent}
        </div>
      </div>
      
      <div className="settings-grid">
        <div className="setting-group">
          <label htmlFor="totalCost">Total Cost (€)</label>
          <input
            id="totalCost"
            type="number"
            step="0.01"
            min="0"
            value={settings.totalCost || ''}
            onChange={(e) => onUpdateSettings({ totalCost: parseFloat(e.target.value) || 0 })}
          />
        </div>

        <div className="setting-group">
          <label htmlFor="startDate">First Night Date</label>
          <input
            id="startDate"
            type="date"
            value={settings.startDate}
            onChange={(e) => onUpdateSettings({ startDate: e.target.value })}
          />
        </div>

        <div className="setting-group">
          <label htmlFor="endDate">Last Night Date</label>
          <input
            id="endDate"
            type="date"
            value={settings.endDate}
            onChange={(e) => onUpdateSettings({ endDate: e.target.value })}
          />
        </div>

        <div className="setting-group">
          <label htmlFor="exchangeRate">Exchange Rate (EUR → USD)</label>
          <input
            id="exchangeRate"
            type="number"
            step="0.01"
            min="0"
            value={settings.exchangeRate}
            onChange={(e) => onUpdateSettings({ exchangeRate: parseFloat(e.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="booking-summary">
        <p><strong>Booking Summary:</strong></p>
        <p>Total Nights: <strong>{totalNights}</strong></p>
        <p>Cost per Night: <strong>€{totalNights > 0 ? (settings.totalCost / totalNights).toFixed(2) : '0.00'}</strong></p>
      </div>


    </div>
  );
}