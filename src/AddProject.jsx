import React, { useState, useEffect } from "react";
import {
  FaBars,
  FaHome,
  FaFireAlt,
  FaCommentAlt,
  FaClipboardList,
  FaSignOutAlt,
  FaStar,
  FaNewspaper,
  FaProjectDiagram,
  FaUserCog,
  FaUsers,
  FaChartBar,
  FaTasks,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProjectManagerDashboard.css";
import "./RatingPopup.css";
import "./UpdateFeed.css";

const AddProject = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  const [projects, setProjects] = useState([]);
  const [deadline, setDeadline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Toggle Update Feed popup
  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  // Toggle Rating Popup
  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  // Logout handler: navigate to home page "/"
  const handleLogout = () => {
    navigate("/");
  };

  // Submit rating feedback (for the popup)
  const handleSubmitRating = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRating(0);
  };

  // Fetch existing projects from the backend
  const fetchProjects = async () => {
    try {
      const response = await axios.get("http://localhost:5000/projects");
      if (response.status === 200) {
        setProjects(response.data);
      } else {
        console.error("Failed to fetch projects.");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Optimistic update: Update UI immediately and then call the backend
  const handleAddProject = async () => {
    if (isSubmitting) return;
    if (!projectId.trim() || !projectName.trim() || !projectDescription.trim()) {
      alert("Please enter Project ID, Project Name, and Description.");
      return;
    }
    setIsSubmitting(true);

    // Create a new project object from form values
    const newProject = {
      project_id: projectId,
      project_name: projectName,
      project_description: projectDescription,
      deadline: deadline || null,
    };

    // Immediately update the UI: add the new project and show the success popup
    setProjects((prev) => [...prev, newProject]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Clear form fields immediately
    setProjectId("");
    setProjectName("");
    setProjectDescription("");
    setDeadline("");

    try {
      // Send POST request to add the project
      const response = await axios.post("http://localhost:5000/add-project", {
        project_id: newProject.project_id,
        project_name: newProject.project_name,
        project_description: newProject.project_description,
        deadline: newProject.deadline,
      });
      // If response is not successful, remove the optimistic update
      if (!(response.status === 200 || response.status === 201)) {
        setProjects((prev) =>
          prev.filter((proj) => proj.project_id !== newProject.project_id)
        );
        alert("Failed to add project.");
      }
    } catch (error) {
      console.error("Error adding project:", error);
      // Remove the project from the UI if an error occurs
      setProjects((prev) =>
        prev.filter((proj) => proj.project_id !== newProject.project_id)
      );
      alert("An error occurred while adding the project. Please try again.");
    }
    setIsSubmitting(false);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="dashboard">
      {showSuccess && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "rgba(0, 128, 0, 0.9)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            zIndex: 1000,
          }}
        >
          ✅ Thank you! The project was successfully added. 🎉
        </div>
      )}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          <FaBars />
        </button>
        <div className="sidebar-menu">
          <div
            className="menu-item"
            onClick={() => navigate("/project_manager_dashboard")}
          >
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

        {showUpdateFeed && (
          <div className="update-feed-overlay" onClick={handleToggleUpdateFeed}>
            <div className="update-feed-popup" onClick={(e) => e.stopPropagation()}>
              <div className="popup-content">
                <p>
                  <strong>Hi Swift Collaborator,</strong>
                  <br />
                  <br />
                </p>
                <p>
                  We’re thrilled to have you on board as part of this exciting journey.
                  At SwiftCollab, we believe that great teamwork isn't just about task
                  completion, it's about synergy, shared vision, and supporting each other
                  to achieve the extraordinary. As you embark on managing or collaborating
                  with your team, remember that you're not just working on a project, you're
                  building a culture of productivity, innovation, and mutual growth.
                  <br />
                  <br />
                </p>
                <p>
                  Our platform is designed to bring out the best in every collaborator. From
                  smart task allocation that aligns with individual strengths to real-time
                  knowledge sharing, SwiftCollab ensures everyone stays informed and
                  empowered. You’ll gain clear insights into your team’s progress, see where
                  support is needed, and celebrate every milestone together. We don’t just
                  help you manage tasks, we help you understand your team better, work more
                  efficiently, and build bonds that last. Plus, our unique recognition system
                  ensures that efforts never go unnoticed.
                  <br />
                  <br />
                </p>
                <p>
                  And if you ever feel stuck or unsure about how to make the most of the tools
                  here, don’t worry, we’ve got your back. Our support system is here 24/7 with
                  tutorials, webinars, and expert guidance to help you navigate challenges and
                  unlock opportunities. Whether it’s your first project or your fiftieth, we’ll
                  walk beside you every step of the way.
                  <br />
                  <br />
                </p>
                <p>
                  <strong>Team SwiftCollab</strong>
                </p>
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

        <div className="add-project-form-container">
          <div className="add-project-form">
            <input
              type="text"
              placeholder="Enter Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <input
              type="text"
              placeholder="Enter Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
            <div
              style={{
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                width: "100%",
              }}
            >
              Enter project description extremely specifc include everything you need, if software, how the software should be, if business plan, how it should be.
            </div>
            <textarea
              placeholder="Enter Project Description"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
            />
            <input
              type="date"
              title="Project deadline"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <button onClick={handleAddProject}>Add Project</button>
          </div>

          <div className="project-list-container">
            <h3>Projects List</h3>
            <ul>
              {projects.length > 0 ? (
                projects.map((project) => (
                  <li key={project.project_id}>
                    <strong>ID:</strong> {project.project_id} -{" "}
                    <strong>Name:</strong> {project.project_name}
                  </li>
                ))
              ) : (
                <li style={{ color: "#6200ea" }}>No projects added yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProject;
