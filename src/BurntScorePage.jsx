import React, { useState, useEffect } from "react";
import "./BurntScorePage.css";
import { FaBars, FaGamepad, FaHome,FaFireAlt,FaCommentAlt, FaClipboardList,FaSignOutAlt,FaStar,FaNewspaper, FaProjectDiagram, FaUserCog, FaUsers, FaChartBar, FaTasks, FaClock, FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css"; // Ensure this includes the base styles for sidebar, topbar, etc.
import "./RatingPopup.css";   
import "./UpdateFeed.css"; 

const BurntScorePage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamScores, setTeamScores] = useState([]); // Individual scores per team member
  const [teamAverage, setTeamAverage] = useState(null);
  const [error, setError] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  const navigate = useNavigate();

  // Fetch the list of projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data); // Suppose the data is an array like [ {project_id, project_name}, ...]
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Could not fetch project list.");
      }
    };
    fetchProjects();
  }, []);

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


  // When a project is selected, fetch team burnt scores
  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setTeamScores([]);
    setTeamAverage(null);
    setError("");

    try {
      const res = await fetch(`http://localhost:5000/api/project-burnt-scores?projectId=${project.project_id}`);
      if (!res.ok) throw new Error("Failed to fetch burnt scores");
      const data = await res.json();
      setTeamScores(data.teamScores || []);
      setTeamAverage(data.teamAverage || null);
    } catch (err) {
      console.error("Error fetching burnt scores:", err);
      setError("Could not fetch burnt scores for this project.");
    }
  };

  return (
    <div className="dashboard">
        <div className="sidebar-menu">
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
      </div>

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

        <div className="burnt-score-page">
          {error && <p className="error-message">{error}</p>}

          {/* Project List */}
          <div className="projects-section">
            <h3>Select a Project</h3>
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

          {/* Team Burnt Scores */}
          {selectedProject && (
            <div className="burnt-scores-section">
              <h3>Burnt Scores for {selectedProject.project_name}</h3>
              {teamScores.length === 0 ? (
                <p>No team members or no data found for this project.</p>
              ) : (
                <table className="burnt-score-table">
                  <thead>
                    <tr>
                      <th>Employee Email</th>
                      <th>Comprehend</th>
                      <th>Acquire</th>
                      <th>Bond</th>
                      <th>Defend</th>
                      <th>Burnt Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamScores.map((member) => (
                      <tr key={member.employee_email}>
                        <td>{member.employee_email}</td>
                        <td>{member.comprehend}</td>
                        <td>{member.acquire}</td>
                        <td>{member.bond}</td>
                        <td>{member.defend}</td>
                        <td>{member.burntScore.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {teamAverage !== null && (
                <p className="team-average">
                  <strong>Team Burnt Score Average:</strong> {teamAverage.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BurntScorePage;
