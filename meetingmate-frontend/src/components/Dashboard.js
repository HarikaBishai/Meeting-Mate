// src/Dashboard.js

import React, { useEffect, useState } from 'react';
import '../Dashboard.scss'
import calendar from '../assets/calender.jpg';
import EventDetailsModal from './EventDetailsModal';
import ToggleButton from 'react-toggle-button';




function Dashboard() {
  const [isLoading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [attendees, setAttendees] = useState({});

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [reminders, setReminders] = useState({}); // Add state for reminders


  const handleViewClick = (eventData) => {
    setSelectedEvent(eventData);
    setModalOpen(true);  // Open the modal

  };

  const handleCloseModal = () => {
    setSelectedEvent(null);
  };


  const handleToggleReminder = async (eventId) => {
    const currentReminderStatus = reminders[eventId] || false;
    const newReminderStatus = !currentReminderStatus;

    try {
      // Update the reminder status in the frontend optimistically
      setReminders((prevReminders) => ({
        ...prevReminders,
        [eventId]: newReminderStatus,
      }));

      // Send the updated reminder status to the backend
      const response = await fetch(`http://localhost:3001/calendar/${eventId}/${newReminderStatus}`, {
        credentials: 'include', 
      });

      if (!response.ok) {
        // If the backend update fails, revert the reminder status in the frontend
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const updatedEvent = await response.json();
      console.log('Updated event with new reminder status:', updatedEvent);
    } catch (error) {
      console.error('Failed to update reminder status:', error);
      // Revert the reminder status in the frontend if the backend call fails
      setReminders((prevReminders) => ({
        ...prevReminders,
        [eventId]: currentReminderStatus,
      }));
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:3001/calendar/upcoming-events', {
          credentials: 'include', // Necessary for cookies and authentication
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEvents(data.events); // Set the events in state
        setAttendees(data.attendees); // Set the attendees in state
        setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);
  const formatDate = (dateTime) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateTime).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateTime) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateTime).toLocaleTimeString([], options);
  };


  const trimDescription = (description) => {
    return description?.length > 50 ? `${description.substring(0, 50)}...` : (description || '-');
  };


  if (isLoading) {
    return <div className="dashboard">Loading...</div>;
  }

  return (
    <div className="dashboard">

      <div className="dashboard-header">
        <div className="dashboard-header-img">
          <img src={calendar} alt="profile" className='img' />
        </div>

        <div className="dashboard-header-title">Upcoming Events</div>

      </div>
      {events.map((event) => (
        <div className="event" key={event.id}>
          <div className="event-detail">
            <div className="event-detail-datetime">
              <div className='event-detail-datetime-date'>{formatDate(event.start.dateTime)}</div>
              <div className="event-detail-datetime-time">
                {`${formatTime(event.start.dateTime)} - ${formatTime(event.end.dateTime)}`}
              </div>
            </div>
            <div className="event-detail-titlesummary">
              <div className="event-detail-titlesummary-title">{trimDescription(event.summary)}</div>

              <div className="event-detail-titlesummary-description">{trimDescription(event.description)}</div>

            </div>
            <div className="event-detail-viewbutton">
              <div className="button" onClick={() => handleViewClick(event)}>View</div>
            </div>
            <div className="event-detail-togglebutton">

              <div className="reminder-label">Reminders</div>

              <ToggleButton
                value={reminders[event.id] || false}
                onToggle={() => handleToggleReminder(event.id)}
                className='toggle-button'
              />
            </div>


          </div>

        </div>
      ))}

      <EventDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        eventData={{
          events: selectedEvent ? [selectedEvent] : [],  // Pass only the selected event
          attendees: attendees  // Pass all attendees for lookup
        }}
      />

    </div >
  );
}

export default Dashboard;
