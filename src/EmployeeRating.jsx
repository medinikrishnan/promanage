import React, { useState, useEffect } from "react";
import { FaProjectDiagram, FaNewspaper, FaSignOutAlt, FaBars, FaHome, FaFlagCheckered, FaStar, FaCommentAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "./EmployeeRating.css";

const EmployeeRating = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Use state to store email and employee_id
  const [email, setEmail] = useState("");
  const [employee_id, setEmployeeId] = useState(null);

  // Retrieve email from localStorage (fallback to location.state)
  useEffect(() => {
    const storedEmail = localStorage.getItem("employee_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
    // Also, if employee_id is passed in location state, set it
    if (location.state && location.state.employee_id) {
      setEmployeeId(location.state.employee_id);
    }
  }, [location.state]);

  // Sidebar toggle state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State for projects, selected project, teammates (team members), selected teammate, and slider.
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teammates, setTeammates] = useState([]);
  const [selectedTeammate, setSelectedTeammate] = useState(null);
  const [sliderValue, setSliderValue] = useState(2); // default index 2 ("Good")

  // Map slider indices to rating values and labels.
  const ratingValues = [1, 3, 5, 8, 10];
  const ratingLabels = ["Very Sad", "Sad", "Good", "Happy", "Very Happy"];
  const rating = ratingValues[sliderValue];
  const ratingLabel = ratingLabels[sliderValue];

  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [ratings, setRatings] = useState(0);

  // Toggle Update Feed popup.
  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  // Toggle Rating Popup.
  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  // Logout handler.
  const handleLogout = () => {
    navigate("/");
  };

  // Submit the rating feedback (for the popup)
  const handleSubmitRatings = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRatings(0);
  };

  // Fetch projects assigned to the logged-in employee using the email.
  useEffect(() => {
    if (!email) return;
    const fetchAssignedProjects = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/employee-assigned-projects?email=${encodeURIComponent(email)}`
        );
        if (!res.ok) throw new Error("Failed to fetch assigned projects");
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (error) {
        console.error("Error fetching assigned projects:", error);
      }
    };
    fetchAssignedProjects();
  }, [email]);

  // When a project is selected, fetch team members.
  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setSelectedTeammate(null);
    try {
      const res = await fetch(
        `http://localhost:5000/api/project-assignment/${project.project_id}`
      );
      if (!res.ok) throw new Error("Failed to fetch team members");
      const data = await res.json();
      // Filter out the logged-in employee (rater) so they don't appear.
      const filteredTeam = (data.employees || []).filter(
        (emp) => emp.employee_id !== employee_id
      );
      setTeammates(filteredTeam);
    } catch (error) {
      console.error("Error fetching team members:", error);
    }
  };

  // When a teammate is selected.
  const handleTeammateSelect = (teammate) => {
    setSelectedTeammate(teammate);
  };

  // Submit the rating.
  const handleSubmitRating = async () => {
    if (!selectedProject || !selectedTeammate) {
      alert("Please select a project and a teammate to rate.");
      return;
    }
    const payload = {
      rater_employee_email: email,
      rated_employee_email: selectedTeammate.email,
      project_id: selectedProject.project_id,
      rating, // Numeric rating value
    };
    console.log("Payload:", payload);
    try {
      const res = await fetch("http://localhost:5000/api/teammate-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit rating");
      const result = await res.json();
      alert(result.message || "Rating submitted successfully!");
      // Reset teammate selection and slider.
      setSelectedTeammate(null);
      setSliderValue(2);
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Error submitting rating. Please try again.");
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
            <FaFlagCheckered className="icon" /> {!isCollapsed && <span>My Milestones</span>}
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
        {/* Topbar */}
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

        {/* Update Feed Popup */}
        {showUpdateFeed && (
          <div className="update-feed-overlay" onClick={handleToggleUpdateFeed}>
            <div className="update-feed-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-content">
                <p><strong>Hi Swift Collaborator,</strong></p>
                <p>
                  We’re thrilled to have you on board as part of this exciting journey.
                  At SwiftCollab, we believe that great teamwork isn't just about task completion—it’s about synergy, shared vision, and mutual growth.
                </p>
                <p>
                  Our platform is designed to bring out the best in every collaborator.
                  Enjoy clear insights into your team’s progress, optimal task allocations, and unique recognition for every contribution.
                </p>
                <p>
                  Have questions? We’re here 24/7 for tutorials, webinars, and expert guidance.
                </p>
                <p><strong>Team SwiftCollab</strong></p>
              </div>
            </div>
          </div>
        )}

        {/* Rating Popup */}
        {showRatingPopup && (
          <div className="rating-popup" onClick={handleToggleRatingPopup}>
            <div className="rating-popup-content" onClick={(e) => e.stopPropagation()}>
              <h3>Rate Us</h3>
              <div className="stars-container">
                {[...Array(5)].map((_, idx) => {
                  const starValue = idx + 1;
                  return (
                    <FaStar
                      key={idx}
                      className={`star ${ratings >= starValue ? "active" : ""}`}
                      onClick={() => setRatings(starValue)}
                    />
                  );
                })}
              </div>
              <button className="send-feedback-btn" onClick={handleSubmitRatings}>
                Send Feedback
              </button>
            </div>
          </div>
        )}

        <div className="content-container">
          {/* Left Panel: Projects and Team Members */}
          <div className="left-panel">
            <h3>Your Assigned Projects</h3>
            {projects.length === 0 ? (
              <p>No projects assigned to you.</p>
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
            {selectedProject && (
              <div className="team-section">
                <h3>Team Members in {selectedProject.project_name}</h3>
                {teammates.length === 0 ? (
                  <p>No team members found.</p>
                ) : (
                  <ul className="team-list">
                    {teammates.map((tm) => (
                      <li
                        key={tm.employee_id}
                        className={`team-item ${selectedTeammate && selectedTeammate.employee_id === tm.employee_id ? "selected" : ""}`}
                        onClick={() => handleTeammateSelect(tm)}
                      >
                        {tm.email}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
          {/* Right Panel: Rating Slider and Preview */}
          <div className="right-panel">
            <h3>Rate a Teammate</h3>
            {selectedProject && selectedTeammate ? (
              <>
                <p>
                  Rate <strong>{selectedTeammate.email}</strong> on project <strong>{selectedProject.project_name}</strong>
                </p>
                <div className="rating-preview">
                  <h4>Rating Preview</h4>
                  <p>
                    <strong>Project:</strong> {selectedProject.project_name}
                  </p>
                  <p>
                    <strong>Teammate:</strong> {selectedTeammate.email}
                  </p>
                  <p>
                    <strong>Rating:</strong> {ratingLabel} ({rating})
                  </p>
                </div>
                <div className="slider-container">
                  <p className="slider-label">
                    Select Rating: <strong>{ratingLabel}</strong>
                  </p>
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
                <button className="submit-rating-btn" onClick={handleSubmitRating}>
                  Submit Rating
                </button>
              </>
            ) : (
              <p>Please select a project and a teammate to rate.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRating;
