import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SkillsPage.css";

const SkillsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userDetails = location.state; // Getting user data from Signup page

  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedSkills, setSelectedSkills] = useState([]);

  const domains = {
    "Frontend": ["React", "Angular", "Vue"],
    "Backend": ["Node.js", "Django", "Flask", "PHP"],
    "Machine Learning": ["TensorFlow", "PyTorch", "Scikit-learn"],
    "Database": ["MySQL", "PostgreSQL", "MongoDB"],
    "OS": ["Linux", "Windows", "MacOS"],
    "Cloud": ["AWS", "Azure", "Google Cloud"]
  };

  const handleDomainClick = (domain) => {
    setSelectedDomain(domain === selectedDomain ? null : domain);
  };

  const handleSkillSelect = (skill) => {
    setSelectedSkills((prevSkills) =>
      prevSkills.includes(skill) ? prevSkills.filter((s) => s !== skill) : [...prevSkills, skill]
    );
  };

  const handleFinish = async (event) => {
    if (selectedSkills.length === 0) {
      alert("Please select at least one skill.");
      return;
    }

    // Add cubes popping effect
    const button = event.currentTarget;
    const totalCubes = 60;

    for (let i = 0; i < totalCubes; i++) {
      const cube = document.createElement("div");
      cube.classList.add("cube");

      // Random size for varied effect
      const size = Math.random() * 8 + 6;
      cube.style.width = `${size}px`;
      cube.style.height = `${size}px`;

      // Generate angle for full circle spread
      const angle = (i / totalCubes) * Math.PI * 2;

      // Generate random distance for spread effect
      const distance = Math.random() * 100 + 40;

      // Calculate X and Y movements based on angle
      const xMove = `${Math.cos(angle) * distance}px`;
      const yMove = `${Math.sin(angle) * distance}px`;

      cube.style.setProperty("--x-move", xMove);
      cube.style.setProperty("--y-move", yMove);

      // Position the cubes relative to the button
      const { left, top, width, height } = button.getBoundingClientRect();
      cube.style.left = `${left + width / 2}px`;
      cube.style.top = `${top + height / 2}px`;

      document.body.appendChild(cube);

      // Remove cube after animation
      setTimeout(() => {
        cube.remove();
      }, 800);
    }

    // Send employee data after animation
    const employeeData = {
      ...userDetails,
      domains: Object.keys(domains).filter(domain => selectedSkills.some(skill => domains[domain].includes(skill))),
      skills: selectedSkills
    };

    const response = await fetch("http://localhost:5000/register-employee", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employeeData),
    });

    const result = await response.json();
    if (response.ok) {
      alert(result.message);
      navigate("/"); // Redirect to login
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="skills-container">
      <h2>Select Your Domain & Skills</h2>

      <div className="skills-wrapper">
        {/* 📌 Improved "Your Skills" Section */}
        <div className="user-skills">
          <h3>Your Skills</h3>
          {selectedSkills.length > 0 ? (
            <div className="skills-list-container">
              {selectedSkills.map((skill) => (
                <span key={skill} className="skill-chip">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="no-skills">No skills selected yet</p>
          )}
        </div>

        <div className="domains-grid">
          {Object.keys(domains).map((domain) => (
            <div key={domain} className="domain-box">
              <button className={`domain-btn ${selectedDomain === domain ? "selected" : ""}`} onClick={() => handleDomainClick(domain)}>
                {domain}
              </button>

              {selectedDomain === domain && (
                <div className="skills-list">
                  {domains[domain].map((skill) => (
                    <label key={skill} className="checkbox-wrapper-12">
                      <div className="cbx">
                        <input type="checkbox" checked={selectedSkills.includes(skill)} onChange={() => handleSkillSelect(skill)} />
                        <label></label>
                        <svg fill="none" viewBox="0 0 15 14" height="14" width="15">
                          <path d="M2 8.36364L6.23077 12L13 2"></path>
                        </svg>
                      </div>
                      <span>{skill}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="login-button" onClick={handleFinish}>Finish</button>
    </div>
  );
};

export default SkillsPage;
