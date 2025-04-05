import React, { useState, useEffect } from "react";
import { FaBars, FaHome,FaFireAlt,FaCommentAlt, FaClipboardList,FaSignOutAlt,FaStar,FaNewspaper, FaProjectDiagram, FaUserCog, FaUsers, FaChartBar, FaTasks, FaClock, FaLink } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Progress.css";
import "./ProjectManagerDashboard.css"; // Ensure this includes the base styles for sidebar, topbar, etc.
import "./RatingPopup.css";   
import "./UpdateFeed.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Progress = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // States for Projects, Selected Project, Employees, Selected Employee, Employee Tasks, and Progress Data
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  // 1️⃣ Fetch All Projects on Mount
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


  // 2️⃣ When a project is selected, fetch the employees assigned and progress data for that project
  const handleProjectSelect = async (project) => {
    setSelectedProject(project);
    setSelectedEmployee(null);
    setEmployeeTasks([]);
    setProgressData(null);

    try {
      // Fetch employees assigned to the project
      const res = await fetch(`http://localhost:5000/api/project-employees/${project.project_id}`);
      if (!res.ok) throw new Error("Failed to fetch employees for project");
      const data = await res.json();
      setEmployees(data.employees ?? []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }

    try {
      // Fetch progress data for the project
      const progressRes = await fetch(`http://localhost:5000/api/project-progress/${project.project_id}`);
      if (!progressRes.ok) throw new Error("Failed to fetch project progress data");
      const progressJson = await progressRes.json();
      setProgressData(progressJson);
    } catch (error) {
      console.error("Error fetching project progress:", error);
    }
  };

  // 3️⃣ When an employee is selected, fetch that employee’s tasks, subtasks, milestones
  const handleEmployeeSelect = async (employee) => {
    setSelectedEmployee(employee);
    setEmployeeTasks([]); // Clear tasks from previous selection

    try {
      const res = await fetch(`http://localhost:5000/api/employee-data?email=${employee.email}`);
      if (!res.ok) throw new Error("Failed to fetch employee data");
      const data = await res.json();
      setEmployeeTasks(data.projects ?? []);
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
    }
  };

  // Prepare chart data when progressData is available.
  const chartData = progressData
    ? {
        labels: [
          "Employees Working",
          "Employees Assigned",
          "Free Employees",
          "Total Tasks",
          "Available Subtasks",
          "Completed Subtasks",
          "Remaining Subtasks",
        ],
        datasets: [
          {
            label: "Count",
            data: [
              progressData.employeesWorking,
              progressData.employeesAssigned,
              progressData.freeEmployees,
              progressData.tasksCount,
              progressData.availableSubtasks,
              progressData.completedSubtasks,
              progressData.remainingSubtasks,
            ],
            backgroundColor: [
              "rgba(75, 192, 192, 0.6)",
              "rgba(54, 162, 235, 0.6)",
              "rgba(255, 206, 86, 0.6)",
              "rgba(153, 102, 255, 0.6)",
              "rgba(255, 159, 64, 0.6)",
              "rgba(255, 99, 132, 0.6)",
              "rgba(201, 203, 207, 0.6)",
            ],
            borderColor: "rgba(0, 0, 0, 0.1)",
            borderWidth: 1,
          },
        ],
      }
    : null;

  // 4️⃣ Updated chart options with bigger fonts and maintainAspectRatio = false
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // <-- This removes the default 16:9 aspect ratio
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#fff",       // Legend text color
          font: {
            size: 16,          // Legend font size
          },
        },
      },
      title: {
        display: true,
        text: "Project Progress Overview",
        color: "#fff",
        font: {
          size: 20,            // Chart title font size
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#fff",       // X-axis labels color
          font: {
            size: 14,          // X-axis labels font size
          },
        },
        grid: {
          color: "#444",       // X-axis grid line color
        },
      },
      y: {
        ticks: {
          color: "#fff",       // Y-axis labels color
          font: {
            size: 14,          // Y-axis labels font size
          },
        },
        grid: {
          color: "#444",       // Y-axis grid line color
        },
      },
    },
  };

  return (
    <div className="project-employee-dashboard">
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
        <div className="content-container">
          {/* Left Column: Projects, Employees, Tasks */}
          <div className="left-column">
            {/* Projects List */}
            <div className="projects-section">
              <h3>All Projects</h3>
              {projects.length === 0 ? (
                <p>No projects found.</p>
              ) : (
                <ul className="project-list">
                  {projects.map((proj) => (
                    <li
                      key={proj.project_id}
                      className={`project-item ${
                        selectedProject && selectedProject.project_id === proj.project_id ? "active" : ""
                      }`}
                      onClick={() => handleProjectSelect(proj)}
                    >
                      <FaProjectDiagram className="icon" />
                      <span>{proj.project_name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Employees Section */}
            {selectedProject && (
              <div className="employees-section">
                <h3>Employees for {selectedProject.project_name}</h3>
                {employees.length === 0 ? (
                  <p>No employees assigned to this project.</p>
                ) : (
                  <ul className="employee-list">
                    {employees.map((emp) => (
                      <li
                        key={emp.employee_id}
                        className={`employee-item ${
                          selectedEmployee && selectedEmployee.employee_id === emp.employee_id ? "active" : ""
                        }`}
                        onClick={() => handleEmployeeSelect(emp)}
                      >
                        <FaUsers className="icon" />
                        <span>{emp.email}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Employee Tasks, Subtasks, Milestones */}
            {selectedEmployee && (
              <div className="tasks-section">
                <h3>Tasks for {selectedEmployee.email}</h3>
                {employeeTasks.length === 0 ? (
                  <p>No tasks found for this employee.</p>
                ) : (
                  employeeTasks.map((proj) => (
                    <div key={proj.project_id} className="project-card">
                      <h4>Project: {proj.project_name}</h4>
                      {proj.tasks.length === 0 ? (
                        <p>No tasks in this project for the employee.</p>
                      ) : (
                        proj.tasks.map((task) => (
                          <div key={task.task_id} className="task-card">
                            <h5>{task.task_name}</h5>
                            {task.subtasks.length === 0 ? (
                              <p>No subtasks assigned.</p>
                            ) : (
                              task.subtasks.map((subtask) => {
                                const isCompleted = subtask.assignment_status === 1;
                                return (
                                  <div
                                    key={subtask.subtask_id}
                                    className={`subtask-card ${
                                      isCompleted ? "completed-subtask" : "inprogress-subtask"
                                    }`}
                                  >
                                    <h6>
                                      {subtask.subtask_name}{" "}
                                      {isCompleted && <span className="status-badge">Completed</span>}
                                    </h6>
                                    {subtask.milestones.length === 0 ? (
                                      <p>No milestones.</p>
                                    ) : (
                                      <ul className="milestone-list">
                                        {subtask.milestones.map((m) => (
                                          <li key={m.milestone_id} className={m.status === 1 ? "completed-milestone" : ""}>
                                            {m.milestone_name}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Column: Progress Graph */}
          <div className="right-column">
            <h3>Project Progress</h3>
            {progressData ? (
              <>
                <div className="chart-container">
                  {/* The Bar chart with new chartOptions */}
                  <Bar data={chartData} options={chartOptions} />
                </div>
                <div className="project-info">
                  <p>
                    <strong>Deadline:</strong> {new Date(progressData.deadline).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Expected Weeks to Complete:</strong> {progressData.expectedWeeks}
                  </p>
                </div>
              </>
            ) : (
              <p>No progress data available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
