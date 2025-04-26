// src/ResourceManagement.jsx

import React, { useState, useEffect } from 'react';
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
  FaGamepad,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import ScheduleCalendar from './Resource_schedule.jsx';
import ResourceReport   from './Resource_report.jsx';

import './ProjectManagerDashboard.css';
import './RatingPopup.css';
import './UpdateFeed.css';
import './Resource.css';

// point axios to your backend
axios.defaults.baseURL = 'http://localhost:5000/api';

const ResourceManagement = () => {
  const navigate = useNavigate();

  // sidebar / topbar
  const [isCollapsed, setIsCollapsed]         = useState(false);
  const [showUpdateFeed, setShowUpdateFeed]   = useState(false);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating]                   = useState(0);

  // project + data
  const [projects, setProjects]               = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // assigned physical resources
  const [resources, setResources]             = useState([]);
  // catalog + people combined
  const [allResources, setAllResources]       = useState([]);
  // tasks
  const [tasks, setTasks]                     = useState([]);

  // assigned people (from project_assignment)
  const [people, setPeople]                   = useState([]);

  // form state
  const [assignQty, setAssignQty]             = useState({ resourceId:'', qty:'' });
  const [assignPerson, setAssignPerson]       = useState('');
  const [scheduleData, setScheduleData]       = useState({
    resourceId:'', taskId:'', start:new Date(), end:new Date()
  });
  const [newResource, setNewResource]         = useState({
    resource_name:'', resource_type:'', description:'', quantity:''
  });
  const [suggestions, setSuggestions]         = useState([]);

  // completion estimate UI
  const [estimate, setEstimate]               = useState('');
  const [isEstimating, setIsEstimating]       = useState(false);

  // 1) Load all projects on mount
  useEffect(() => {
    axios.get('/projects')
      .then(r => setProjects(r.data))
      .catch(console.error);
  }, []);

  // 2) When selectedProject changes, load everything
  useEffect(() => {
    if (!selectedProject) return;

    // a) assigned physical resources
    axios.get(`/projects/${selectedProject}/resources`)
      .then(r => setResources(r.data))
      .catch(console.error);

    // b) tasks
    axios.get(`/projects/${selectedProject}/tasks`)
      .then(r => setTasks(r.data))
      .catch(console.error);

    // c) catalog + people pool
    axios.get('/resources', { params: { projectId: selectedProject } })
      .then(r => setAllResources(r.data))
      .catch(console.error);

    // d) assigned people
    axios.get(`/project-employees/${selectedProject}`)
      .then(r => setPeople(r.data.employees))
      .catch(console.error);
  }, [selectedProject]);

  // sidebar / topbar handlers
  const handleToggleUpdateFeed = () => setShowUpdateFeed(v => !v);
  const handleToggleRatingPopup = () => setShowRatingPopup(v => !v);
  const handleLogout = () => navigate('/');
  const handleSubmitRating = () => {
    alert('Feedback sent!');
    setShowRatingPopup(false);
    setRating(0);
  };

  // assign a physical resource
  const handleAssignResource = async () => {
    if (!assignQty.resourceId || !assignQty.qty) {
      return alert('Select a resource and qty');
    }
    try {
      await axios.post('/assign-resource', {
        project_id: selectedProject,
        resource_id: assignQty.resourceId,
        quantity_assigned: +assignQty.qty
      });
      setAssignQty({ resourceId:'', qty:'' });
      // reload assigned resources
      const { data } = await axios.get(`/projects/${selectedProject}/resources`);
      setResources(data);
    } catch (err) {
      console.error(err);
      alert('Assign failed.');
    }
  };

  // assign a person
  const handleAssignPerson = async () => {
    if (!assignPerson) return alert('Select a person');
    try {
      await axios.post('/assign-employees', {
        assignments: [{ employee_id:+assignPerson, project_id:selectedProject }]
      });
      setAssignPerson('');
      // reload people
      const { data } = await axios.get(`/project-employees/${selectedProject}`);
      setPeople(data.employees);
    } catch (err) {
      console.error(err);
      alert('Person assign failed.');
    }
  };

  // schedule a resource on a task
  const handleSchedule = async () => {
    const { resourceId, taskId, start, end } = scheduleData;
    if (!resourceId || !taskId) return alert('Fill all fields');
    try {
      await axios.post('/schedule-resource', {
        project_id: selectedProject,
        resource_id: resourceId,
        task_id: taskId,
        start_date: start,
        end_date: end
      });
      alert('Scheduled!');
      setScheduleData({ resourceId:'', taskId:'', start:new Date(), end:new Date() });
    } catch (err) {
      console.error(err);
      alert('Schedule failed.');
    }
  };

  // add new catalog resource
  const handleAddResource = async () => {
    try {
      await axios.post('/resources', newResource);
      alert('Resource added!');
      setNewResource({ resource_name:'', resource_type:'', description:'', quantity:'' });
      // re-fetch catalog + people if project selected
      if (selectedProject) {
        const { data } = await axios.get('/resources', {
          params:{ projectId:selectedProject }
        });
        setAllResources(data);
      }
    } catch {
      alert('Add failed.');
    }
  };

  // AI suggestions for extra resources
  const handleSuggest = async () => {
    const project = projects.find(p=>p.project_id===selectedProject);
    const taskList = tasks.map(t=>t.name||t.task_name);
    try {
      const { data } = await axios.post(
        `/projects/${selectedProject}/suggest-resources`,
        { description:project?.project_description, tasks:taskList }
      );
      setSuggestions(data.suggestions||data);
    } catch {
      alert('Suggestion failed.');
    }
  };

  // completion estimate via ChatGPT
  const handleEstimate = async () => {
    setIsEstimating(true);
    setEstimate('');
    try {
      const payload = {
               resources: resources.map(r => ({
                 name: r.resource_name,
                 required: r.required_quantity,
                 available: Math.max(r.available_quantity, r.required_quantity)
               })),
               tasks: tasks.map(t => t.name || t.task_name),
               // 👇 include people assigned to this project:
               people: people.map(p => ({
                 email: p.email,
                 domains: p.domains,
                 skills: p.skills
               }))
             };
      const { data } = await axios.post(
        `/projects/${selectedProject}/estimate-completion`,
        payload
      );
      setEstimate((data.estimate||'').replace(/\*\*/g,'').trim());
    } catch {
      setEstimate('Failed to get estimate.');
    } finally {
      setIsEstimating(false);
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
                <div className="menu-item" onClick={() => navigate("/gamify")}>
                  <FaGamepad className="icon" />{!isCollapsed && <span>Gamify</span>}
                </div>
              </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${isCollapsed?'collapsed':''}`}>
        {/* Topbar */}
        <div
          className="topbar"
          style={{
            left: isCollapsed?'80px':'250px',
            width: isCollapsed?'calc(100% - 80px)':'calc(100% - 250px)'
          }}
        >
          <h2 className="topbar-title">Resource Management</h2>
          <div className="topbar-icons">
            <FaNewspaper className="update-icon" onClick={handleToggleUpdateFeed} title="Feed"/>
            <FaStar      className="rating-icon" onClick={handleToggleRatingPopup} title="Rate"/>
            <FaSignOutAlt className="logout-icon" onClick={handleLogout} title="Logout"/>
          </div>
          <h3>SwiftCollab</h3>
        </div>

        {/* Update Feed */}
        {showUpdateFeed && (
          <div className="update-feed-overlay" onClick={handleToggleUpdateFeed}>
            <div className="update-feed-popup" onClick={e=>e.stopPropagation()}>
              <p><strong>Hi Swift Collaborator,</strong></p>
              <p>Welcome to resource management!</p>
            </div>
          </div>
        )}
        {/* Rating Popup */}
        {showRatingPopup && (
          <div className="rating-popup">
            <div className="rating-popup-content">
              <h3>Rate Us</h3>
              <div className="stars-container">
                {[...Array(5)].map((_,i)=>(
                  <FaStar
                    key={i}
                    className={`star ${rating>=i+1?'active':''}`}
                    onClick={()=>setRating(i+1)}
                  />
                ))}
              </div>
              <button className="send-feedback-btn" onClick={handleSubmitRating}>
                Send Feedback
              </button>
            </div>
          </div>
        )}

        {/* Resource UI */}
        <div className="resource-content" style={{padding:20}}>
          {/* Project Selector */}
          <section className="project-list">
            <h3>Select Project</h3>
            <ul>
              {projects.map(p=>(
                <li
                  key={p.project_id}
                  className={p.project_id===selectedProject?'active':''}
                  onClick={()=>setSelectedProject(p.project_id)}
                >
                  {p.project_name}
                </li>
              ))}
            </ul>
          </section>

          {selectedProject && (
            <>
              {/* Physical Resources */}
              <section className="resource-table">
                <h3>
                  Resources for “
                  {projects.find(p=>p.project_id===selectedProject)?.project_name}
                  ”
                </h3>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Required</th>
                      <th>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map(r=>(
                      <tr key={r.resource_id}>
                        <td>{r.resource_name}</td>
                        <td>{r.resource_type}</td>
                        <td>{r.required_quantity}</td>
                        <td>{r.available_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Assigned People */}
              <section className="resource-table">
                <h3>People Assigned</h3>
                <table>
                  <thead>
                    <tr><th>Email</th><th>Domains</th><th>Skills</th></tr>
                  </thead>
                  <tbody>
                    {people.length > 0 ? people.map(p=>(
                      <tr key={p.employee_id}>
                        <td>{p.email}</td>
                        <td>{p.domains}</td>
                        <td>{p.skills}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} style={{textAlign:'center'}}>No one assigned</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </section>

              {/* Assign Physical */}
              <section className="form-row">
                <h4>Assign Resource</h4>
                <select
                  value={assignQty.resourceId}
                  onChange={e=>setAssignQty({...assignQty,resourceId:e.target.value})}
                >
                  <option value="">-- Resource --</option>
                  {allResources
                    .filter(r=>r.resource_type!=='Person')
                    .map(r=>(
                      <option key={r.resource_id} value={r.resource_id}>
                        {r.resource_name}
                      </option>
                    ))}
                </select>
                <input
                  type="number"
                  placeholder="Qty"
                  value={assignQty.qty}
                  onChange={e=>setAssignQty({...assignQty,qty:e.target.value})}
                />
                <button onClick={handleAssignResource}>Assign</button>
              </section>

              {/* Assign Person */}
              <section className="form-row">
                <h4>Assign Person</h4>
                <select
                  value={assignPerson}
                  onChange={e=>setAssignPerson(e.target.value)}
                >
                  <option value="">-- Person --</option>
                  {allResources
                    .filter(r=>r.resource_type==='Person')
                    .map(r=>(
                      <option key={r.resource_id} value={r.resource_id}>
                        {r.resource_name}
                      </option>
                    ))}
                </select>
                <button onClick={handleAssignPerson}>
                  Assign
                </button>
              </section>

              {/* Schedule */}
              <section className="form-row">
                <h4>Schedule Resource</h4>
                <select
                  value={scheduleData.resourceId}
                  onChange={e=>setScheduleData({...scheduleData,resourceId:e.target.value})}
                >
                  <option value="">-- Resource --</option>
                  {resources.map(r=>(
                    <option key={r.resource_id} value={r.resource_id}>
                      {r.resource_name}
                    </option>
                  ))}
                </select>
                <select
                  value={scheduleData.taskId}
                  onChange={e=>setScheduleData({...scheduleData,taskId:e.target.value})}
                >
                  <option value="">-- Task --</option>
                  {tasks.map(t=>(
                    <option key={t.id||t.task_id} value={t.id||t.task_id}>
                      {t.name||t.task_name}
                    </option>
                  ))}
                </select>
                <DatePicker
                  selected={scheduleData.start}
                  onChange={d=>setScheduleData({...scheduleData,start:d})}
                  showTimeSelect timeIntervals={30} dateFormat="Pp"
                />
                <DatePicker
                  selected={scheduleData.end}
                  onChange={d=>setScheduleData({...scheduleData,end:d})}
                  showTimeSelect timeIntervals={30} dateFormat="Pp"
                />
                <button onClick={handleSchedule}>Schedule</button>
              </section>

              {/* Visualizations */}
              <ScheduleCalendar projectId={selectedProject}/>
              <ResourceReport   projectId={selectedProject}/>

              {/* Add New Resource */}
              <section className="form-row">
                <h4>Add New Resource</h4>
                <input
                  placeholder="Name"
                  value={newResource.resource_name}
                  onChange={e=>setNewResource({...newResource,resource_name:e.target.value})}
                />
                <input
                  placeholder="Type"
                  value={newResource.resource_type}
                  onChange={e=>setNewResource({...newResource,resource_type:e.target.value})}
                />
                <input
                  placeholder="Desc"
                  value={newResource.description}
                  onChange={e=>setNewResource({...newResource,description:e.target.value})}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newResource.quantity}
                  onChange={e=>setNewResource({...newResource,quantity:e.target.value})}
                />
                <button onClick={handleAddResource}>Add</button>
              </section>

              {/* AI Suggestions */}
              <section style={{marginTop:20}}>
                <h4>AI Suggestions</h4>
                <button onClick={handleSuggest}>Suggest Resources</button>
                <ul>
                  {suggestions.map((s,i)=>(
                    <li key={i}>{s.resource_name} — {s.quantity}</li>
                  ))}
                </ul>
              </section>

              {/* Completion Estimate */}
              <section style={{marginTop:20}}>
                <h4>Completion Estimate</h4>
                <button
                  onClick={handleEstimate}
                  disabled={isEstimating}
                  style={{
                    padding:'0.5rem 1rem',
                    background: isEstimating?'#ccc':'linear-gradient(to right,#6c2ca7,#8a4fff)',
                    color:'#fff',
                    border:'none',
                    borderRadius:4,
                    cursor:isEstimating?'not-allowed':'pointer'
                  }}
                >
                  {isEstimating?'Estimating…':'Estimate Completion'}
                </button>
                {estimate && (
                  <div style={{
                    marginTop:'1rem',
                    padding:'1rem',
                    background:'#2e2e42',
                    borderRadius:6,
                    color:'#ece7f2',
                    lineHeight:'1.5'
                  }}>
                    {estimate.split('\n').map((line,i)=>(
                      <p key={i} style={{margin:'0.25rem 0'}}>
                        {/^(\d+\.)/.test(line) ? (
                          <>
                            <strong>{line.match(/^(\d+\.)/)[1]}</strong>{' '}
                            {line.replace(/^(\d+\.\s*)/,'')}
                          </>
                        ) : line}
                      </p>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceManagement;
