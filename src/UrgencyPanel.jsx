import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
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
import { useNavigate, useParams } from "react-router-dom";
import "./ProjectManagerDashboard.css";

const UrgencyPanel = ({ id }) => {
  const [form, setForm] = useState({
    kpi_gap: "",
    external_threat: "",
    narrative: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`http://localhost:5000/urgency/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => setForm({
        kpi_gap: data.kpi_gap || "",
        external_threat: data.external_threat || "",
        narrative: data.narrative || ""
      }))
      .catch(err => console.error("No data found", err));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // ONLY add id if it's editing an existing record
      const payload = { ...form };
      if (id) {
        payload.id = id;
      }
  
      await fetch("http://localhost:5000/urgency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
  
      alert("Saved!");
    } catch (error) {
      console.error(error);
      alert("Save failed");
    } finally {
      setSaving(false);
    }
  };
  
  const kpiMatch = form.kpi_gap?.match(/(\d+\.?\d*)\s*vs\s*(\d+\.?\d*)/i);
  const chart = kpiMatch ? (
    <Bar
      data={{
        labels: ["Goal", "Current"],
        datasets: [{ data: [parseFloat(kpiMatch[2]), parseFloat(kpiMatch[1])] }]
      }}
      options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
    />
  ) : null;

  return (
    <div className="urgency-panel">
      <h2>⚡ Sense of Urgency</h2>

      <label>KPI Gap<br />
        <input
          value={form.kpi_gap}
          onChange={e => setForm({ ...form, kpi_gap: e.target.value })}
          placeholder="e.g. Current CAC $210 vs $150 goal"
        />
      </label>

      <label>Competitive / External Threat<br />
        <input
          value={form.external_threat}
          onChange={e => setForm({ ...form, external_threat: e.target.value })}
          placeholder="What's pushing you to move fast?"
        />
      </label>

      <label>Narrative / Story<br />
        <textarea
          rows={4}
          value={form.narrative}
          onChange={e => setForm({ ...form, narrative: e.target.value })}
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

const UrgencyPage = () => {
  const { id } = useParams();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="dashboard">
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
            <FaCommentAlt className="icon" /> {!isCollapsed && <span>Feedback Deck</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/burnt-score")}>
            <FaFireAlt className="icon" /> {!isCollapsed && <span>Burnt Score</span>}
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

      <div className={`main-content ${isCollapsed ? "collapsed" : ""}`}>
        <div
          className="topbar"
          style={{
            left: isCollapsed ? "80px" : "250px",
            width: isCollapsed ? "calc(100% - 80px)" : "calc(100% - 250px)"
          }}
        >
          <div className="topbar-icons">
            <FaNewspaper className="update-icon" title="Updates" />
            <FaStar className="rating-icon" title="Rate Us" />
            <FaSignOutAlt className="logout-icon" title="Logout" onClick={() => navigate("/")} />
          </div>
          <h3 style={{ margin: 0 }}>SwiftCollab</h3>
        </div>

        <div className="content-wrap">
          <UrgencyPanel id={id} />
        </div>
      </div>

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
