import React, { useState, useEffect } from "react";
import { FaProjectDiagram, FaNewspaper, FaSignOutAlt, FaBars, FaHome, FaFlagCheckered, FaStar, FaCommentAlt } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./MyFeedback.css";

const MyFeedback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [feedbackList, setFeedbackList] = useState([]);
  const [error, setError] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showUpdateFeed, setShowUpdateFeed] = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  
  // Retrieve email from local storage or location state
  useEffect(() => {
    const storedEmail = localStorage.getItem("employee_email");
    if (storedEmail) {
      setEmail(storedEmail);
    } else if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Fetch feedback based on email
  useEffect(() => {
    if (!email) return;
    const fetchFeedback = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/employee-feedback?email=${encodeURIComponent(email)}`
        );
        if (!res.ok) throw new Error("Failed to fetch feedback");
        const data = await res.json();
        setFeedbackList(data.feedback || []);
      } catch (err) {
        console.error(err);
        setError("Could not fetch feedback.");
      }
    };
    fetchFeedback();
  }, [email]);

  // Toggle popups and logout handlers...
  const handleToggleUpdateFeed = () => setShowUpdateFeed((prev) => !prev);
  const handleToggleRatingPopup = () => setShowRatingPopup((prev) => !prev);
  const handleLogout = () => navigate("/");

  const handleSubmitRating = () => {
    alert("Feedback sent");
    setShowRatingPopup(false);
    setRating(0);
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
        <div className="topbar" style={{ left: isCollapsed ? "80px" : "250px", width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)" }}>
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

        {/* Feedback Content */}
        <div className="feedback-container">
          {error && <p className="error-message">{error}</p>}
          {feedbackList.length === 0 ? (
            <p className="no-feedback">No feedback available.</p>
          ) : (
            <ul className="feedback-list">
              {feedbackList.map((fb) => (
                <li key={fb.id} className="feedback-item">
                  <p className="project-name">
                    <strong>Project:</strong> {fb.project_name || fb.project_id}
                  </p>
                  <p className="feedback-message">{fb.feedback_message}</p>
                  <p className="feedback-date">
                    <em>{new Date(fb.createdAt).toLocaleDateString()}</em>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyFeedback;
