import React, { useState, useEffect } from "react";
import { 
  FaNewspaper, 
  FaSignOutAlt, 
  FaBars, 
  FaHome, 
  FaFlagCheckered, 
  FaStar, 
  FaCommentAlt, 
  FaProjectDiagram,
  FaCheck,
  FaFileWord
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css";

const UrgencyNotification = () => {
  const [story, setStory] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/urgency")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const latest = data[data.length - 1]; // latest row
          setStory(latest.narrative || "No narrative provided.");
        } else {
          setStory("No urgency narrative found.");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setStory("Error fetching urgency data.");
      });
  }, []);

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
                      <FaFlagCheckered className="icon" /> {!isCollapsed && <span>My Milestones</span>}
                    </div>
                    <div className="menu-item" onClick={() => navigate("/feedback-employee")}>
                      <FaCommentAlt className="icon" /> {!isCollapsed && <span>My Feedback</span>}
                    </div>
                    <div className="menu-item" onClick={() => navigate("/employee-rating")}>
                      <FaStar className="icon" /> {!isCollapsed && <span>Employee Rating</span>}
                    </div>
      
                    <div className="menu-item" onClick={() => navigate("/employee-urgency")}>
                      <FaCommentAlt className="icon" /> {!isCollapsed && <span>Change Management</span>}
                    </div>
        </div>
      </div>

      {/* Topbar */}
      <div
        className="topbar"
        style={{
          left: isCollapsed ? "80px" : "250px",
          width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)",
        }}
      >
        <div className="topbar-icons">
          <FaNewspaper className="update-icon" title="Updates" />
          <FaStar className="rating-icon" title="Rate Us" />
          <FaSignOutAlt className="logout-icon" title="Logout" onClick={() => navigate("/")} />
        </div>
        <h3 style={{ margin: 0 }}>SwiftCollab</h3>
      </div>

      {/* Main Content */}
      <div
        className="main-content"
        style={{ marginTop: "70px", padding: "2rem" }}
      >
        <div style={{ color:"black" ,maxWidth: "600px", margin: "0 auto", background: "#fff", padding: "1.5rem", borderRadius: "8px", boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
          <h2>📣 Urgency Narrative</h2>
          <p style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>{story}</p>
        </div>
      </div>
    </div>
  );
};

export default UrgencyNotification;