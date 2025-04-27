import React, { useState, useEffect } from "react";
import "./BurntScorePage.css";
import {
  FaBars,
  FaBolt,
  FaCogs,
  FaHome,
  FaClipboardList,
  FaProjectDiagram,
  FaUserCog,
  FaUsers,
  FaChartBar,
  FaTasks,
  FaCommentAlt,
  FaFireAlt,
  FaNewspaper,
  FaStar,
  FaSignOutAlt,
  FaGamepad,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css";
import "./RatingPopup.css";
import "./UpdateFeed.css";

const BurntScorePage = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamScores, setTeamScores] = useState([]);
  const [teamAverage, setTeamAverage] = useState(null);
  const [teamInsight, setTeamInsight] = useState(null); // <-- NEW STATE for insight + recommendation
  const [error, setError] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Could not fetch project list.");
      }
    };
    fetchProjects();
  }, []);

  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  const handleLogout = () => {
    navigate("/");
  };

  const handleSubmitRating = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRating(0);
  };

  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setTeamScores([]);
    setTeamAverage(null);
    setTeamInsight(null); // <-- reset insight too
    setError("");

    try {
      const res = await fetch(`http://localhost:5000/api/project-burnt-scores?projectId=${project.project_id}`);
      if (!res.ok) throw new Error("Failed to fetch burnt scores");
      const data = await res.json();
      setTeamScores(data.teamScores || []);
      setTeamAverage(data.teamAverage || null);
      setTeamInsight(data.teamBurntInsight || null); // <-- store insight + recommendation
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
            <div className="menu-item" onClick={() => navigate("/myteams")}>
              <FaUsers className="icon" /> {!isCollapsed && <span>Make Teams</span>}
            </div>
            <div className="menu-item" onClick={() => navigate("/feedback")}>
              <FaCommentAlt className="icon" /> {!isCollapsed && <span>Feed Back Deck</span>}
            </div>
            <div className="menu-item" onClick={() => navigate("/burnt-score")}>
              <FaFireAlt className="icon" /> {!isCollapsed && <span>Team Health</span>}
            </div>
            <div className="menu-item" onClick={() => navigate("/gamify")}>
              <FaGamepad className="icon" /> {!isCollapsed && <span>Gamify</span>}
            </div>
          <div className="menu-item" onClick={() => navigate("/resource")}>
            <FaCogs className="icon" /> {!isCollapsed && <span>Resource Management</span>} {/* Added Resource Management Button */}
          </div>
          <div className="menu-item" onClick={() =>navigate(`/urgency`)}>
          <FaBolt className="icon" /> {!isCollapsed && <span>Change Managementt</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/guide")}>
          <FaBolt className="icon" /> {!isCollapsed && <span>Coalition</span>}
        </div>
          </div>
        </div>
      </div>

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

        {showUpdateFeed && (
          <div className="update-feed-overlay" onClick={handleToggleUpdateFeed}>
            <div className="update-feed-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-content">
                <p><strong>Hi Swift Collaborator,</strong><br /><br /></p>
                <p>We’re thrilled to have you on board as part of this exciting journey...<br /><br /></p>
                <p>Our platform is designed to bring out the best in every collaborator...<br /><br /></p>
                <p>And if you ever feel stuck or unsure about how to make the most of the tools here, don’t worry, we’ve got your back...<br /><br /></p>
                <p><strong>Team SwiftCollab</strong></p>
              </div>
            </div>
          </div>
        )}

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

          {selectedProject && (
            <div className="burnt-scores-section">
              <h3>Team Health for {selectedProject.project_name}</h3>
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
                      <th>Team Health</th>
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
                  <strong>Team Health Score Average:</strong> {teamAverage.toFixed(2)}
                </p>
              )}

              {/* ✅ NEW Insight + Recommendation Section */}
              {teamInsight && (
                <div className="team-insight">
                  <h4>Team Analysis</h4>
                  <p><strong>Insight:</strong> {teamInsight.insight}</p>
                  <p><strong>Recommendation:</strong> {teamInsight.recommendation}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BurntScorePage;
