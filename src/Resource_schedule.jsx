// Resource_schedule.jsx
import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import interactionPlugin from "@fullcalendar/interaction";
import BookingModal from "./BookingModal";
import axios from "axios";

export default function ResourceSchedule({ projectId }) {
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchSchedule();
  }, [projectId]);

  const fetchSchedule = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${projectId}/schedule`);
      const data = await res.json();
      setResources(
        data.map((r) => ({
          id: r.resource_id.toString(),
          title: r.resource_name,
        }))
      );
      setEvents(
        data.map((item, idx) => ({
          id: idx.toString(),
          resourceId: item.resource_id.toString(),
          title: "Booked",
          start: item.start_date,
          end: item.end_date,
          backgroundColor: "#7c3aed",
          borderColor: "#6d28d9",
          textColor: "#fff",
        }))
      );
    } catch (error) {
      console.error("Error fetching schedule:", error);
    }
  };

  const handleDateClick = (arg) => {
    const resource = resources.find(r => r.id === arg.resource.id);
    if (resource) {
      setSelectedBooking({
        resource_id: arg.resource.id,
        resource_name: resource.title,
        start: arg.dateStr,
      });
      setModalOpen(true);
    }
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      await axios.post("http://localhost:5000/api/schedule-resource", bookingData);
      setModalOpen(false);
      setSelectedBooking(null);
      fetchSchedule();
    } catch (error) {
      console.error("Error booking resource:", error);
      alert("Failed to book resource.");
    }
  };

  return (
    <div style={{ padding: "20px", background: "#111827", borderRadius: "10px" }}>
      <FullCalendar
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        initialView="resourceTimelineWeek"
        resources={resources}
        events={events}
        selectable={true}
        dateClick={handleDateClick}
        headerToolbar={{
          left: "today prev,next",
          center: "title",
          right: "resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth",
        }}
        height="600px"
        slotMinWidth={100}
      />

      {modalOpen && (
        <BookingModal
          show={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleBookingSubmit}
          bookingInfo={selectedBooking}
          projectId={projectId}
        />
      )}
    </div>
  );
}
