import React, { useState, useEffect } from "react";
import { 
  FaUserCog, 
  FaProjectDiagram, 
  FaNewspaper, 
  FaSignOutAlt, 
  FaBars, 
  FaHome, 
  FaFlagCheckered, 
  FaStar, 
  FaCommentAlt 
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import "./Employee_dashboard.css"; // Ensure styling matches

const Milestones = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from local storage (or fallback to location state)
  const [email, setEmail] = useState("");
  useEffect(() => {
    const storedEmail = localStorage.getItem("employee_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Retrieve employee_id from location state (if available) or later via API
  const [employee_id, setEmployeeId] = useState(
    (location.state && location.state.employee_id) || null
  );
  useEffect(() => {
    const fetchEmployeeId = async () => {
      try {
        if (email && !employee_id) {
          const empRes = await fetch(
            `http://localhost:5000/api/get-employee-id?email=${encodeURIComponent(email)}`
          );
          if (!empRes.ok) {
            const errorData = await empRes.json();
            throw new Error(errorData.error || "Failed to fetch employee ID");
          }
          const empData = await empRes.json();
          setEmployeeId(empData.employee_id);
          console.log(`✅ Employee ID fetched: ${empData.employee_id}`);
        }
      } catch (error) {
        console.error("Error fetching employee id:", error);
      }
    };
    fetchEmployeeId();
  }, [email, employee_id]);

  // Get initial milestones from location state if available; default to empty array
  const initialMilestones = (location.state && location.state.milestones) || [];
  const [milestones, setMilestones] = useState(initialMilestones);

  // When setting milestoneState, filter out milestones marked as completed (persisted in localStorage)
  const [milestoneState, setMilestoneState] = useState([]);
  useEffect(() => {
    const completedFromStorage = JSON.parse(localStorage.getItem("completedMilestones")) || [];
    const updatedMilestones = milestones.map((subtask) => ({
      subtask_id: subtask.subtask_id,
      subtask_name: subtask.subtask_name,
      milestones: subtask.milestones
        .filter(m => !completedFromStorage.includes(m.milestone_id))
        .map((m) => ({
          milestone_id: m.milestone_id,
          milestone_name: m.milestone_name,
          completed: false,
        })),
    }));
    setMilestoneState(updatedMilestones);
  }, [milestones]);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);

  // Toggle popups and logout
  const handleToggleUpdateFeed = () => setShowUpdateFeed((prev) => !prev);
  const handleToggleRatingPopup = () => setShowRatingPopup((prev) => !prev);
  const handleLogout = () => navigate("/");
  const handleSubmitRating = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRating(0);
  };

  // Fetch assignments if projectId is provided in location state
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const projectId = location.state?.projectId;
        if (!projectId) {
          console.warn("Project ID is missing in location state.");
          return;
        }
        const res = await fetch(`http://localhost:5000/api/project_details/${projectId}`);
        if (!res.ok) throw new Error("Failed to fetch assignment data");
        const data = await res.json();
        const formattedMilestones = data.tasks.flatMap(task =>
          task.subtasks.map(subtask => ({
            subtask_id: subtask.id,
            subtask_name: subtask.name,
            milestones: subtask.milestones.map(m => ({
              milestone_id: m.id,
              milestone_name: m.name,
              completed: m.status === 1,
            })),
          }))
        );
        // Also filter out any milestones persisted as completed in localStorage
        const completedFromStorage = JSON.parse(localStorage.getItem("completedMilestones")) || [];
        const updatedMilestones = formattedMilestones.map((subtask) => ({
          ...subtask,
          milestones: subtask.milestones.filter(m => !completedFromStorage.includes(m.milestone_id))
        }));
        setMilestoneState(updatedMilestones);
        console.log("✅ Assignment data re-fetched:", updatedMilestones);
      } catch (err) {
        console.error("❌ Error fetching assignments:", err);
      }
    };
    if (employee_id && location.state?.projectId) {
      fetchAssignments();
    }
  }, [employee_id, location.state]);

  // Mark a milestone as completed (remove from UI and persist in localStorage)
  const completeMilestone = async (subtaskId, milestoneId, milestoneName) => {
    console.log(`🔹 Completing milestone ${milestoneId} for subtask ${subtaskId}`);
    console.log(`📦 Sending payload with email: ${email}`);

    try {
      let empId = employee_id;
      if (!empId) {
        const empRes = await fetch(
          `http://localhost:5000/api/get-employee-id?email=${encodeURIComponent(email)}`
        );
        if (!empRes.ok) {
          const errorData = await empRes.json();
          throw new Error(errorData.error || "Failed to fetch employee ID");
        }
        const empData = await empRes.json();
        empId = empData.employee_id;
        setEmployeeId(empId);
        console.log(`✅ Employee ID fetched: ${empId}`);
      }

      const logResponse = await fetch("http://localhost:5000/api/log-milestone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: empId,
          milestone_id: milestoneId,
          message: `Completed ${milestoneName}`,
        }),
      });
      if (!logResponse.ok) {
        const errorData = await logResponse.json();
        throw new Error(errorData.error || "Failed to log milestone completion");
      }
      const result = await logResponse.json();
      console.log("API log-milestone response:", result);

      // Remove the milestone from UI, and remove the subtask if no milestones remain.
      setMilestoneState((prev) =>
        prev.reduce((acc, subtask) => {
          if (subtask.subtask_id === subtaskId) {
            const updatedMilestones = subtask.milestones.filter(
              (m) => m.milestone_id !== milestoneId
            );
            // Only add the subtask back if there are remaining milestones.
            if (updatedMilestones.length > 0) {
              acc.push({ ...subtask, milestones: updatedMilestones });
            }
          } else {
            acc.push(subtask);
          }
          return acc;
        }, [])
      );

      // Persist the completed milestone in localStorage
      const storedCompleted = JSON.parse(localStorage.getItem("completedMilestones")) || [];
      if (!storedCompleted.includes(milestoneId)) {
        storedCompleted.push(milestoneId);
        localStorage.setItem("completedMilestones", JSON.stringify(storedCompleted));
      }

      if (result.subtask) {
        alert(`✅ New subtask assigned: ${result.subtask.subtask_name}`);
      }
    } catch (error) {
      console.error("❌ Error logging milestone:", error.message);
    }
  };

  // Assign a new subtask
  const assignNewSubtask = async () => {
    console.log("🔹 Checking for a new subtask assignment...");
    try {
      const res = await fetch("http://localhost:5000/api/assign-new-subtask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employee_id }),
      });
      const result = await res.json();
      console.log("📌 New subtask assigned:", result);
      if (result.subtask) {
        alert(`✅ New subtask assigned: ${result.subtask.name}`);
      } else {
        alert("⚠ No new subtask available at the moment.");
      }
    } catch (error) {
      console.error("❌ Error assigning new subtask:", error);
    }
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button className="toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
          <FaBars />
        </button>
        <div className="menu-item" onClick={() => navigate("/home-employee")}>
          <FaHome className="icon" /> {!isCollapsed && <span>Home</span>}
        </div>
        <div className="menu-item" onClick={() => navigate("/mytasks")}>
          <FaProjectDiagram className="icon" /> {!isCollapsed && <span>My Projects</span>}
        </div>
        <div className="menu-item" onClick={() => navigate("/milestones")}>
          <FaUserCog className="icon" /> {!isCollapsed && <span>My Milestones</span>}
        </div>
        <div className="menu-item" onClick={() => navigate("/feedback-employee")}>
          <FaCommentAlt className="icon" /> {!isCollapsed && <span>My Feedback</span>}
        </div>
        <div className="menu-item" onClick={() => navigate("/employee-rating")}>
          <FaStar className="icon" /> {!isCollapsed && <span>Employee Rating</span>}
        </div>
      </div>

      {/* Main Content */}
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

        {/* Milestones + Climbing Animation Side-by-Side */}
        <div className="milestones-container">
          <div className="milestones-flex">
            {/* Tasks Section */}
            <div className="tasks-section">
              {milestoneState.length > 0 ? (
                milestoneState.map((subtask) => (
                  <div key={subtask.subtask_id} className="subtask">
                    <h3>{subtask.subtask_name}</h3>
                    <ul>
                      {subtask.milestones.map((mile) => (
                        <li key={mile.milestone_id} className={mile.completed ? "completed" : ""}>
                          {mile.milestone_name}
                          <button
                            className="complete-btn"
                            onClick={() => completeMilestone(subtask.subtask_id, mile.milestone_id, mile.milestone_name)}
                          >
                            Complete
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              ) : (
                <p className="no-milestones">No milestones found.</p>
              )}
            </div>

            {/* Loader Container (Climbing Animation) */}
            <div className="loader-container">
              <div className="loader">
                <div className="person"></div>
                <div className="steps">
                  <div className="step"></div>
                  <div className="step"></div>
                  <div className="step"></div>
                  <div className="step"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Milestones;
