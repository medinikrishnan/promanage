// src/ScheduleCalendar.jsx
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const ScheduleCalender = ({ projectId }) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axios.get(`/projects/${projectId}/schedule`);
        const calendarEvents = res.data.map(s => ({
          title: s.resource_name,
          start: s.start_date,
          end: s.end_date
        }));
        setEvents(calendarEvents);
      } catch (err) {
        console.error("Error fetching resource schedule:", err);
      }
    };

    if (projectId) fetchSchedule();
  }, [projectId]);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Resource Schedule</h3>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'timeGridWeek,timeGridDay'
        }}
        events={events}
        height={500}
      />
    </div>
  );
};

export default ScheduleCalender;
