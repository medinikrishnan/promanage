import React, { useState } from "react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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
  FaStar,
  FaNewspaper,
  FaBolt,
  FaGamepad,
  FaStar as StarIcon
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./ProjectManagerDashboard.css";
import "./RatingPopup.css";
import "./UpdateFeed.css";

const ItemTypes = { PERSON: "person" };
const initials = name =>
  name
    .split(" ")
    .map(p => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const PersonCard = ({ person, onStarClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.PERSON,
    item: person,
    collect: m => ({ isDragging: m.isDragging() })
  });

  return (
    <div
      ref={drag}
      className="person-card"
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <div className="avatar">{initials(person.name)}</div>
      <div className="info">
        <span className="name">{person.name}</span>
        {onStarClick && (
          <span className="stars">
            {[1, 2, 3, 4, 5].map(n => (
              <StarIcon
                key={n}
                className={person.influence >= n ? "star filled" : "star"}
                onClick={() => onStarClick(person.id, n)}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
};

const Column = ({ title, people, onDropPerson, children }) => {
  const [{ isOver }, drop] = useDrop({
    accept: ItemTypes.PERSON,
    drop: onDropPerson,
    collect: m => ({ isOver: m.isOver() })
  });

  return (
    <div ref={drop} className={`column ${isOver ? "over" : ""}`}>
      <h3>{title}</h3>
      {people.length ? children : <p className="placeholder">– empty –</p>}
    </div>
  );
};

const CoalitionBoard = () => {
  const seed = [
    { id: 1, name: "Alice Kumar" },
    { id: 2, name: "Ben Castillo" },
    { id: 3, name: "Carla Nguyen" },
    { id: 4, name: "Devon O'Hara" },
    { id: 5, name: "Elisa Moretti" },
    { id: 6, name: "Finley Jensen" }
  ];

  const [allPeople, setAllPeople] = useState(seed);
  const [coalition, setCoalition] = useState([]);

  const addToCoalition = p => {
    setCoalition(c => [...c, { ...p, influence: 3 }]);
    setAllPeople(all => all.filter(e => e.id !== p.id));
  };
  const removeFromCoalition = p => {
    setAllPeople(all => [...all, { id: p.id, name: p.name }]);
    setCoalition(c => c.filter(e => e.id !== p.id));
  };
  const setInfluence = (id, val) =>
    setCoalition(c =>
      c.map(e => (e.id === id ? { ...e, influence: val } : e))
    );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="coalition-board">
        <Column
          title="People Suggested"
          people={allPeople}
          onDropPerson={removeFromCoalition}
        >
          {allPeople.map(p => (
            <PersonCard key={p.id} person={p} />
          ))}
        </Column>

        <Column title="Coalition" people={coalition} onDropPerson={addToCoalition}>
          {coalition.map(p => (
            <PersonCard key={p.id} person={p} onStarClick={setInfluence} />
          ))}
        </Column>
      </div>
    </DndProvider>
  );
};

const GuidingCoalitionPage = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          <FaBars />
        </button>
        <div className="sidebar-menu">
          <div className="menu-item" onClick={() => navigate("/project_manager_dashboard")}>
            <FaHome className="icon" /> {!collapsed && <span>Home</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/addprojects")}>
            <FaProjectDiagram className="icon" /> {!collapsed && <span>Add Project</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/add-skills")}>
            <FaUserCog className="icon" /> {!collapsed && <span>Add Skills</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/teams")}>
            <FaClipboardList className="icon" /> {!collapsed && <span>Generate Tasks</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/progress")}>
            <FaChartBar className="icon" /> {!collapsed && <span>Progress</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/taskcard")}>
            <FaTasks className="icon" /> {!collapsed && <span>Task Card</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/myteams")}>
            <FaUsers className="icon" /> {!collapsed && <span>Make Teams</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/feedback")}>
            <FaCommentAlt className="icon" /> {!collapsed && <span>Feedback Deck</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/burnt-score")}>
            <FaFireAlt className="icon" /> {!collapsed && <span>Burnt Score</span>}
          </div>
          <div className="menu-item active">
            <FaBolt className="icon" /> {!collapsed && <span>Coalition</span>}
          </div>
          <div className="menu-item" onClick={() => navigate("/gamify")}>
            <FaGamepad className="icon" /> {!collapsed && <span>Gamify</span>}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <div
          className="topbar"
          style={{
            left: collapsed ? "80px" : "250px",
            width: collapsed ? "calc(100% - 80px)" : "calc(100% - 250px)"
          }}
        >
          <div className="topbar-icons">
            <FaNewspaper className="update-icon" title="Update Feed" />
            <FaStar className="rating-icon" title="Rate Us" />
            <FaSignOutAlt className="logout-icon" title="Logout" onClick={() => navigate("/")} />
          </div>
          <h3>SwiftCollab</h3>
        </div>

        <div className="content-wrap">
          <h2 style={{ marginTop: 0 }}>👥 Build a Guiding Coalition</h2>
          <CoalitionBoard />
        </div>
      </div>

      {/* In-file overrides */}
      <style>{`
        .coalition-board {
          display: flex;
          gap: 24px;
        }
        /* Widen both white panels */
        .column {
          flex: 0 0 calc(50% - 12px);
          background: #fafbfe;
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 16px;
          min-height: 420px;
        }
        .column.over { background: #e7f2ff; }
        .column h3 { margin-bottom: 10px; color: #333; }
        .placeholder { color: #888; font-style: italic; }

        /* Make each card fill its panel */
        .person-card {
          width: 100%;
          display: flex;
          gap: 12px;
          align-items: center;
          background: #fff;
          border: 1px solid #ddd;
          padding: 10px 14px;
          border-radius: 4px;
          margin-bottom: 10px;
          cursor: grab;
        }
        .avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #0066ff;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }
        .info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        /* Larger names */
        .name {
          font-weight: 500;
          color: #000;
          font-size: 1.2rem;
        }
        .stars { display: flex; gap: 3px; }
        .star { color: #ccc; cursor: pointer; }
        .star.filled { color: #f6b400; }
      `}</style>
    </div>
  );
};

export default GuidingCoalitionPage;
