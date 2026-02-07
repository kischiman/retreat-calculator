import { useState, useMemo } from 'react';
import type { Participant, BookingSettings, ValidationError, AdditionalModule } from './types';
import { calculateCostSplit, validateInputs } from './utils/calculations';
import { BookingSettings as BookingSettingsComponent } from './components/BookingSettings';
import { ParticipantForm } from './components/ParticipantForm';
import { ResultsTables } from './components/ResultsTables';
import { ExportButtons } from './components/ExportButtons';
import { ValidationMessages } from './components/ValidationMessages';
import { AdditionalModules } from './components/AdditionalModules';
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
  const [additionalModules, setAdditionalModules] = useState<AdditionalModule[]>([]);

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

  const addAdditionalModule = (module: Omit<AdditionalModule, 'id'>) => {
    const newModule: AdditionalModule = {
      ...module,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setAdditionalModules(prev => [...prev, newModule]);
  };

  const removeAdditionalModule = (id: string) => {
    setAdditionalModules(prev => prev.filter(m => m.id !== id));
  };

  const updateAdditionalModule = (id: string, module: Omit<AdditionalModule, 'id'>) => {
    setAdditionalModules(prev =>
      prev.map(m => (m.id === id ? { ...module, id } : m))
    );
  };

  const handleCsvImport = (data: {
    participants: Omit<Participant, 'id'>[];
    settings: Partial<BookingSettings>;
    additionalModules: Omit<AdditionalModule, 'id' | 'fromParticipantIds' | 'toParticipantIds'>[];
  }) => {
    // Import participants
    const newParticipants = data.participants.map(p => ({
      ...p,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    setParticipants(newParticipants);

    // Import settings
    updateSettings(data.settings);

    // Import additional modules
    const newModules = data.additionalModules.map(module => {
      // CSV import doesn't include participant IDs, so we start with empty arrays
      const fromParticipantIds: string[] = [];
      const toParticipantIds: string[] = [];
      
      if (fromParticipantIds.length === 0 || toParticipantIds.length === 0) {
        console.warn(`Could not find participants for module: ${module.description}`);
        return null;
      }

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: module.type,
        description: module.description,
        amount: module.amount,
        fromParticipantIds,
        toParticipantIds,
        splitEqually: true
      } as AdditionalModule;
    }).filter(Boolean) as AdditionalModule[];

    setAdditionalModules(newModules);
  };

  // Validation and calculations
  const validationErrors: ValidationError[] = useMemo(() => {
    return validateInputs(participants, settings);
  }, [participants, settings]);

  const hasErrors = validationErrors.some(e => e.type === 'error');

  const calculationResult = useMemo(() => {
    if (hasErrors || participants.length === 0) {
      return {
        participants: [],
        nightBreakdown: [],
        totalNights: 0,
        roundingAdjustment: 0,
        additionalModules: []
      };
    }
    return calculateCostSplit(participants, settings, additionalModules);
  }, [participants, settings, additionalModules, hasErrors]);

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
        <ValidationMessages errors={validationErrors} />

        {/* Participants Management */}
        <ParticipantForm
          participants={participants}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
          onUpdateParticipant={updateParticipant}
        />

        {/* Participant Timeline Visualization */}
        {participants.length > 0 && settings.startDate && settings.endDate && (
          <div className="timeline-section">
            <h3>Occupancy per Night</h3>
            
            {/* Occupancy overview with integrated detailed timeline */}
            {calculationResult.nightBreakdown.length > 0 && (
              <div className="occupancy-container">
                <OccupancyOverview 
                  nightBreakdown={calculationResult.nightBreakdown}
                  startDate={settings.startDate}
                  endDate={settings.endDate}
                  participants={participants}
                />
              </div>
            )}
          </div>
        )}

        {/* Additional Modules (Loans & Services) */}
        <AdditionalModules
          participants={participants}
          modules={additionalModules}
          onAddModule={addAdditionalModule}
          onRemoveModule={removeAdditionalModule}
          onUpdateModule={updateAdditionalModule}
        />

        {/* Results Tables */}
        {!hasErrors && (
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