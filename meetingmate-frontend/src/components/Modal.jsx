const Modal = ({ isOpen, onClose, eventDetails }) => {
    if (!isOpen) return null;
  
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Meeting details</h2>
            <button className="close-button" onClick={onClose}>✖</button>
          </div>
          <div className="modal-body">
            <div className="detail-row">
              <span className="detail-title">Who</span>
              <span className="detail-action">View profile</span>
            </div>
            {/* Repeat for each detail row */}
          </div>
          <div className="modal-actions">
            <button className="action-button reschedule">Reschedule</button>
            <button className="action-button cancel">Cancel meeting</button>
          </div>
        </div>
      </div>
    );
  };

