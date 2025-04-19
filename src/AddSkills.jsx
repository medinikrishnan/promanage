import React, { useState } from "react";
import { FaBars, FaHome,FaFireAlt,      // New for Burnt Score
  FaCommentAlt, FaGamepad,
  FaClipboardList,FaSignOutAlt,FaStar,FaNewspaper, FaProjectDiagram, FaUserCog, FaUsers, FaChartBar, FaTasks, FaClock, FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css"; // Ensure this includes the base styles for sidebar, topbar, etc.
import "./RatingPopup.css";   
import "./UpdateFeed.css"; 
import "./AddSkills.css";              // NEW CSS for the form & button styling

const AddSkills = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [skills, setSkills] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  const navigate = useNavigate();

  // Toggle Update Feed popup (if needed)
  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  // Toggle Rating Popup for "Rate Us"
  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  // Logout handler: navigate to home page "/"
  const handleLogout = () => {
    navigate("/");
  };

  // Submit the rating feedback (for the popup)
  const handleSubmitRating = () => {
    // In a real application, here you might send the rating to the backend.
    alert("Feedback sent");
    // Reset rating popup state
    setShowRatingPopup(false);
    setRating(0);
  };


  // Handle the Add Skills button click
  const handleAddSkills = async () => {
    setMessage("");
    setError("");

    if (!employeeEmail.trim() || !skills.trim()) {
      setError("Please provide an employee email and skills.");
      return;
    }

    try {
      // POST to our backend /api/add-skills, sending employee_email and skills
      const res = await fetch("http://localhost:5000/api/add-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_email: employeeEmail.trim(),
          skills: skills.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to add skills");
      }

      const data = await res.json();
      setMessage(data.message || "Skills updated successfully!");
      setEmployeeEmail("");
      setSkills("");
    } catch (err) {
      console.error("Error adding skills:", err);
      setError("Could not update skills. Please try again.");
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
          <div className="menu-item" onClick={() => navigate("/project_manager_dashboard")}>
            <FaHome className="icon" /> {!isCollapsed && <span>Home</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/addprojects")}>
          <FaProjectDiagram className="icon" /> {!isCollapsed && <span>Add Project</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/add-skills")}>
          <FaUserCog className="icon" /> {!isCollapsed && <span>Add Skills</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/teams")}>
          <FaClipboardList className="icon" /> {!isCollapsed && <span>Generate Tasks</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/progress")}>
          <FaChartBar className="icon" /> {!isCollapsed && <span>Progress</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/taskcard")}>
          <FaTasks className="icon" /> {!isCollapsed && <span>Task Card</span>}
          </div>
                        
          <div className="menu-item" onClick={() => navigate("/myteams")}>
          <FaUsers className="icon" /> {!isCollapsed && <span>Make Teams</span>}
          </div>
        <div className="menu-item" onClick={() => navigate("/feedback")}>
        <FaCommentAlt className="icon" /> {!isCollapsed && <span>Feed Back Deck</span>}
        </div>

        <div className="menu-item" onClick={() => navigate("/burnt-score")}>
        <FaFireAlt className="icon" /> {!isCollapsed && <span>Burnt Score</span>}
        </div>
        <div className="menu-item" onClick={() => navigate("/gamify")}>
          <FaGamepad className="icon" />{!isCollapsed && <span>Gamify</span>}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        {/* Topbar with dynamic left margin and width */}
        <div
          className="topbar"
          style={{
            left: isCollapsed ? "80px" : "250px",
            width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)",
          }}
        >
          <h2 className="topbar-title"></h2>
          <div className="topbar-icons">
            <FaNewspaper
              className="update-icon"
              onClick={handleToggleUpdateFeed}
              title="Update Feed"
            />
            <FaStar
              className="rating-icon"
              onClick={handleToggleRatingPopup}
              title="Rate Us"
            />
            <FaSignOutAlt
              className="logout-icon"
              onClick={handleLogout}
              title="Logout"
            />
          </div>
          <h3>SwiftCollab</h3>
        </div>

        {/* Conditionally render the Update Feed popup */}
        {showUpdateFeed && (
          <div className="update-feed-overlay" onClick={handleToggleUpdateFeed}>
          <div className="update-feed-popup" onClick={(e) => e.stopPropagation()}>
            <div className="popup-content">
           <p><strong>Hi Swift Collaborator,</strong><br></br><br></br></p>
         
           <p>
             We’re thrilled to have you on board as part of this exciting journey. At SwiftCollab, we believe that great teamwork isn't just about task completion. it's about synergy, shared vision, and supporting each other to achieve the extraordinary. As you embark on managing or collaborating with your team, remember that you're not just working on a project, you're building a culture of productivity, innovation, and mutual growth. Whether you're leading a team or contributing your skills to one, this is your space to thrive. <br></br><br></br>
           </p>
       
           <p>
             Our platform is designed to bring out the best in every collaborator. From smart task allocation that aligns with individual strengths to real-time knowledge sharing, SwiftCollab ensures everyone stays informed and empowered. You’ll gain clear insights into your team’s progress, see where support is needed, and celebrate every milestone together. We don’t just help you manage tasks, we help you understand your team better, work more efficiently, and build bonds that last. Plus, our unique recognition system ensures that efforts never go unnoticed.<br></br><br></br>
           </p>
         
           <p>
             And if you ever feel stuck or unsure about how to make the most of the tools here, don’t worry, we’ve got your back. Our support system is here 24/7 with tutorials, webinars, and expert guidance to help you navigate challenges and unlock opportunities. Whether it’s your first project or your fiftieth, we’ll walk beside you every step of the way. <br></br><br></br>
           </p>
         
           <p><strong>Team SwiftCollab</strong></p>
         </div>
         </div>
         </div>
        )}

        {/* Conditionally render the Rating Popup */}
        {showRatingPopup && (
          <div className="rating-popup">
            <div className="rating-popup-content">
              <h3>Rate Us</h3>
              <div className="stars-container">
                {[...Array(5)].map((_, idx) => {
                  const starValue = idx + 1;
                  return (
                    <FaStar
                      key={idx}
                      className={`star ${rating >= starValue ? "active" : ""}`}
                      onClick={() => setRating(starValue)}
                    />
                  );
                })}
              </div>
              <button className="send-feedback-btn" onClick={handleSubmitRating}>
                Send Feedback
              </button>
            </div>
          </div>
        )}

        <div className="content-container add-skills-container">
          {error && <p className="error-message">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <form className="add-skills-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Employee Email:</label>
              <input
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="Enter Employee Email"
              />
            </div>

            <div className="form-group">
              <label>Skills (comma separated):</label>
              <input
                type="text"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. React,Node,Python"
              />
            </div>

            <button className="add-skills-btn" onClick={handleAddSkills}>
              Add Skills
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSkills;
