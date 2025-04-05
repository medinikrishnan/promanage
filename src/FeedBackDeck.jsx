import React, { useState, useEffect } from "react";
import { FaBars, FaHome,FaFireAlt,FaCommentAlt, FaClipboardList,FaSignOutAlt,FaStar,FaNewspaper, FaProjectDiagram, FaUserCog, FaUsers, FaChartBar, FaTasks, FaClock, FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./FeedbackDeck.css"; // Ensure you add the slider styles below
import "./ProjectManagerDashboard.css"; // Ensure this includes the base styles for sidebar, topbar, etc.
import "./RatingPopup.css";   
import "./UpdateFeed.css"; 

const FeedbackDeck = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // States for projects, selected project, team members, selected employees, feedback message, and sliderValue (0..4).
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [ratings, setRatings] = useState(0);

  // We'll map the sliderValue (0..4) to the actual rating values [1,3,5,8,10].
  const ratingValues = [1, 3, 5, 8, 10];
  // We'll also map them to textual labels (optional).
  const ratingLabels = ["Very Negative", "Negative", "Neutral", "Positive", "Very Positive"];

  const [sliderValue, setSliderValue] = useState(2); // Default: index 2 => rating=5 => "Neutral"
  
  // Derive the actual rating and label from sliderValue
  const rating = ratingValues[sliderValue];
  const ratingLabel = ratingLabels[sliderValue];

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
      setRatings(0);
    };
  

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // When a project is selected, fetch its team members
  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setSelectedEmployees([]);
    setFeedback("");
    setSliderValue(2); // Reset slider to "Neutral"
    try {
      const res = await fetch(`http://localhost:5000/api/project-employees/${project.project_id}`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      setTeamMembers(data.employees || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  // Toggle selection of an employee
  const toggleEmployeeSelection = (employee) => {
    setSelectedEmployees((prev) => {
      if (prev.find((emp) => emp.employee_id === employee.employee_id)) {
        return prev.filter((emp) => emp.employee_id !== employee.employee_id);
      } else {
        return [...prev, employee];
      }
    });
  };

  // Handle sending feedback
  const handleSendFeedback = async () => {
    if (!selectedProject) {
      alert("Please select a project.");
      return;
    }
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee to send feedback.");
      return;
    }
    if (!feedback.trim()) {
      alert("Please write your feedback.");
      return;
    }

    // rating is derived from sliderValue
    const payload = {
      project_id: selectedProject.project_id,
      employee_ids: selectedEmployees.map((emp) => emp.employee_id),
      feedback: feedback.trim(),
      score: rating, // The chosen rating (1,3,5,8, or 10)
    };

    try {
      const res = await fetch("http://localhost:5000/api/send-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send feedback");
      const data = await res.json();
      alert(data.message || "Feedback sent successfully!");

      // Clear selections and feedback
      setSelectedEmployees([]);
      setFeedback("");
      setSliderValue(2); // Reset to "Neutral"
    } catch (error) {
      console.error("Error sending feedback:", error);
      alert("Error sending feedback. Please try again.");
    }
  };

  return (
    <div className="feedback-deck">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          <FaBars />
        </button>
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
        </div>
      </div>
      </div>

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
                            onClick={() => setRatings(starValue)}
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
        <div className="content-container">
          {/* Left Panel: Projects and Team Members */}
          <div className="left-panel">
            <div className="projects-section">
              <h3>Projects</h3>
              {projects.length === 0 ? (
                <p>No projects available.</p>
              ) : (
                <ul className="project-list">
                  {projects.map((proj) => (
                    <li
                      key={proj.project_id}
                      className={`project-item ${selectedProject && selectedProject.project_id === proj.project_id ? "active" : ""}`}
                      onClick={() => handleProjectSelect(proj)}
                    >
                      {proj.project_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {selectedProject && (
              <div className="team-section">
                <h3>Team Members for {selectedProject.project_name}</h3>
                {teamMembers.length === 0 ? (
                  <p>No team members found.</p>
                ) : (
                  <ul className="team-list">
                    {teamMembers.map((emp) => (
                      <li
                        key={emp.employee_id}
                        className={`team-item ${selectedEmployees.find((e) => e.employee_id === emp.employee_id) ? "selected" : ""}`}
                        onClick={() => toggleEmployeeSelection(emp)}
                      >
                        {emp.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Right Panel: Feedback Input and Rating Slider */}
          <div className="right-panel">
            <h3>Send Feedback</h3>
            {selectedProject ? (
              <>
                <textarea
                  className="feedback-textarea"
                  placeholder="Write your feedback here..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                
                <div className="slider-container">
                  <p className="slider-label">Select Rating: <strong>{ratingLabel}</strong></p>
                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    value={sliderValue}
                    onChange={(e) => setSliderValue(parseInt(e.target.value, 10))}
                    className="rating-slider"
                  />
                </div>

                <button className="send-feedback-btn" onClick={handleSendFeedback}>
                  <FaCommentAlt className="icon" /> Send Feedback
                </button>
              </>
            ) : (
              <p>Please select a project to write feedback.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDeck;
