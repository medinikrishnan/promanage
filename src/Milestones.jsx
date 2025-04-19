import React, { useState, useEffect } from "react";
import { 
  FaUserCog, 
  FaProjectDiagram, 
  FaNewspaper, 
  FaSignOutAlt, 
  FaBars, 
  FaHome, 
  FaFlagCheckered, 
  FaStar, 
  FaCommentAlt 
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "./Employee_dashboard.css"; // Make sure your CSS styles the sidebar, topbar, etc.
// import "./Milestones.css";
const Milestones = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from localStorage or location state
  const [email, setEmail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("employee_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Retrieve employee_id from location state (if available) or later via API
  const [employeeId, setEmployeeId] = useState(
    (location.state && location.state.employee_id) || null
  );
  useEffect(() => {
    const fetchEmployeeId = async () => {
      try {
        if (email && !employeeId) {
          const empRes = await fetch(
            `http://localhost:5000/api/get-employee-id?email=${encodeURIComponent(email)}`
          );
          if (!empRes.ok) {
            const errorData = await empRes.json();
            throw new Error(errorData.error || "Failed to fetch employee ID");
          }
          const empData = await empRes.json();
          setEmployeeId(empData.employee_id);
          console.log(`✅ Employee ID fetched: ${empData.employee_id}`);
        }
      } catch (error) {
        console.error("Error fetching employee ID:", error);
      }
    };
    fetchEmployeeId();
  }, [email, employeeId]);

  // State for milestones
  const [milestones, setMilestones] = useState([]);

  // Fetch milestones assigned to this employee from the backend API endpoint
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!employeeId) return;
      try {
        const res = await fetch(
          `http://localhost:5000/api/employee-milestones?employee_id=${encodeURIComponent(employeeId)}`
        );
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch milestones");
        }
        const data = await res.json();
        console.log("✅ Fetched milestones:", data.milestones);
        setMilestones(data.milestones);
      } catch (error) {
        console.error("Error fetching milestones:", error);
      }
    };
    fetchMilestones();
  }, [employeeId]);

  // Sidebar collapse and popup state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  // Popup & logout handlers
  const handleToggleUpdateFeed = () => setShowUpdateFeed((prev) => !prev);
  const handleToggleRatingPopup = () => setShowRatingPopup((prev) => !prev);
  const handleLogout = () => navigate("/");
  const handleSubmitRating = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRating(0);
  };

  // Mark a milestone as completed
  const completeMilestone = async (milestoneId) => {
    if (!employeeId) return;
    try {
      const logResponse = await fetch("http://localhost:5000/api/log-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          milestone_id: milestoneId,
          message: `Completed milestone`
        }),
      });
      if (!logResponse.ok) {
        const errorData = await logResponse.json();
        throw new Error(errorData.error || "Failed to log milestone completion");
      }
      const result = await logResponse.json();
      console.log("API log-milestone response:", result);
      // Remove the completed milestone from the local state so that it is no longer displayed.
      setMilestones(prev => prev.filter(m => m.milestone_id !== milestoneId));
    } catch (error) {
      console.error("Error marking milestone as completed:", error.message);
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          <FaBars />
        </button>
        <div className="sidebar-menu">
          <div className="menu-item" onClick={() => navigate("/home-employee")}>
            <FaHome className="icon" /> {!isCollapsed && <span>Home</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/mytasks")}>
            <FaProjectDiagram className="icon" /> {!isCollapsed && <span>My Projects</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/milestones")}>
            <FaUserCog className="icon" /> {!isCollapsed && <span>My Milestones</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/feedback-employee")}>
            <FaCommentAlt className="icon" /> {!isCollapsed && <span>My Feedback</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/employee-rating")}>
            <FaStar className="icon" /> {!isCollapsed && <span>Employee Rating</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        <div
          className="topbar"
          style={{
            left: isCollapsed ? "80px" : "250px",
            width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)",
          }}
        >
          <h2 className="topbar-title"></h2>
          <div className="topbar-icons">
            <FaNewspaper className="update-icon" onClick={handleToggleUpdateFeed} title="Update Feed" />
            <FaStar className="rating-icon" onClick={handleToggleRatingPopup} title="Rate Us" />
            <FaSignOutAlt className="logout-icon" onClick={handleLogout} title="Logout" />
          </div>
          <h3>SwiftCollab</h3>
        </div>

        <div className="content-container">
          <h2>Your Milestones</h2>
          {milestones.length > 0 ? (
            <ul>
              {milestones.map((milestone) => (
                <li key={milestone.milestone_id}>
                  {milestone.milestone_name}{" "}
                  <button className="complete-btn" onClick={() => completeMilestone(milestone.milestone_id)}>
                    Complete
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No milestones found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Milestones;
