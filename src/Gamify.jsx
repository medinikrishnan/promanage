// src/components/Gamify.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBars,
  FaHome,
  FaProjectDiagram,
  FaUserCog,
  FaClipboardList,
  FaChartBar,
  FaTasks,
  FaUsers,
  FaCommentAlt,
  FaFireAlt,
  FaSignOutAlt,
  FaGamepad,
} from "react-icons/fa";
import "./ProjectManagerDashboard.css"; // your existing styles

const Gamify = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [badges, setBadges] = useState([]);             // holds badge metadata
  const [badgeCounts, setBadgeCounts] = useState({});     // holds only counts
  const navigate = useNavigate();

  // Fetch saved badge configs on component mount
  useEffect(() => {
    fetch("http://localhost:5000/api/get-badge-config")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load badges");
        return res.json();
      })
      .then(({ badgeConfigs }) => {
        // badgeConfigs: { [id]: { category, name, icon, count } }
        const loaded = Object.entries(badgeConfigs).map(([id, cfg]) => ({
          id:       Number(id),
          category: cfg.category,
          name:     cfg.name,
          icon:     cfg.icon,
          count:    cfg.count,
        }));
        setBadges(loaded);

        // initialize counts state
        const counts = {};
        loaded.forEach((b) => {
          counts[b.id] = b.count;
        });
        setBadgeCounts(counts);
      })
      .catch((err) => {
        console.error(err);
        // optionally: show a toast / fallback
      });
  }, []);

  // update local count when user edits the input
  const handleBadgeCountChange = (id, value) => {
    setBadgeCounts((prev) => ({
      ...prev,
      [id]: Number(value),
    }));
  };

  // Save everything (category, name, icon, count) back to your backend
  const handleSaveBadgeConfig = () => {
    const payload = {};
    badges.forEach((b) => {
      payload[b.id] = {
        category: b.category,
        name:     b.name,
        icon:     b.icon,
        count:    badgeCounts[b.id] || 0,
      };
    });

    fetch("http://localhost:5000/api/save-badge-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badgeConfigs: payload }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to save badge configuration");
        return res.json();
      })
      .then((data) => {
        alert(data.message);
      })
      .catch((err) => {
        console.error(err);
        alert(err.message);
      });
  };

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
        <button
          className="toggle-btn"
          onClick={() => setIsCollapsed((c) => !c)}
        >
          <FaBars />
        </button>
        <div className="sidebar-menu">
          <div className="menu-item" onClick={() => navigate("/project_manager_dashboard")}>
            <FaHome className="icon" />{!isCollapsed && <span>Home</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/addprojects")}>
            <FaProjectDiagram className="icon" />{!isCollapsed && <span>Add Project</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/add-skills")}>
            <FaUserCog className="icon" />{!isCollapsed && <span>Add Skills</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/teams")}>
            <FaClipboardList className="icon" />{!isCollapsed && <span>Generate Tasks</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/progress")}>
            <FaChartBar className="icon" />{!isCollapsed && <span>Progress</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/taskcard")}>
            <FaTasks className="icon" />{!isCollapsed && <span>Task Card</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/myteams")}>
            <FaUsers className="icon" />{!isCollapsed && <span>Make Teams</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/feedback")}>
            <FaCommentAlt className="icon" />{!isCollapsed && <span>Feed Back Deck</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/burnt-score")}>
            <FaFireAlt className="icon" />{!isCollapsed && <span>Burnt Score</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/gamify")}>
            <FaGamepad className="icon" />{!isCollapsed && <span>Gamify</span>}
          </div>
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
          <h2 className="topbar-title">Gamify</h2>
          <div className="topbar-icons">
            <FaSignOutAlt
              className="logout-icon"
              onClick={() => navigate("/")}
              title="Logout"
            />
          </div>
          <h3>SwiftCollab</h3>
        </div>

        <div className="gamify-content">
          <h2>Badge Configuration</h2>
          <table className="badge-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Badge Name</th>
                <th>Icon</th>
                <th>Set Number</th>
              </tr>
            </thead>
            <tbody>
              {badges.map((badge) => (
                <tr key={badge.id}>
                  <td>{badge.id}</td>
                  {/* <td>{badge.category}</td> */}
                  <td>{badge.name}</td>
                  <td style={{ fontSize: "24px" }}>{badge.icon}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={badgeCounts[badge.id] || 0}
                      onChange={(e) =>
                        handleBadgeCountChange(badge.id, e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <br />
          <button
            className="save-badge-config-btn"
            onClick={handleSaveBadgeConfig}
          >
            Save Badge Configuration
          </button>
          <br></br>
        </div>
      </div>
      {/* Inline CSS for the save config button */}
      <style>{`
        .save-badge-config-btn {
          background-color: #6200ea; /* Primary color */
          color: #fff;
          border: none;
          padding: 10px 20px;
          font-size: 16px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease, transform 0.1s ease;
          margin-top: 20px;
        }

        .save-badge-config-btn:hover {
          background-color: #5a00da; /* Darker on hover */
        }

        .save-badge-config-btn:active {
          transform: scale(0.98); /* Slight shrink on click */
        }

        .save-badge-config-btn:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(98, 0, 234, 0.4); /* Focus outline */
        }
      `}</style>
    </div>
  );
};

export default Gamify;
