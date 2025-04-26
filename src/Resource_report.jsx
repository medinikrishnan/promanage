// src/ResourceReport.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

const ResourceReport = ({ projectId }) => {
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    if (!projectId) return;

    const fetchReport = async () => {
      try {
        // 1) physical resources
        const physRes = await axios.get(
          `/projects/${projectId}/resource-report`
        );
        console.log('physical resources:', physRes.data);

        // 2) people assigned
        // NOTE: just "/project-employees" because our baseURL is already "/api"
        const pplRes = await axios.get(
          `/project-employees/${projectId}`
        );
        console.log('people assigned:', pplRes.data.employees);

        const physical = Array.isArray(physRes.data) ? physRes.data : [];
        const people = (pplRes.data.employees || []).map(emp => ({
          resource_name: emp.email,
          scheduled_days: 0,
          actual_days:    0,
          unscheduled_days: 0,
          leave_days:    0,
          utilization:   100
        }));

        setReportData([ ...physical, ...people ]);
      } catch (err) {
        console.error('Failed to fetch report or people:', err);
        // if physical succeeded but people failed, at least show physical
        try {
          const physOnly = (await axios.get(
            `/projects/${projectId}/resource-report`
          )).data;
          setReportData(physOnly);
        } catch {
          setReportData([]);
        }
      }
    };

    fetchReport();
  }, [projectId]);

  if (!reportData.length) {
    return <p style={{ textAlign: 'center', marginTop: 20 }}>No data to display.</p>;
  }

  return (
    <div style={{ marginTop: 30 }}>
      <h3>Resource & Team Report</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={reportData}
          margin={{ top: 20, right: 40, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="resource_name" />
          <YAxis 
            yAxisId="days" 
            label={{ value: 'Days', angle: -90, position: 'insideLeft' }} 
          />
          <YAxis 
            yAxisId="percent" 
            orientation="right"
            label={{ value: 'Utilization %', angle: 90, position: 'insideRight' }}
          />
          <Tooltip />
          <Legend verticalAlign="top" />

          <Bar yAxisId="days" dataKey="scheduled_days"   name="Scheduled Days"   stackId="a" />
          <Bar yAxisId="days" dataKey="actual_days"      name="Actual Days"      stackId="a" />
          <Bar yAxisId="days" dataKey="unscheduled_days" name="Unscheduled Days" stackId="a" />
          <Bar yAxisId="days" dataKey="leave_days"       name="Leave Days"       stackId="a" />

          <Line
            yAxisId="percent"
            type="monotone"
            dataKey="utilization"
            name="Utilization (%)"
            strokeWidth={2}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResourceReport;
