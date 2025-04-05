import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";
import zxcvbn from "zxcvbn"; // Import password strength library

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [passwordStrength, setPasswordStrength] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Check password strength when typing
    if (name === "password") {
      const result = zxcvbn(value);
      const strengthLevels = ["Weak", "Good", "Strong"];
      setPasswordStrength(strengthLevels[result.score] || "Weak");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    const response = await fetch("http://localhost:5000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const result = await response.json();
    if (response.ok) {
      if (formData.role === "Employee") {
        navigate("/skills", { state: formData }); // Pass data to SkillsPage
      } else {
        alert(result.message);
        navigate("/"); // Redirect to login
      }
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="signup-container">
      <form className="form" onSubmit={handleRegister}>
        <p id="heading">Sign Up</p>

        <input type="text" name="username" placeholder="Username" className="input-field" onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" className="input-field" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" className="input-field" onChange={handleChange} required />
        <p className={`password-strength ${passwordStrength.toLowerCase()}`}>{passwordStrength}</p> {/* Display password strength */}

        <input type="password" name="confirmPassword" placeholder="Retype Password" className="input-field" onChange={handleChange} required />

        <label className="role-label">Role:</label>
        <select name="role" className="dropdown" onChange={handleChange} required>
          <option value="">Select Role</option>
          <option value="Project Manager">Project Manager</option>
          <option value="Employee">Employee</option>
        </select>

        <div className="btn">
          {formData.role !== "Employee" && <button type="submit" className="login-button">Register</button>}
          {formData.role === "Employee" && <button type="button" className="login-button" onClick={() => navigate("/skills", { state: formData })}>Next</button>}
        </div>
      </form>
    </div>
  );
};
export default Signup;
