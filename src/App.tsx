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

    // Import additional modules (CSV import is simplified, so we skip modules for now)
    // In the future, CSV could include participant mappings to properly import modules
    setAdditionalModules([]);
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

        {/* Additional Modules */}
        <AdditionalModules
          participants={participants}
          modules={additionalModules}
          onAddModule={addAdditionalModule}
          onRemoveModule={removeAdditionalModule}
          onUpdateModule={updateAdditionalModule}
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