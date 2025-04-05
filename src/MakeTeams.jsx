import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaBars, FaHome,FaFireAlt, FaCommentAlt, FaClipboardList,FaSignOutAlt,FaStar,FaNewspaper, FaProjectDiagram, FaUserCog, FaUsers, FaChartBar, FaTasks, FaClock, FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./MakeTeams.css";
import "./ProjectManagerDashboard.css"; // Ensure this includes the base styles for sidebar, topbar, etc.
import "./RatingPopup.css";   
import "./UpdateFeed.css"; 


const MakeTeams = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5000/projects");
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  // OPTIONAL: If you want to fetch some default project details:
  // (Currently fetches /api/project_details/1)
  useEffect(() => {
    fetch("http://localhost:5000/api/project_details/1")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched Data:", data);
        setTasks(data.tasks ?? []);
      })
      .catch((error) => console.error("Error fetching data:", error));
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


  // Handle Project Selection & Trigger Task Generation
  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setIsLoading(true);

    try {
      console.log(`Generating tasks for project ID: ${project.project_id}`);
      const response = await axios.post("http://localhost:5000/generate-tasks", {
        project_id: project.project_id,
      });

      console.log("Task Generation Response:", response.data);
      if (response.data.message === "Tasks already generated") {
        alert("Tasks for this project have already been generated. Loading existing tasks.");
      }
      setTasks(response.data.tasks ?? []);
    } catch (error) {
      console.error("Error generating tasks:", error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Fetching Project Details (Tasks, Subtasks, Milestones)
  const handleFetchProjectDetails = async () => {
    if (!projectId) {
      alert("Please enter a valid Project ID");
      return;
    }

    setFetchingDetails(true);
    setProjectDetails(null);

    try {
      const response = await axios.get(`http://localhost:5000/api/project_details/${projectId}`);
      console.log("Project Details Response:", response.data);
      setProjectDetails(response.data);
    } catch (error) {
      console.error("Error fetching project details:", error);
      setProjectDetails(null);
    } finally {
      setFetchingDetails(false);
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

        <div className="content-container">
          {/* -- Project List -- */}
          {/* -- Project List -- */}
<div className="projects-list-container">
  <h2>Click to Generate Tasks</h2>
  {projects.length === 0 ? (
    <p>No projects available.</p>
  ) : (
    <ul>
      {projects.map((project) => (
        <li
          key={project.project_id}
          className={`project-item-card ${selectedProject && selectedProject.project_id === project.project_id ? "selected" : ""}`}
          onClick={() => handleProjectSelect(project)}
        >
          <strong>{project.project_name}</strong> (ID: {project.project_id})
        </li>
      ))}
    </ul>
  )}
</div>

{/* Loading Indicator for Task Generation */}
{isLoading && <p className="loading-message">Generating tasks...</p>}


          {/* -- Form to Fetch Project Details by ID -- */}
          <div className="fetch-project-form">
            <h2>Fetch Project Details</h2>
            <input
              type="number"
              placeholder="Enter Project ID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
            <button onClick={handleFetchProjectDetails} disabled={fetchingDetails}>
              {fetchingDetails ? "Fetching..." : "Fetch Details"}
            </button>
          </div>

          {/* -- Display Project Details (Tasks, Subtasks, Milestones) -- */}
          {projectDetails && projectDetails.tasks && (
            <div className="project-details">
              <h3>Project Tasks</h3>
              {projectDetails.tasks.length === 0 ? (
                <p>No tasks found.</p>
              ) : (
                <ul>
                  {projectDetails.tasks.map((task) => (
                    <li key={task.id} className="task">
                      <strong>Task: {task.name}</strong>
                      {task.subtasks && task.subtasks.length > 0 ? (
                        <ul className="subtasks">
                          {task.subtasks.map((subtask) => (
                            <li key={subtask.id} className="subtask">
                              ├── <strong>Subtask: {subtask.name}</strong>
                              {subtask.milestones && subtask.milestones.length > 0 ? (
                                <ul className="milestones">
                                  {subtask.milestones.map((milestone) => (
                                    <li key={milestone.id} className="milestone">
                                      ├── 🏆 <strong>Milestone: {milestone.name}</strong> -{" "}
                                      <em>Status: {milestone.status}</em>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No milestones for this subtask.</p>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No subtasks for this task.</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Loading Indicator for Task Generation */}
          {isLoading && <p className="loading-message">Generating tasks...</p>}
        </div>
      </div>
    </div>
  );
};

export default MakeTeams;
