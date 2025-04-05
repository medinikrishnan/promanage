import { createContext, useContext, useState } from "react";

// Create Context
const MilestoneContext = createContext();

// Provider Component
export const MilestoneProvider = ({ children }) => {
  const [milestones, setMilestones] = useState([]);

  return (
    <MilestoneContext.Provider value={{ milestones, setMilestones }}>
      {children}
    </MilestoneContext.Provider>
  );
};

// Custom Hook
export const useMilestone = () => useContext(MilestoneContext);
