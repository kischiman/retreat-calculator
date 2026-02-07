import type { ValidationError } from '../types';

interface ValidationMessagesProps {
  errors: ValidationError[];
}

export function ValidationMessages({ errors }: ValidationMessagesProps) {
  if (errors.length === 0) {
    return null;
  }

  const errorMessages = errors.filter(e => e.type === 'error');
  const warningMessages = errors.filter(e => e.type === 'warning');

  return (
    <div className="validation-messages">
      {errorMessages.length > 0 && (
        <div className="validation-errors">
          <h4>⚠️ Errors</h4>
          <ul>
            {errorMessages.map((error, index) => (
              <li key={index} className="error-message">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warningMessages.length > 0 && (
        <div className="validation-warnings">
          <h4>⚠️ Warnings</h4>
          <ul>
            {warningMessages.map((warning, index) => (
              <li key={index} className="warning-message">
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}