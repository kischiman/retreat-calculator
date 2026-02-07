import { useState, useMemo } from 'react';
import type { Participant, BookingSettings, ValidationError, AdditionalActivity } from './types';
import { calculateCostSplit, validateInputs } from './utils/calculations';
import { BookingSettings as BookingSettingsComponent } from './components/BookingSettings';
import { ParticipantForm } from './components/ParticipantForm';
import { ResultsTables } from './components/ResultsTables';
import { ExportButtons } from './components/ExportButtons';
import { ValidationMessages } from './components/ValidationMessages';
import { AdditionalActivities } from './components/AdditionalActivities';
import { CsvImport } from './components/CsvImport';
import { OccupancyOverview } from './components/OccupancyOverview';
import { exampleParticipants, exampleSettings } from './data/exampleData';
import './App.css';

function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<BookingSettings>({
    totalCost: 0,
    startDate: '',
    endDate: '',
    currency: 'EUR',
    exchangeRate: 1.07,
    showUSD: false,
    roundUSD: false
  });
  const [additionalActivities, setAdditionalActivities] = useState<AdditionalActivity[]>([]);

  const addParticipant = (participant: Omit<Participant, 'id'>) => {
    const newParticipant: Participant = {
      ...participant,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const removeParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const updateParticipant = (id: string, participant: Omit<Participant, 'id'>) => {
    setParticipants(prev =>
      prev.map(p => (p.id === id ? { ...participant, id } : p))
    );
  };

  const updateSettings = (newSettings: Partial<BookingSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const loadExampleData = () => {
    const newParticipants = exampleParticipants.map(p => ({
      ...p,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setParticipants(newParticipants);
    updateSettings(exampleSettings);
  };

  const addAdditionalActivity = (activity: Omit<AdditionalActivity, 'id'>) => {
    const newActivity: AdditionalActivity = {
      ...activity,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setAdditionalActivities(prev => [...prev, newActivity]);
  };

  const removeAdditionalActivity = (id: string) => {
    setAdditionalActivities(prev => prev.filter(m => m.id !== id));
  };

  const updateAdditionalActivity = (id: string, activity: Omit<AdditionalActivity, 'id'>) => {
    setAdditionalActivities(prev =>
      prev.map(m => (m.id === id ? { ...activity, id } : m))
    );
  };

  const handleCsvImport = (data: {
    participants: Omit<Participant, 'id'>[];
    settings: Partial<BookingSettings>;
    additionalActivities: any[]; // Temporary type to handle names
  }) => {
    // Import participants
    const newParticipants = data.participants.map(p => ({
      ...p,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setParticipants(newParticipants);

    // Import settings
    updateSettings(data.settings);

    // Import additional activities with participant name mapping
    const newActivities = data.additionalActivities.map(activity => {
      // Map participant names to IDs
      const fromParticipantIds: string[] = [];
      const toParticipantIds: string[] = [];
      
      if (activity.fromParticipantNames) {
        activity.fromParticipantNames.forEach((name: string) => {
          const participant = newParticipants.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
          if (participant) {
            fromParticipantIds.push(participant.id);
          }
        });
      }
      
      if (activity.toParticipantNames) {
        activity.toParticipantNames.forEach((name: string) => {
          const participant = newParticipants.find(p => p.name.toLowerCase().trim() === name.toLowerCase().trim());
          if (participant) {
            toParticipantIds.push(participant.id);
          }
        });
      }
      
      // Only include activity if we found all participants
      if (fromParticipantIds.length > 0 && toParticipantIds.length > 0) {
        return {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          type: activity.type,
          description: activity.description,
          amount: activity.amount,
          fromParticipantIds,
          toParticipantIds,
          splitEqually: true,
          tips: []
        };
      }
      return null;
    }).filter(Boolean) as AdditionalActivity[];

    setAdditionalActivities(newActivities);
  };

  const validationErrors: ValidationError[] = useMemo(() => {
    return validateInputs(participants, settings);
  }, [participants, settings]);

  const hasErrors = validationErrors.some(error => error.type === 'error');

  const calculationResult = useMemo(() => {
    if (hasErrors) {
      return {
        participants: [],
        nightBreakdown: [],
        totalNights: 0,
        roundingAdjustment: 0,
        additionalActivities: []
      };
    }
    return calculateCostSplit(participants, settings, additionalActivities);
  }, [participants, settings, additionalActivities, hasErrors]);

  return (
    <div className="app">
      <div className="container">
        {/* Header and Settings */}
        <BookingSettingsComponent
          settings={settings}
          onUpdateSettings={updateSettings}
          onLoadExample={loadExampleData}
          csvImportComponent={
            <CsvImport onImport={handleCsvImport} />
          }
        />

        {/* Validation Messages */}
        {validationErrors.length > 0 && (
          <ValidationMessages errors={validationErrors} />
        )}

        {/* Participants */}
        <ParticipantForm
          participants={participants}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
          onUpdateParticipant={updateParticipant}
        />

        {/* Occupancy Overview & Results */}
        {!hasErrors && participants.length > 0 && calculationResult.nightBreakdown.length > 0 && (
          <OccupancyOverview
            participants={participants}
            nightBreakdown={calculationResult.nightBreakdown}
            startDate={settings.startDate}
            endDate={settings.endDate}
          />
        )}

        {/* Additional Activities */}
        <AdditionalActivities
          participants={participants}
          activities={additionalActivities}
          onAddActivity={addAdditionalActivity}
          onRemoveActivity={removeAdditionalActivity}
          onUpdateActivity={updateAdditionalActivity}
        />

        {/* Results */}
        {!hasErrors && calculationResult.participants.length > 0 && (
          <ResultsTables
            result={calculationResult}
            showUSD={settings.showUSD}
            roundUSD={settings.roundUSD}
            onUpdateSettings={updateSettings}
          />
        )}

        {/* Export Buttons */}
        {!hasErrors && calculationResult.participants.length > 0 && (
          <ExportButtons
            result={calculationResult}
            showUSD={settings.showUSD}
            roundUSD={settings.roundUSD}
            totalCost={settings.totalCost}
            settings={settings}
          />
        )}
      </div>
    </div>
  );
}

export default App;