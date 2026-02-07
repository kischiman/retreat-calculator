import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { saveCalculation, loadCalculation, getRedisClient } from './services/database';
import './App.css';

const SHARED_CALCULATION_ID = 'shared-retreat-calculation';

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
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

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
        ...module,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        fromParticipantIds,
        toParticipantIds
      };
    }).filter(Boolean) as AdditionalModule[];

    setAdditionalModules(newModules);
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

  // Auto-save function
  const saveToDatabase = useCallback(async () => {
    try {
      // Only save if we have meaningful data
      if (participants.length === 0 && settings.totalCost === 0 && additionalModules.length === 0) {
        return;
      }

      setSaveStatus('saving');
      await saveCalculation(
        SHARED_CALCULATION_ID,
        'Shared Retreat Calculation',
        participants,
        settings,
        additionalModules
      );
      setSaveStatus('saved');
      
      // Clear save status after 2 seconds
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (error) {
      console.error('Error saving calculation:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  }, [participants, settings, additionalModules]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if database is available
        try {
          getRedisClient();
        } catch (error) {
          console.log('Database not configured, using local state only');
          setIsLoading(false);
          return;
        }

        const savedData = await loadCalculation(SHARED_CALCULATION_ID);
        if (savedData) {
          setParticipants(savedData.participants);
          setSettings(savedData.settings);
          setAdditionalModules(savedData.additionalModules);
        }
      } catch (error) {
        console.error('Error loading calculation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-save when data changes
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        saveToDatabase();
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [participants, settings, additionalModules, isLoading, saveToDatabase]);

  if (isLoading) {
    return (
      <div className="app">
        <div className="container">
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <h2>Loading retreat calculation...</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        {/* Save Status */}
        {saveStatus && (
          <div style={{ 
            position: 'fixed', 
            top: '20px', 
            right: '20px', 
            padding: '10px 15px', 
            borderRadius: '5px',
            color: 'white',
            fontSize: '14px',
            zIndex: 1000,
            backgroundColor: 
              saveStatus === 'saving' ? '#007bff' :
              saveStatus === 'saved' ? '#28a745' : '#dc3545'
          }}>
            {saveStatus === 'saving' ? '💾 Saving...' :
             saveStatus === 'saved' ? '✅ Saved' : '❌ Save failed'}
          </div>
        )}
        
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