import { useState } from 'react';
import type { AdditionalActivity, Participant, Tip } from '../types';

interface AdditionalActivitiesProps {
  participants: Participant[];
  activities: AdditionalActivity[];
  onAddActivity: (activity: Omit<AdditionalActivity, 'id'>) => void;
  onRemoveActivity: (id: string) => void;
  onUpdateActivity: (id: string, activity: Omit<AdditionalActivity, 'id'>) => void;
}

export function AdditionalActivities({ 
  participants, 
  activities, 
  onAddActivity, 
  onRemoveActivity, 
  onUpdateActivity 
}: AdditionalActivitiesProps) {
  const [tipActivity, setTipActivity] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipGiver, setTipGiver] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [splitAmongEveryone, setSplitAmongEveryone] = useState(false);
  const [newActivity, setNewActivity] = useState<Omit<AdditionalActivity, 'id'>>({
    type: 'loan' as const,
    description: '',
    amount: 0,
    fromParticipantIds: [] as string[],
    toParticipantIds: [] as string[],
    splitEqually: true,
    tips: [] as Tip[]
  });

  const resetNewActivity = () => {
    setNewActivity({
      type: 'loan' as const,
      description: '',
      amount: 0,
      fromParticipantIds: [],
      toParticipantIds: [],
      splitEqually: true,
      tips: []
    });
    setSplitAmongEveryone(false);
  };

  const handleSplitAmongEveryoneChange = (checked: boolean) => {
    setSplitAmongEveryone(checked);
    if (checked) {
      // When splitting among everyone, everyone is in toParticipantIds
      const allParticipantIds = participants.map(p => p.id);
      setNewActivity(prev => ({
        ...prev,
        toParticipantIds: allParticipantIds
      }));
    }
  };

  const handleAddActivity = () => {
    if (!newActivity.description.trim() || newActivity.amount <= 0 || 
        newActivity.fromParticipantIds.length === 0 || newActivity.toParticipantIds.length === 0) {
      return;
    }
    
    onAddActivity(newActivity);
    resetNewActivity();
  };

  const toggleParticipantSelection = (participantId: string, field: 'fromParticipantIds' | 'toParticipantIds') => {
    setNewActivity(prev => ({
      ...prev,
      [field]: prev[field].includes(participantId)
        ? prev[field].filter(id => id !== participantId)
        : [...prev[field], participantId]
    }));
  };

  const handleAddTip = (activityId: string) => {
    if (tipAmount > 0 && tipGiver) {
      const activity = activities.find(m => m.id === activityId);
      if (activity) {
        const newTip: Tip = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          amount: tipAmount,
          fromParticipantId: tipGiver
        };
        
        const updatedActivity = {
          ...activity,
          tips: [...activity.tips, newTip]
        };
        onUpdateActivity(activityId, updatedActivity);
        setTipActivity(null);
        setTipAmount(0);
        setTipGiver('');
      }
    }
  };

  const handleRemoveTip = (activityId: string, tipId: string) => {
    const activity = activities.find(m => m.id === activityId);
    if (activity) {
      const updatedActivity = {
        ...activity,
        tips: activity.tips.filter(tip => tip.id !== tipId)
      };
      onUpdateActivity(activityId, updatedActivity);
    }
  };

  const getParticipantName = (id: string) => {
    const participant = participants.find(p => p.id === id);
    return participant ? participant.name : 'Unknown';
  };

  const getActivityTypeLabel = (type: AdditionalActivity['type']) => {
    switch (type) {
      case 'loan': return 'Loan';
      case 'service_provided': return 'Service Provided';
      case 'service_purchased': return 'Service Purchased';
    }
  };

  const getActivityDescription = (activity: AdditionalActivity) => {
    const fromNames = activity.fromParticipantIds.map(id => getParticipantName(id));
    const toNames = activity.toParticipantIds.map(id => getParticipantName(id));
    const fromText = fromNames.length > 1 ? `${fromNames.slice(0, -1).join(', ')} & ${fromNames.slice(-1)}` : fromNames[0];
    const toText = toNames.length > 1 ? `${toNames.slice(0, -1).join(', ')} & ${toNames.slice(-1)}` : toNames[0];
    
    const amountPerProvider = activity.amount / activity.fromParticipantIds.length;
    const amountPerRecipient = activity.amount / activity.toParticipantIds.length;
    
    let description = '';
    
    switch (activity.type) {
      case 'loan':
        if (activity.fromParticipantIds.length === 1 && activity.toParticipantIds.length === 1) {
          description = `${fromText} lends €${activity.amount.toFixed(2)} to ${toText}`;
        } else if (activity.fromParticipantIds.length === 1) {
          description = `${fromText} lends €${amountPerRecipient.toFixed(2)} each to ${toText} (total: €${activity.amount.toFixed(2)})`;
        } else {
          description = `${fromText} lend €${amountPerProvider.toFixed(2)} each to ${toText} (total: €${activity.amount.toFixed(2)})`;
        }
        break;
      case 'service_provided':
        description = `${fromText} provide service to ${toText} for €${activity.amount.toFixed(2)} total`;
        break;
      case 'service_purchased':
        description = `${fromText} purchase service for ${toText} at €${activity.amount.toFixed(2)} total`;
        break;
    }
    
    // Add tips information if present
    if (activity.tips && activity.tips.length > 0) {
      const totalTips = activity.tips.reduce((sum, tip) => sum + tip.amount, 0);
      const tipText = activity.tips.map(tip => {
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
    <div className="additional-activities">
      <h3>Additional Activities (Loans & Services)</h3>
      <p className="activity-description">
        Track loans between participants and services provided/purchased. This affects the final cost breakdown.
      </p>

      {/* Add New Activity Toggle */}
      <div className="section-header" onClick={() => setShowAddForm(!showAddForm)}>
        <h4>Add New Activity</h4>
        <span className="collapse-icon">{showAddForm ? '−' : '+'}</span>
      </div>

      {/* Add New Activity Form */}
      {showAddForm && (
        <div className="section-content">
          <div className="add-activity-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="activityType">Type</label>
            <select
              id="activityType"
              value={newActivity.type}
              onChange={(e) => setNewActivity(prev => ({ 
                ...prev, 
                type: e.target.value as AdditionalActivity['type'] 
              }))}
            >
              <option value="loan">Loan</option>
              <option value="service_provided">Service Provided</option>
              <option value="service_purchased">Service Purchased</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="activityDescription">Description</label>
            <input
              id="activityDescription"
              type="text"
              placeholder="e.g., Airport taxi, Grocery shopping, Gas money"
              value={newActivity.description}
              onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label htmlFor="activityAmount">Amount (€)</label>
            <input
              id="activityAmount"
              type="number"
              step="0.01"
              min="0"
              value={newActivity.amount || ''}
              onChange={(e) => setNewActivity(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-item split-everyone-option">
              <input
                type="checkbox"
                checked={splitAmongEveryone}
                onChange={(e) => handleSplitAmongEveryoneChange(e.target.checked)}
              />
              Split cost among everyone (including service provider/lender)
            </label>
            <small className="help-text">
              When checked, the cost is divided equally among all participants, and the service provider/lender pays their share too.
            </small>
          </div>

          <div className="participants-row">
            <div className="form-group participants-selection">
              <label>
                {newActivity.type === 'loan' ? 'Lenders' : 
                 newActivity.type === 'service_provided' ? 'Service Providers' : 'Service Purchasers'}
                <span className="selection-count">
                  ({newActivity.fromParticipantIds.length} selected)
                </span>
              </label>
              <div className="checkbox-group">
                {participants.map(p => (
                  <label key={p.id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={newActivity.fromParticipantIds.includes(p.id)}
                      onChange={() => toggleParticipantSelection(p.id, 'fromParticipantIds')}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group participants-selection">
              <label>
                {splitAmongEveryone ? 'Cost Split Among All Participants' :
                 newActivity.type === 'loan' ? 'Borrowers' : 
                 newActivity.type === 'service_provided' ? 'Service Recipients' : 'Service Providers'}
                <span className="selection-count">
                  ({newActivity.toParticipantIds.length} selected)
                </span>
              </label>
              <div className="checkbox-group">
                {participants
                  .filter(p => splitAmongEveryone ? true : !newActivity.fromParticipantIds.includes(p.id))
                  .map(p => (
                    <label key={p.id} className={`checkbox-item ${splitAmongEveryone ? 'disabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={newActivity.toParticipantIds.includes(p.id)}
                        onChange={() => !splitAmongEveryone && toggleParticipantSelection(p.id, 'toParticipantIds')}
                        disabled={splitAmongEveryone}
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
            onClick={handleAddActivity}
            disabled={!newActivity.description.trim() || newActivity.amount <= 0 || 
                      newActivity.fromParticipantIds.length === 0 || newActivity.toParticipantIds.length === 0}
            className="add-button"
          >
            Add Activity
          </button>
        </div>
        </div>
      </div>
      )}

      {/* Existing Activities Grid */}
      {activities.length > 0 && (
        <div className="activities-grid">
          <h4>Current Activities</h4>
          <div className="activities-grid-container">
            {activities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-card-header">
                  <span className="activity-type">{getActivityTypeLabel(activity.type)}</span>
                  <button 
                    onClick={() => onRemoveActivity(activity.id)}
                    className="remove-button-small"
                    title="Remove activity"
                  >
                    ×
                  </button>
                </div>
                <div className="activity-card-content">
                  <div className="activity-description">
                    <strong>{activity.description}</strong>
                  </div>
                  <div className="activity-amount">€{activity.amount.toFixed(2)}</div>
                  <div className="activity-details">
                    {getActivityDescription(activity)}
                  </div>
                  
                  {/* Tip functionality for services only */}
                  {(activity.type === 'service_provided' || activity.type === 'service_purchased') && (
                    <div className="tip-section">
                      {/* Existing Tips */}
                      {activity.tips && activity.tips.length > 0 && (
                        <div className="existing-tips">
                          {activity.tips.map((tip) => (
                            <div key={tip.id} className="existing-tip">
                              <div className="tip-info">
                                Tip: €{tip.amount.toFixed(2)} from {getParticipantName(tip.fromParticipantId)}
                              </div>
                              <button 
                                onClick={() => handleRemoveTip(activity.id, tip.id)}
                                className="remove-tip-button"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Add Tip Form or Button */}
                      {tipActivity === activity.id ? (
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
                              onClick={() => handleAddTip(activity.id)}
                              disabled={!tipAmount || !tipGiver}
                              className="add-tip-confirm"
                            >
                              Add Tip
                            </button>
                            <button 
                              onClick={() => {
                                setTipActivity(null);
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
                          onClick={() => setTipActivity(activity.id)}
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

      {activities.length === 0 && (
        <div className="no-activities">
          <p>No additional activities added yet. Add loans or services above to include them in the cost breakdown.</p>
        </div>
      )}
    </div>
  );
}