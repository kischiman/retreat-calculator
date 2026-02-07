import { useRef, useState } from 'react';
import type { Participant, BookingSettings } from '../types';

interface CsvImportProps {
  onImport: (data: {
    participants: Omit<Participant, 'id'>[];
    settings: Partial<BookingSettings>;
    additionalActivities: any[]; // Temporary type to handle name-based imports
  }) => void;
}

interface ParsedData {
  participants: Omit<Participant, 'id'>[];
  settings: Partial<BookingSettings>;
  additionalActivities: any[]; // Temporary type to handle name-based imports
}

export function CsvImport({ onImport }: CsvImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState(false);

  const parseCSV = (csvText: string): ParsedData => {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line);
    let currentSection = '';
    const data: ParsedData = {
      participants: [],
      settings: {},
      additionalActivities: []
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip empty lines
      if (!line) continue;
      
      // Check for section headers
      if (line === 'SETTINGS') {
        currentSection = 'SETTINGS';
        continue;
      } else if (line === 'PARTICIPANTS') {
        currentSection = 'PARTICIPANTS';
        continue;
      } else if (line === 'ADDITIONAL_ACTIVITIES') {
        currentSection = 'ADDITIONAL_ACTIVITIES';
        continue;
      } else if (line === 'RESULTS' || line === 'NIGHT BREAKDOWN') {
        currentSection = 'SKIP'; // Skip results and breakdown sections
        continue;
      }

      // Skip header rows
      if (line.includes('Total Cost,Start Date') || 
          line.includes('Name,Arrival Date,Departure Date') ||
          line.includes('Type,Description,Amount,From Participants')) {
        continue;
      }

      // Parse data based on current section
      if (currentSection === 'SETTINGS') {
        const parts = line.split(',');
        if (parts.length >= 6) {
          data.settings = {
            totalCost: parseFloat(parts[0]) || 0,
            startDate: parts[1] || '',
            endDate: parts[2] || '', 
            exchangeRate: parseFloat(parts[3]) || 1.07,
            showUSD: parts[4] === 'true',
            roundUSD: parts[5] === 'true'
          };
        }
      } else if (currentSection === 'PARTICIPANTS') {
        const parts = line.split(',');
        if (parts.length >= 3 && parts[0] && parts[1] && parts[2]) {
          data.participants.push({
            name: parts[0].trim(),
            arrivalDate: parts[1].trim(),
            departureDate: parts[2].trim()
          });
        }
      } else if (currentSection === 'ADDITIONAL_ACTIVITIES') {
        const parts = line.split(',');
        if (parts.length >= 5) {
          // Remove quotes from description and participant lists
          const description = parts[1].replace(/^"(.*)"$/, '$1');
          const fromParticipantsStr = parts[3].replace(/^"(.*)"$/, '$1');
          const toParticipantsStr = parts[4].replace(/^"(.*)"$/, '$1');
          
          // Parse participant names (they will be mapped to IDs later)
          const fromParticipants = fromParticipantsStr.split(';').filter(name => name.trim());
          const toParticipants = toParticipantsStr.split(';').filter(name => name.trim());
          
          data.additionalActivities.push({
            type: parts[0] as 'loan' | 'service_provided' | 'service_purchased',
            description,
            amount: parseFloat(parts[2]) || 0,
            fromParticipantNames: fromParticipants, // Temporary field for import
            toParticipantNames: toParticipants,     // Temporary field for import
            splitEqually: true,
            tips: []
          });
        }
      }
    }

    return data;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError('');
    setImportSuccess(false);

    try {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      // Validate parsed data
      if (parsedData.participants.length === 0) {
        throw new Error('No participants found in CSV file');
      }

      // Validate participants have required fields
      for (const participant of parsedData.participants) {
        if (!participant.name || !participant.arrivalDate || !participant.departureDate) {
          throw new Error('All participants must have name, arrival date, and departure date');
        }
      }

      onImport(parsedData);
      setImportSuccess(true);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to parse CSV file');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const clearMessages = () => {
    setImportError('');
    setImportSuccess(false);
  };

  return (
    <div className="csv-import">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="import-actions">
        <button 
          onClick={handleImportClick}
          disabled={isImporting}
          className="import-button"
        >
          {isImporting ? 'Importing...' : '📁 Import CSV'}
        </button>
        
        <div className="import-help">
          <small>Import a previously exported CSV file to restore participants and activities</small>
        </div>
      </div>

      {importError && (
        <div className="import-message error">
          <span>❌ {importError}</span>
          <button onClick={clearMessages} className="close-message">×</button>
        </div>
      )}

      {importSuccess && (
        <div className="import-message success">
          <span>✅ CSV imported successfully!</span>
          <button onClick={clearMessages} className="close-message">×</button>
        </div>
      )}

      <div className="import-format-info">
        <details>
          <summary>CSV Format Information</summary>
          <div className="format-details">
            <p>The CSV should contain sections for:</p>
            <ul>
              <li><strong>SETTINGS:</strong> Total cost, dates, exchange rate</li>
              <li><strong>PARTICIPANTS:</strong> Name, arrival date, departure date</li>
              <li><strong>ADDITIONAL_ACTIVITIES:</strong> Loans and services (optional)</li>
            </ul>
            <p>Use the Export CSV button to see the exact format.</p>
          </div>
        </details>
      </div>
    </div>
  );
}