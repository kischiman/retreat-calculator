import { useState } from 'react';
import type { AdditionalModule, Participant, Tip } from '../types';

interface AdditionalModulesProps {
  participants: Participant[];
  modules: AdditionalModule[];
  onAddModule: (module: Omit<AdditionalModule, 'id'>) => void;
  onRemoveModule: (id: string) => void;
  onUpdateModule: (id: string, module: Omit<AdditionalModule, 'id'>) => void;
}

export function AdditionalModules({ 
  participants, 
  modules, 
  onAddModule, 
  onRemoveModule, 
  onUpdateModule 
}: AdditionalModulesProps) {
  const [tipModule, setTipModule] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipGiver, setTipGiver] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newModule, setNewModule] = useState<Omit<AdditionalModule, 'id'>>({
    type: 'loan' as const,
    description: '',
    amount: 0,
    fromParticipantIds: [] as string[],
    toParticipantIds: [] as string[],
    splitEqually: true,
    tips: [] as Tip[]
  });

  const resetNewModule = () => {
    setNewModule({
      type: 'loan' as const,
      description: '',
      amount: 0,
      fromParticipantIds: [],
      toParticipantIds: [],
      splitEqually: true,
      tips: []
    });
  };

  const handleAddModule = () => {
    if (!newModule.description.trim() || newModule.amount <= 0 || 
        newModule.fromParticipantIds.length === 0 || newModule.toParticipantIds.length === 0) {
      return;
    }
    
    onAddModule(newModule);
    resetNewModule();
  };

  const toggleParticipantSelection = (participantId: string, field: 'fromParticipantIds' | 'toParticipantIds') => {
    setNewModule(prev => ({
      ...prev,
      [field]: prev[field].includes(participantId)
        ? prev[field].filter(id => id !== participantId)
        : [...prev[field], participantId]
    }));
  };

  const handleAddTip = (moduleId: string) => {
    if (tipAmount > 0 && tipGiver) {
      const module = modules.find(m => m.id === moduleId);
      if (module) {
        const newTip: Tip = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          amount: tipAmount,
          fromParticipantId: tipGiver
        };
        
        const updatedModule = {
          ...module,
          tips: [...module.tips, newTip]
        };
        onUpdateModule(moduleId, updatedModule);
        setTipModule(null);
        setTipAmount(0);
        setTipGiver('');
      }
    }
  };

  const handleRemoveTip = (moduleId: string, tipId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      const updatedModule = {
        ...module,
        tips: module.tips.filter(tip => tip.id !== tipId)
      };
      onUpdateModule(moduleId, updatedModule);
    }
  };

  const getParticipantName = (id: string) => {
    const participant = participants.find(p => p.id === id);
    return participant ? participant.name : 'Unknown';
  };

  const getModuleTypeLabel = (type: AdditionalModule['type']) => {
    switch (type) {
      case 'loan': return 'Loan';
      case 'service_provided': return 'Service Provided';
      case 'service_purchased': return 'Service Purchased';
    }
  };

  const getModuleDescription = (module: AdditionalModule) => {
    const fromNames = module.fromParticipantIds.map(id => getParticipantName(id));
    const toNames = module.toParticipantIds.map(id => getParticipantName(id));
    const fromText = fromNames.length > 1 ? `${fromNames.slice(0, -1).join(', ')} & ${fromNames.slice(-1)}` : fromNames[0];
    const toText = toNames.length > 1 ? `${toNames.slice(0, -1).join(', ')} & ${toNames.slice(-1)}` : toNames[0];
    
    const amountPerProvider = module.amount / module.fromParticipantIds.length;
    const amountPerRecipient = module.amount / module.toParticipantIds.length;
    
    let description = '';
    
    switch (module.type) {
      case 'loan':
        if (module.fromParticipantIds.length === 1 && module.toParticipantIds.length === 1) {
          description = `${fromText} lends €${module.amount.toFixed(2)} to ${toText}`;
        } else if (module.fromParticipantIds.length === 1) {
          description = `${fromText} lends €${amountPerRecipient.toFixed(2)} each to ${toText} (total: €${module.amount.toFixed(2)})`;
        } else {
          description = `${fromText} lend €${amountPerProvider.toFixed(2)} each to ${toText} (total: €${module.amount.toFixed(2)})`;
        }
        break;
      case 'service_provided':
        description = `${fromText} provide service to ${toText} for €${module.amount.toFixed(2)} total`;
        break;
      case 'service_purchased':
        description = `${fromText} purchase service for ${toText} at €${module.amount.toFixed(2)} total`;
        break;
    }
    
    // Add tips information if present
    if (module.tips && module.tips.length > 0) {
      const totalTips = module.tips.reduce((sum, tip) => sum + tip.amount, 0);
      const tipText = module.tips.map(tip => {
        const tipGiver = getParticipantName(tip.fromParticipantId);
        return `€${tip.amount.toFixed(2)} from ${tipGiver}`;
      }).join(', ');
      description += `. Tips (total €${totalTips.toFixed(2)}): ${tipText}`;
    }
    
    return description;
  };

  if (participants.length === 0) {
    return null;
  }

  return (
    <div className="additional-modules">
      <h3>Additional Modules (Loans & Services)</h3>
      <p className="module-description">
        Track loans between participants and services provided/purchased. This affects the final cost breakdown.
      </p>

      {/* Add New Module Toggle */}
      <div className="section-header" onClick={() => setShowAddForm(!showAddForm)}>
        <h4>Add New Module</h4>
        <span className="collapse-icon">{showAddForm ? '−' : '+'}</span>
      </div>

      {/* Add New Module Form */}
      {showAddForm && (
        <div className="section-content">
          <div className="add-module-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="moduleType">Type</label>
            <select
              id="moduleType"
              value={newModule.type}
              onChange={(e) => setNewModule(prev => ({ 
                ...prev, 
                type: e.target.value as AdditionalModule['type'] 
              }))}
            >
              <option value="loan">Loan</option>
              <option value="service_provided">Service Provided</option>
              <option value="service_purchased">Service Purchased</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="moduleDescription">Description</label>
            <input
              id="moduleDescription"
              type="text"
              placeholder="e.g., Airport taxi, Grocery shopping, Gas money"
              value={newModule.description}
              onChange={(e) => setNewModule(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="moduleAmount">Amount (€)</label>
            <input
              id="moduleAmount"
              type="number"
              step="0.01"
              min="0"
              value={newModule.amount || ''}
              onChange={(e) => setNewModule(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>


          <div className="participants-row">
            <div className="form-group participants-selection">
              <label>
                {newModule.type === 'loan' ? 'Lenders' : 
                 newModule.type === 'service_provided' ? 'Service Providers' : 'Service Purchasers'}
                <span className="selection-count">
                  ({newModule.fromParticipantIds.length} selected)
                </span>
              </label>
              <div className="checkbox-group">
                {participants.map(p => (
                  <label key={p.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={newModule.fromParticipantIds.includes(p.id)}
                      onChange={() => toggleParticipantSelection(p.id, 'fromParticipantIds')}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group participants-selection">
              <label>
                {newModule.type === 'loan' ? 'Borrowers' : 
                 newModule.type === 'service_provided' ? 'Service Recipients' : 'Service Providers'}
                <span className="selection-count">
                  ({newModule.toParticipantIds.length} selected)
                </span>
              </label>
              <div className="checkbox-group">
                {participants
                  .filter(p => !newModule.fromParticipantIds.includes(p.id))
                  .map(p => (
                    <label key={p.id} className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={newModule.toParticipantIds.includes(p.id)}
                        onChange={() => toggleParticipantSelection(p.id, 'toParticipantIds')}
                      />
                      {p.name}
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={handleAddModule}
            disabled={!newModule.description.trim() || newModule.amount <= 0 || 
                      newModule.fromParticipantIds.length === 0 || newModule.toParticipantIds.length === 0}
            className="add-button"
          >
            Add Module
          </button>
        </div>
        </div>
      </div>
      )}

      {/* Existing Modules Grid */}
      {modules.length > 0 && (
        <div className="modules-grid">
          <h4>Current Modules</h4>
          <div className="modules-grid-container">
            {modules.map(module => (
              <div key={module.id} className="module-card">
                <div className="module-card-header">
                  <span className="module-type">{getModuleTypeLabel(module.type)}</span>
                  <button 
                    onClick={() => onRemoveModule(module.id)}
                    className="remove-button-small"
                    title="Remove module"
                  >
                    ×
                  </button>
                </div>
                <div className="module-card-content">
                  <div className="module-description">
                    <strong>{module.description}</strong>
                  </div>
                  <div className="module-amount">€{module.amount.toFixed(2)}</div>
                  <div className="module-details">
                    {getModuleDescription(module)}
                  </div>
                  
                  {/* Tip functionality for services only */}
                  {(module.type === 'service_provided' || module.type === 'service_purchased') && (
                    <div className="tip-section">
                      {/* Existing Tips */}
                      {module.tips && module.tips.length > 0 && (
                        <div className="existing-tips">
                          {module.tips.map((tip) => (
                            <div key={tip.id} className="existing-tip">
                              <div className="tip-info">
                                Tip: €{tip.amount.toFixed(2)} from {getParticipantName(tip.fromParticipantId)}
                              </div>
                              <button 
                                onClick={() => handleRemoveTip(module.id, tip.id)}
                                className="remove-tip-button"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add Tip Form or Button */}
                      {tipModule === module.id ? (
                        <div className="add-tip-form">
                          <div className="tip-inputs">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="Tip amount"
                              value={tipAmount || ''}
                              onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                            />
                            <select
                              value={tipGiver}
                              onChange={(e) => setTipGiver(e.target.value)}
                            >
                              <option value="">Select tip giver</option>
                              {participants.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="tip-actions">
                            <button 
                              onClick={() => handleAddTip(module.id)}
                              disabled={!tipAmount || !tipGiver}
                              className="add-tip-confirm"
                            >
                              Add Tip
                            </button>
                            <button 
                              onClick={() => {
                                setTipModule(null);
                                setTipAmount(0);
                                setTipGiver('');
                              }}
                              className="cancel-tip"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setTipModule(module.id)}
                          className="add-tip-button"
                        >
                          Add Tip
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {modules.length === 0 && (
        <div className="no-modules">
          <p>No additional modules added yet. Add loans or services above to include them in the cost breakdown.</p>
        </div>
      )}
    </div>
  );
}