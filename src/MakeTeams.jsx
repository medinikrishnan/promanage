import React, { useState, useEffect } from "react";
import axios from "axios";
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
import "./MakeTeams.css";
import "./ProjectManagerDashboard.css"; // Base styles for sidebar, topbar, etc.
import "./RatingPopup.css";
import "./UpdateFeed.css";

const MakeTeams = () => {
  // State variables for projects, tasks, feedback and loading states
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [previewText, setPreviewText] = useState("");
  const [editablePreview, setEditablePreview] = useState(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  const [projectId, setProjectId] = useState("");
  const [projectDetails, setProjectDetails] = useState(null);

  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  // New states for preview history navigation (limited to the last 3 previews)
  const [previewHistory, setPreviewHistory] = useState([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(-1);

  // New state to track if the tasks have been confirmed.
  const [tasksConfirmed, setTasksConfirmed] = useState(false);

  // ---------------------------
  // Helper: Merge saved items from old preview into new preview based on index matching.
  const mergeSavedItems = (oldPreview, newPreview) => {
    if (!oldPreview || !newPreview) return newPreview;
    if (oldPreview.tasks && newPreview.tasks) {
      newPreview.tasks = newPreview.tasks.map((group, gIndex) => {
        if (oldPreview.tasks[gIndex] && oldPreview.tasks[gIndex].saved) {
          return { ...oldPreview.tasks[gIndex] };
        }
        if (group.tasks && oldPreview.tasks[gIndex] && oldPreview.tasks[gIndex].tasks) {
          group.tasks = group.tasks.map((task, tIndex) => {
            if (oldPreview.tasks[gIndex].tasks[tIndex] && oldPreview.tasks[gIndex].tasks[tIndex].saved) {
              return { ...oldPreview.tasks[gIndex].tasks[tIndex] };
            }
            if (
              task.subtasks &&
              oldPreview.tasks[gIndex].tasks[tIndex] &&
              oldPreview.tasks[gIndex].tasks[tIndex].subtasks
            ) {
              task.subtasks = task.subtasks.map((subtask, sIndex) => {
                if (
                  oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex] &&
                  oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex].saved
                ) {
                  return { ...oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex] };
                }
                if (
                  subtask.milestones &&
                  oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex] &&
                  oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex].milestones
                ) {
                  subtask.milestones = subtask.milestones.map((milestone, mIndex) => {
                    if (
                      oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex].milestones[mIndex] &&
                      oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex].milestones[mIndex].saved
                    ) {
                      return { ...oldPreview.tasks[gIndex].tasks[tIndex].subtasks[sIndex].milestones[mIndex] };
                    }
                    return milestone;
                  });
                }
                return subtask;
              });
            }
            return task;
          });
        }
        return group;
      });
    }
    return newPreview;
  };

  // ---------------------------
  // Toggle save functions (only work if tasks are not yet confirmed)
  const toggleSaveGroup = (groupIndex) => {
    if (tasksConfirmed) return;
    const newPreview = { ...editablePreview };
    newPreview.tasks = newPreview.tasks.map((group, i) => {
      if (i === groupIndex) {
        return { ...group, saved: !group.saved };
      }
      return group;
    });
    setEditablePreview(newPreview);
  };

  const toggleSaveTask = (groupIndex, taskIndex) => {
    if (tasksConfirmed) return;
    const newPreview = { ...editablePreview };
    newPreview.tasks[groupIndex].tasks = newPreview.tasks[groupIndex].tasks.map((task, i) => {
      if (i === taskIndex) {
        return { ...task, saved: !task.saved };
      }
      return task;
    });
    setEditablePreview(newPreview);
  };

  const toggleSaveSubtask = (groupIndex, taskIndex, subIndex) => {
    if (tasksConfirmed) return;
    const newPreview = { ...editablePreview };
    newPreview.tasks[groupIndex].tasks[taskIndex].subtasks = newPreview.tasks[groupIndex].tasks[taskIndex].subtasks.map(
      (subtask, i) => {
        if (i === subIndex) {
          return { ...subtask, saved: !subtask.saved };
        }
        return subtask;
      }
    );
    setEditablePreview(newPreview);
  };

  const toggleSaveMilestone = (groupIndex, taskIndex, subIndex, milestoneIndex) => {
    if (tasksConfirmed) return;
    const newPreview = { ...editablePreview };
    newPreview.tasks[groupIndex].tasks[taskIndex].subtasks[subIndex].milestones =
      newPreview.tasks[groupIndex].tasks[taskIndex].subtasks[subIndex].milestones.map((milestone, i) => {
        if (i === milestoneIndex) {
          return { ...milestone, saved: !milestone.saved };
        }
        return milestone;
      });
    setEditablePreview(newPreview);
  };

  // ---------------------------
  // Preview history navigation handlers (limited to last 3 previews)
  const handlePrevPreview = () => {
    if (currentPreviewIndex > 0) {
      const newIndex = currentPreviewIndex - 1;
      setCurrentPreviewIndex(newIndex);
      setEditablePreview(previewHistory[newIndex]);
      setPreviewText(JSON.stringify(previewHistory[newIndex], null, 2));
    }
  };

  const handleNextPreview = () => {
    if (currentPreviewIndex < previewHistory.length - 1) {
      const newIndex = currentPreviewIndex + 1;
      setCurrentPreviewIndex(newIndex);
      setEditablePreview(previewHistory[newIndex]);
      setPreviewText(JSON.stringify(previewHistory[newIndex], null, 2));
    }
  };

  // ---------------------------
  // Fetch projects on mount
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

  // Optional: fetch default project details
  useEffect(() => {
    fetch("http://localhost:5000/api/project_details/1")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched Data:", data);
        setTasks(data.tasks ?? []);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Toggle Update Feed Popup
  const handleToggleUpdateFeed = () => {
    setShowUpdateFeed((prev) => !prev);
  };

  // Toggle Rating Popup
  const handleToggleRatingPopup = () => {
    setShowRatingPopup((prev) => !prev);
  };

  // Logout
  const handleLogout = () => {
    navigate("/");
  };

  // ---------------------------
  // When a project is selected, generate a preview (only if tasks are not confirmed)
  const handleProjectSelect = async (project) => {
    if (tasksConfirmed) {
      alert("Tasks have already been confirmed. Cannot generate a new preview.");
      return;
    }
    setSelectedProject(project);
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/generate-tasks-preview", {
        params: {
          project_id: project.project_id,
          feedback: feedbackText,
        },
        headers: { "Content-Type": "application/json" }
      });
      const preview = response.data;
      setPreviewText(JSON.stringify(preview, null, 2));
      setEditablePreview(preview);
      // Save preview to history (limit to last 3)
      const newHistory = [preview].slice(-3);
      setPreviewHistory(newHistory);
      setCurrentPreviewIndex(newHistory.length - 1);
    } catch (error) {
      console.error("Error generating preview:", error);
      setPreviewText("Error generating preview.");
      setEditablePreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------
  // Regenerate preview with updated feedback (only if tasks not confirmed)
  const handleRegeneratePreview = async () => {
    if (tasksConfirmed) {
      alert("Tasks have already been confirmed. Cannot regenerate preview.");
      return;
    }
    if (!selectedProject) {
      alert("Please select a project first.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/generate-tasks-preview", {
        params: {
          project_id: selectedProject.project_id,
          feedback: feedbackText,
        },
        headers: { "Content-Type": "application/json" }
      });
      let newPreview = response.data;
      if (editablePreview) {
        newPreview = mergeSavedItems(editablePreview, newPreview);
      }
      let newHistory = previewHistory.slice(0, currentPreviewIndex + 1);
      newHistory.push(newPreview);
      newHistory = newHistory.slice(-3);
      setPreviewHistory(newHistory);
      setCurrentPreviewIndex(newHistory.length - 1);
      setEditablePreview(newPreview);
      setPreviewText(JSON.stringify(newPreview, null, 2));
    } catch (error) {
      console.error("Error regenerating preview:", error);
      setPreviewText("Error regenerating preview.");
      setEditablePreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------
  // Confirm tasks: send the updated preview to the backend.
  // After confirmation, hide the preview division and disable further editing.
  const handleConfirmTasks = async () => {
    if (!selectedProject || !editablePreview) {
      alert("No preview data available.");
      return;
    }
    try {
      const response = await axios.post(
        "http://localhost:5000/api/confirm-tasks",
        {
          project_id: selectedProject.project_id,
          tasks: editablePreview,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      console.log("Task Confirmation Response:", response.data);
      alert(response.data.message || "Tasks confirmed successfully!");
      // Mark the tasks as confirmed so further editing or preview generation is disabled.
      setTasksConfirmed(true);
    } catch (error) {
      console.error("Error confirming tasks:", error);
      alert("Error confirming tasks. Please try again.");
    }
  };

  // Fetch project details by ID
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

  // Inline EditableField component for editing text.
  // The edit button is hidden if tasks have been confirmed.
  const EditableField = ({ text, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(text);

    useEffect(() => {
      setValue(text);
    }, [text]);

    const handleSave = () => {
      setIsEditing(false);
      onSave(value);
    };

    return (
      <span>
        {isEditing ? (
          <>
            <input 
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <button onClick={handleSave}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </>
        ) : (
          <>
            <span>{text}</span>{" "}
            {!tasksConfirmed && <button onClick={() => setIsEditing(true)}>Edit</button>}
          </>
        )}
      </span>
    );
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
          <FaGamepad className="icon" />{!isCollapsed && <span>Gamify</span>}
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

      {/* Main Content */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        {/* Topbar */}
        <div
          className="topbar"
          style={{
            left: isCollapsed ? "80px" : "250px",
            width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)"
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
          {/* Projects List Section */}
          <div className="projects-list-container">
            <h2>Click to Generate Tasks Preview</h2>
            {projects.length === 0 ? (
              <p>No projects available.</p>
            ) : (
              <ul>
                {projects.map((project) => (
                  <li
                    key={project.project_id}
                    className={`project-item-card ${
                      selectedProject && selectedProject.project_id === project.project_id ? "selected" : ""
                    }`}
                    onClick={() => handleProjectSelect(project)}
                  >
                    <strong>{project.project_name}</strong> (ID: {project.project_id})
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Preview & Chat Section: Hide if tasks have been confirmed */}
          {!tasksConfirmed && selectedProject && (
            <div className="preview-chat-section">
              <h2>Tasks Preview for Project: {selectedProject.project_name}</h2>
              {isLoading && <p className="loading-message">Generating preview...</p>}

              <div className="feedback-input">
                <label htmlFor="feedback">
                  Enter feedback to refine tasks (optional):
                </label>
                <br /><br />
                <textarea
                  id="feedback"
                  placeholder="Your feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                />
                <br /><br />
                <div className="preview-controls">
  <button className="btn-purple" onClick={handleRegeneratePreview}>
    Regenerate Preview
  </button>
</div>
              </div>

{/* History Navigation */}
<div className="history-nav">
  <button
    className="btn-purple"
    onClick={handlePrevPreview}
    disabled={currentPreviewIndex <= 0}
  >
    Previous Preview
  </button>
  <span className="preview-info">
    {previewHistory.length > 0
      ? `Preview ${currentPreviewIndex + 1} of ${previewHistory.length}`
      : ""}
  </span>
  <button
    className="btn-purple"
    onClick={handleNextPreview}
    disabled={currentPreviewIndex >= previewHistory.length - 1}
  >
    Next Preview
  </button>
</div>

              {/* Structured Display of Preview Data with Save & Edit Options */}
              <div
                className="structured-preview"
                style={{
                  marginTop: "1rem",
                  backgroundColor: "#f7f7f7",
                  padding: "1rem",
                  borderRadius: "4px"
                }}
              >
                <h4 style={{color:"black"}}>Structured Tasks Preview</h4>
                {editablePreview &&
                editablePreview.tasks &&
                editablePreview.tasks.length > 0 ? (
                  editablePreview.tasks.map((group, groupIndex) => (
                    <div key={groupIndex} className="category-group" style={{ marginBottom: "1rem" , color:"black"}}>
                      <h5 style={{ marginBottom: "0.5rem" }}>
                        Category:{" "}
                        <EditableField
                          text={group.category}
                          onSave={(newText) => {
                            const newEditablePreview = { ...editablePreview };
                            newEditablePreview.tasks[groupIndex].category = newText;
                            setEditablePreview(newEditablePreview);
                          }}
                        />{" "}
                        <button onClick={() => toggleSaveGroup(groupIndex)}>
                          {group.saved ? "Unsave" : "Save"}
                        </button>
                      </h5>
                      {group.tasks && group.tasks.length > 0 ? (
                        group.tasks.map((task, taskIndex) => (
                          <div key={taskIndex} className="task" style={{ marginBottom: "1rem", paddingLeft: "1rem" }}>
                            <h6 style={{ marginBottom: "0.5rem" }}>
                              Task:{" "}
                              <EditableField
                                text={task.task}
                                onSave={(newText) => {
                                  const newEditablePreview = { ...editablePreview };
                                  newEditablePreview.tasks[groupIndex].tasks[taskIndex].task = newText;
                                  setEditablePreview(newEditablePreview);
                                }}
                              />{" "}
                              <button onClick={() => toggleSaveTask(groupIndex, taskIndex)}>
                                {task.saved ? "Unsave" : "Save"}
                              </button>
                            </h6>
                            {task.subtasks && task.subtasks.length > 0 ? (
                              <ul className="subtasks" style={{ listStyleType: "none", paddingLeft: "1rem" }}>
                                {task.subtasks.map((subtask, subIndex) => (
                                  <li key={subIndex} className="subtask" style={{ marginBottom: "0.5rem" }}>
                                    <p style={{ margin: "0.25rem 0" }}>
                                      Subtask:{" "}
                                      <EditableField
                                        text={subtask.name}
                                        onSave={(newText) => {
                                          const newEditablePreview = { ...editablePreview };
                                          newEditablePreview.tasks[groupIndex].tasks[taskIndex].subtasks[subIndex].name = newText;
                                          setEditablePreview(newEditablePreview);
                                        }}
                                      />{" "}
                                      <button onClick={() => toggleSaveSubtask(groupIndex, taskIndex, subIndex)}>
                                        {subtask.saved ? "Unsave" : "Save"}
                                      </button>
                                    </p>
                                    {subtask.milestones && subtask.milestones.length > 0 ? (
                                      <ul className="milestones" style={{ listStyleType: "none", paddingLeft: "1rem" }}>
                                        {subtask.milestones.map((milestone, mIndex) => (
                                          <li key={mIndex} className="milestone" style={{ margin: "0.25rem 0" }}>
                                            <p style={{ margin: 0 }}>
                                              Milestone:{" "}
                                              <EditableField
                                                text={milestone.name}
                                                onSave={(newText) => {
                                                  const newEditablePreview = { ...editablePreview };
                                                  newEditablePreview.tasks[groupIndex].tasks[taskIndex].subtasks[subIndex].milestones[mIndex].name = newText;
                                                  setEditablePreview(newEditablePreview);
                                                }}
                                              />{" "}
                                              <button onClick={() => toggleSaveMilestone(groupIndex, taskIndex, subIndex, mIndex)}>
                                                {milestone.saved ? "Unsave" : "Save"}
                                              </button>
                                            </p>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p style={{ margin: "0.25rem 0", color: "#888" }}>
                                        No milestones for this subtask.
                                      </p>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ color: "#888", paddingLeft: "1rem" }}>No subtasks for this task.</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p style={{ color: "#888", paddingLeft: "1rem" }}>No tasks for this category.</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No tasks preview available.</p>
                )}
              </div>

              <button onClick={handleConfirmTasks} className="confirm-btn">
                Confirm Tasks
              </button>
            </div>
          )}

          {/* Optionally show a confirmation message if tasks are confirmed */}
          {tasksConfirmed && (
            <div className="confirmation-message">
              <h2>Tasks have been confirmed.</h2>
              <p>You can no longer edit or regenerate tasks for this project.</p>
            </div>
          )}

          {/* Form to Fetch Project Details by ID */}
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

          {/* Display Project Details (Tasks, Subtasks, Milestones) */}
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

          {isLoading && <p className="loading-message">Generating tasks...</p>}
        </div>
      </div>
    </div>
  );
};

export default MakeTeams;
