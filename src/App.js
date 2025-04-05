import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login.jsx";
import Signup from "./Signup.jsx";
import SkillsPage from "./SkillsPage.jsx";
import ProjectManagerDashboard from "./ProjectManagerDashboard.jsx";
import AddProject from "./AddProject.jsx";
import MakeTeams from "./MakeTeams.jsx";
import EmployeeAssignment from "./EmployeeAssignment.jsx";
import EmployeeDashboard from "./Employee_dashboard.jsx";
import MyTasks from "./MyTasks.jsx";
import Milestones from "./Milestones.jsx";
import Progress from "./Progress.jsx";
import FeedbackDeck from "./FeedBackDeck.jsx";
import MyFeedback from "./MyFeedback.jsx";
import EmployeeRating from "./EmployeeRating.jsx";
import BurntScorePage from "./BurntScorePage.jsx";
import AddSkills from "./AddSkills.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/project_manager_dashboard" element={<ProjectManagerDashboard />} />
        <Route path="/addprojects" element={<AddProject />} />
        <Route path="/teams" element={<MakeTeams />} />
        <Route path="/myteams" element={<EmployeeAssignment />} />
        <Route path="/employee_dashboard" element={<EmployeeDashboard />} />
        <Route path="/mytasks" element={<MyTasks />} />
        <Route path="/home-employee" element={<EmployeeDashboard />} />
        
        {/* ✅ Allow Milestones.jsx to receive data via state */}
        <Route path="/milestones" element={<Milestones />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/feedback" element={<FeedbackDeck />} />
        <Route path="/feedback-employee" element={<MyFeedback />} />
        <Route path="/employee-rating" element={<EmployeeRating />} />
        <Route path="/burnt-score" element={<BurntScorePage />} />
        <Route path="/add-skills" element={<AddSkills />} />
      </Routes>
    </Router>
  );
}

export default App;
