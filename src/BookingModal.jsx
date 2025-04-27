// BookingModal.jsx
import React, { useState } from "react";
import "./BookingModal.css";

export default function BookingModal({ show, onClose, onSubmit, bookingInfo, projectId }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }
    onSubmit({
      project_id: projectId,
      resource_id: bookingInfo.resource_id,
      task_id: 1, // You can make this dynamic later
      start_date: startDate,
      end_date: endDate,
    });
  }

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Book Resource: {bookingInfo.resource_name}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Start Date/Time:</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label>End Date/Time:</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="button-group">
            <button type="submit">Book</button>
            <button type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
