interface SaveShareProps {
  onSave: () => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  saveMessage: string;
  calculationId: string;
  getShareableUrl: (id: string) => string;
}

export function SaveShare({ onSave, saveStatus, saveMessage, calculationId, getShareableUrl }: SaveShareProps) {
  const handleCopyLink = async () => {
    if (calculationId) {
      try {
        await navigator.clipboard.writeText(getShareableUrl(calculationId));
        // Could add a toast notification here
      } catch (error) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = getShareableUrl(calculationId);
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <div className="save-share section">
      <h3>💾 Save & Share</h3>
      <p className="save-description">
        Save your calculation to get a shareable link that others can use to view the results.
      </p>
      
      <div className="save-actions">
        <button 
          onClick={onSave} 
          disabled={saveStatus === 'saving'}
          className="save-button"
        >
          {saveStatus === 'saving' ? 'Saving...' : '💾 Save Calculation'}
        </button>
        
        {calculationId && (
          <button 
            onClick={handleCopyLink}
            className="copy-link-button"
          >
            🔗 Copy Shareable Link
          </button>
        )}
      </div>
      
      {saveMessage && (
        <div className={`save-message ${saveStatus}`}>
          <span>
            {saveStatus === 'saved' ? '✅' : saveStatus === 'error' ? '❌' : 'ℹ️'} 
            {saveMessage}
          </span>
        </div>
      )}
      
      {calculationId && (
        <div className="share-info">
          <p><strong>Shareable URL:</strong></p>
          <div className="url-display">
            <input 
              type="text" 
              readOnly 
              value={getShareableUrl(calculationId)}
              className="url-input"
            />
          </div>
        </div>
      )}
    </div>
  );
}