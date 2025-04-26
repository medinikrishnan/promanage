import React, { useState, useEffect } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  FaBars, FaHome, FaProjectDiagram, FaUserCog, FaClipboardList, FaChartBar,
  FaTasks, FaUsers, FaCommentAlt, FaFireAlt, FaSignOutAlt, FaStar, FaNewspaper,
  FaBolt, FaGamepad
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import "./ProjectManagerDashboard.css";
import "./RatingPopup.css";
import "./UpdateFeed.css";

/* ------------- inner panel (unchanged business logic) -------------- */
const UrgencyPanel = ({ projectId }) => {
  const [form, setForm] = useState({
    kpi_gap: "",
    comp_threat: "",
    story: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`/api/urgency/${projectId}`)
      .then(res => setForm(f => ({ ...f, ...res.data })))
      .catch(() => {});
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`/api/urgency/${projectId}`, form);
      alert("Saved!");
    } catch {
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* optional bar-chart */
  let chart = null;
  const kpiMatch = form.kpi_gap.match(/(\d+\.?\d*)\s*vs\s*(\d+\.?\d*)/i);
  if (kpiMatch) {
    const current = parseFloat(kpiMatch[1]);
    const goal    = parseFloat(kpiMatch[2]);
    chart = (
      <Bar
        data={{ labels: ["Goal", "Current"], datasets: [{ data: [goal, current] }] }}
        options={{ plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true}} }}
      />
    );
  }

  return (
    <div className="urgency-panel">
      <h2>⚡ Sense of Urgency</h2>

      <label>KPI Gap<br/>
        <input
          value={form.kpi_gap}
          onChange={e => setForm({ ...form, kpi_gap: e.target.value })}
          placeholder="e.g. Current CAC $210 vs $150 goal"
        />
      </label>

      <label>Competitive / External Threat<br/>
        <input
          value={form.comp_threat}
          onChange={e => setForm({ ...form, comp_threat: e.target.value })}
          placeholder="What's pushing you to move fast?"
        />
      </label>

      <label>Narrative / Story<br/>
        <textarea
          rows={4}
          value={form.story}
          onChange={e => setForm({ ...form, story: e.target.value })}
          placeholder="Tell the brief story you'd share with the team…"
        />
      </label>

      <button disabled={saving} onClick={handleSave}>
        {saving ? "Saving…" : "Save"}
      </button>

      {chart && <div style={{ maxWidth: 400, marginTop: 20 }}>{chart}</div>}
    </div>
  );
};

/* ---------------- page wrapper with sidebar / topbar ---------------- */
const UrgencyPage = () => {
  const { projectId } = useParams();     // /urgency/:projectId
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      {/* sidebar */}
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
            <FaCommentAlt className="icon" /> {!isCollapsed && <span>Feedback Deck</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/burnt-score")}>
            <FaFireAlt className="icon" /> {!isCollapsed && <span>Burnt Score</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/gamify")}>
            <FaGamepad className="icon" /> {!isCollapsed && <span>Gamify</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/urgency")}>
            <FaBolt className="icon" /> {!isCollapsed && <span>Change Management</span>}
          </div>
        </div>
      </div>

      {/* main area */}
      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        <div
          className="topbar"
          style={{
            left: isCollapsed ? "80px" : "250px",
            width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)",
          }}
        >
          <div className="topbar-icons">
            <FaNewspaper className="update-icon" title="Updates" />
            <FaStar className="rating-icon" title="Rate Us" />
            <FaSignOutAlt className="logout-icon" title="Logout" onClick={() => navigate("/")} />
          </div>
          <h3 style={{ margin: 0 }}>SwiftCollab</h3>
        </div>

        {/* actual step-1 panel */}
        <div className="content-wrap">
          <UrgencyPanel projectId={projectId} />
        </div>
      </div>

      {/* ↓ quick in-file CSS ↓ */}
      <style>{`
        .urgency-panel { max-width:600px; margin:auto; background:#fff; padding:24px 28px; border-radius:8px; box-shadow:0 2px 6px rgba(0,0,0,.08); }
        .urgency-panel h2 { margin-top:0; color:#333; }
        .urgency-panel label { display:block; margin:1rem 0 .4rem; font-weight:600; color:#444; }
        .urgency-panel input, .urgency-panel textarea {
          width:100%; padding:.55rem .7rem; border:1px solid #ccc;
          border-radius:4px; font-size:.95rem; resize:vertical;
        }
        .urgency-panel button {
          margin-top:1rem; background:#0066ff; border:none; color:#fff;
          padding:.6rem 1.4rem; border-radius:4px; cursor:pointer;
        }
        .urgency-panel button[disabled] { opacity:.6; cursor:not-allowed; }
      `}</style>
    </div>
  );
};

export default UrgencyPage;
