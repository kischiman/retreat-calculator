import { useState, useMemo, useEffect } from 'react';
import type { Participant, BookingSettings, ValidationError, AdditionalActivity } from './types';
import { calculateCostSplit, validateInputs } from './utils/calculations';
import { saveCalculation, loadCalculation, getShareableUrl } from './services/database';
import { BookingSettings as BookingSettingsComponent } from './components/BookingSettings';
import { ParticipantForm } from './components/ParticipantForm';
import { ResultsTables } from './components/ResultsTables';
import { ExportButtons } from './components/ExportButtons';
import { ValidationMessages } from './components/ValidationMessages';
import { AdditionalActivities } from './components/AdditionalActivities';
import { OccupancyOverview } from './components/OccupancyOverview';
import { SaveShare } from './components/SaveShare';
import { CsvImport } from './components/CsvImport';
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
    roundUSD: false,
    splitEvenly: true,
    calculationMethod: 'equal'
  });
  const [additionalActivities, setAdditionalActivities] = useState<AdditionalActivity[]>([]);
  
  // Database state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState<string>('');
  const [calculationId, setCalculationId] = useState<string>('');

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
    additionalActivities: any[];
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

  // Save calculation to database
  const handleSaveCalculation = async () => {
    if (participants.length === 0 || !settings.totalCost) {
      setSaveMessage('Please add participants and set a total cost before saving.');
      setSaveStatus('error');
      return;
    }

    setSaveStatus('saving');
    setSaveMessage('Saving calculation...');

    try {
      const result = await saveCalculation(participants, settings, additionalActivities);
      
      if (result.success && result.calculationId) {
        setCalculationId(result.calculationId);
        setSaveStatus('saved');
        setSaveMessage('Calculation saved! You can share this link with others.');
        
        // Update URL without page reload
        const newUrl = `${window.location.origin}${window.location.pathname}?calc=${result.calculationId}`;
        window.history.replaceState({}, document.title, newUrl);
      } else {
        setSaveStatus('error');
        setSaveMessage(result.message || 'Failed to save calculation');
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('An error occurred while saving the calculation');
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setSaveStatus('idle');
      setSaveMessage('');
    }, 5000);
  };

  // Auto-save calculation to existing ID
  const autoSaveCalculation = async () => {
    if (!calculationId) return;
    
    try {
      await saveCalculation(participants, settings, additionalActivities, calculationId);
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Load calculation from URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calcId = urlParams.get('calc');
    
    if (calcId) {
      setCalculationId(calcId);
      loadCalculationById(calcId);
    }
  }, []);

  // Auto-save when data changes (if we have a calculation ID)
  useEffect(() => {
    if (calculationId && participants.length > 0) {
      const timeoutId = setTimeout(() => {
        autoSaveCalculation();
      }, 1000); // Debounce saves by 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [participants, settings, additionalActivities, calculationId]);

  const loadCalculationById = async (id: string) => {
    try {
      const result = await loadCalculation(id);
      
      if (result.success && result.data) {
        const { participants: loadedParticipants, settings: loadedSettings, additionalActivities: loadedActivities } = result.data;
        
        // Map participants with new IDs to avoid conflicts
        const newParticipants = loadedParticipants.map(p => ({
          ...p,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
        }));
        
        setParticipants(newParticipants);
        updateSettings(loadedSettings);
        
        // Map activities with new participant IDs
        if (loadedActivities) {
          const activityMap = loadedParticipants.reduce((acc, oldP, index) => {
            acc[oldP.id] = newParticipants[index].id;
            return acc;
          }, {} as Record<string, string>);
          
          const newActivities = loadedActivities.map(activity => ({
            ...activity,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            fromParticipantIds: activity.fromParticipantIds.map(id => activityMap[id] || id),
            toParticipantIds: activity.toParticipantIds.map(id => activityMap[id] || id)
          }));
          
          setAdditionalActivities(newActivities);
        }
        
        setSaveMessage('Calculation loaded successfully!');
        setSaveStatus('saved');
        
        // Clear URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
        
        setTimeout(() => {
          setSaveStatus('idle');
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage(result.message || 'Failed to load calculation');
        setSaveStatus('error');
      }
    } catch (error) {
      setSaveMessage('An error occurred while loading the calculation');
      setSaveStatus('error');
    }
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
          settings={settings}
          onAddParticipant={addParticipant}
          onRemoveParticipant={removeParticipant}
          onUpdateParticipant={updateParticipant}
          onUpdateSettings={updateSettings}
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
            calculationMethod={settings.calculationMethod}
            onUpdateSettings={updateSettings}
          />
        )}

        {/* Save & Share */}
        <SaveShare
          onSave={handleSaveCalculation}
          saveStatus={saveStatus}
          saveMessage={saveMessage}
          calculationId={calculationId}
          getShareableUrl={getShareableUrl}
        />

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