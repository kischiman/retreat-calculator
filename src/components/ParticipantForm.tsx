import { useState } from 'react';
import type { Participant } from '../types';
import { format, parseISO } from 'date-fns';

interface ParticipantFormProps {
  participants: Participant[];
  onAddParticipant: (participant: Omit<Participant, 'id'>) => void;
  onRemoveParticipant: (id: string) => void;
  onUpdateParticipant: (id: string, participant: Omit<Participant, 'id'>) => void;
}

export function ParticipantForm({
  participants,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateParticipant
}: ParticipantFormProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    arrivalDate: '',
    departureDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newParticipant.name && newParticipant.arrivalDate && newParticipant.departureDate) {
      onAddParticipant(newParticipant);
      setNewParticipant({ name: '', arrivalDate: '', departureDate: '' });
    }
  };

  const handleParticipantChange = (id: string, field: keyof Omit<Participant, 'id'>, value: string | boolean) => {
    const participant = participants.find(p => p.id === id);
    if (participant) {
      onUpdateParticipant(id, {
        ...participant,
        [field]: value
      });
    }
  };

  return (
    <div className="participant-form">
      <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h3>Participants ({participants.length})</h3>
        <span className="collapse-icon">{isExpanded ? '−' : '+'}</span>
      </div>
      
      
      {isExpanded && (
        <div className="section-content">
          {/* Add new participant form */}
      <form onSubmit={handleSubmit} className="add-participant-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Name"
            value={newParticipant.name}
            onChange={(e) => setNewParticipant({ ...newParticipant, name: e.target.value })}
            required
          />
          <input
            type="date"
            placeholder="Arrival Date"
            value={newParticipant.arrivalDate}
            onChange={(e) => setNewParticipant({ ...newParticipant, arrivalDate: e.target.value })}
            required
          />
          <input
            type="date"
            placeholder="Departure Date"
            value={newParticipant.departureDate}
            onChange={(e) => setNewParticipant({ ...newParticipant, departureDate: e.target.value })}
            required
          />
          <button type="submit">Add Participant</button>
        </div>
      </form>

      {/* Existing participants */}
      {participants.length > 0 && (
        <div className="participants-list">
          <table className="participants-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Arrival Date</th>
                <th>Departure Date</th>
                <th>Nightly Rate</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((participant) => (
                <tr key={participant.id}>
                  <td>
                    {editingParticipant === participant.id ? (
                      <input
                        type="text"
                        value={participant.name}
                        onChange={(e) => handleParticipantChange(participant.id, 'name', e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <span className="participant-display-text">{participant.name}</span>
                    )}
                  </td>
                  <td>
                    {editingParticipant === participant.id ? (
                      <input
                        type="date"
                        value={participant.arrivalDate}
                        onChange={(e) => handleParticipantChange(participant.id, 'arrivalDate', e.target.value)}
                      />
                    ) : (
                      <span className="participant-display-text">
                        {format(parseISO(participant.arrivalDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingParticipant === participant.id ? (
                      <input
                        type="date"
                        value={participant.departureDate}
                        onChange={(e) => handleParticipantChange(participant.id, 'departureDate', e.target.value)}
                      />
                    ) : (
                      <span className="participant-display-text">
                        {format(parseISO(participant.departureDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </td>
                  <td>
                    <label className="checkbox-container">
                      <input
                        type="checkbox"
                        checked={participant.useNightlyRate || false}
                        onChange={(e) => handleParticipantChange(participant.id, 'useNightlyRate', e.target.checked)}
                        title="Calculate based on nights stayed instead of even split"
                      />
                      <span className="checkmark"></span>
                    </label>
                  </td>
                  <td>
                    <div className="participant-actions">
                      {editingParticipant === participant.id ? (
                        <>
                          <button
                            onClick={() => setEditingParticipant(null)}
                            className="save-button"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingParticipant(null)}
                            className="cancel-button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setEditingParticipant(participant.id)}
                            className="edit-button"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onRemoveParticipant(participant.id)}
                            className="remove-button"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {participants.length === 0 && (
        <p className="no-participants">No participants added yet. Add your first participant above.</p>
      )}


      {/* Nightly Rate Explanation */}
      {participants.length > 0 && (
        <div className="date-convention-note">
          <h4>Cost Calculation Methods</h4>
          <p>
            <strong>Even Split (default):</strong> Total cost is divided equally among all participants<br/>
            <strong>Nightly Rate:</strong> Cost calculated based on actual nights stayed (check the box for participants staying fewer nights)<br/>
            <strong>Mixed Mode:</strong> Those with nightly rate pay proportionally, remaining cost split equally among others
          </p>
        </div>
      )}

      {/* Date Convention Note */}
      <div className="date-convention-note">
        <h4>Date Convention</h4>
        <p>
          <strong>Arrival Date:</strong> The day someone checks in (they are present for the night starting this date)<br/>
          <strong>Departure Date:</strong> The day someone checks out (they are NOT present for the night starting this date)<br/>
          <strong>Example:</strong> Arrival Oct 23, Departure Oct 25 = 2 nights (nights of Oct 23 and Oct 24)
        </p>
      </div>
        </div>
      )}
    </div>
  );
}