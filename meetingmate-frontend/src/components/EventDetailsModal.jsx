import React from 'react';
import '../EventDetailsModal.scss';  // Ensure this SCSS file exists and contains your styles

const EventDetailsModal = ({ isOpen, onClose, eventData }) => {
  if (!isOpen || !eventData || eventData.events.length === 0) return null;

  // Extracting the single event and attendees from the passed eventData
  const { events, attendees } = eventData;
  const event = events[0];
  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Meeting details</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        <div className="modal-content">
          <div className="detail-row">
            <span className="detail-title">Who</span>
            <span>{event.creator.email}</span> {/* Replace with actual name if available */}
          </div>
          {/* Add more details such as 'Job' if applicable */}
          <div className="detail-row">
            <span className="detail-title">When</span>
            <span>{formatDate(event.start.dateTime)} - {formatDate(event.end.dateTime)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-title">Where</span>
            <span>{event.location || '-'}</span> {/* Replace with actual location */}
          </div>
          {event.hangoutLink && (
            <div className="detail-row">
              <span className="detail-title">Google Meet Link</span>
              <a href={event.hangoutLink} target="_blank" rel="noopener noreferrer" className="invite-link">
                Join Meeting
              </a>
            </div>
          )}
          <div className="detail-row">
            <span className="detail-title">Participants</span>
            <ul>
              {event.attendees.map(attendee => (
                <li key={attendee.email} className="participant-item">
                  {attendees[attendee.email] && attendees[attendee.email].name
                    ? <div>
                      <span className="participant-name">{attendees[attendee.email].name}</span>
                      <span className="participant-email">({attendee.email})</span>
                    </div>
                    : <span className="participant-email">{attendee.email}</span>}
                </li>
              ))}
            </ul>

          </div>
        </div>
        <div className="modal-footer">
          <button className="action-button reschedule">Reschedule</button>
          <button className="action-button cancel">Cancel meeting</button>
        </div>
      </div>
    </div>
  )
};

export default EventDetailsModal;
