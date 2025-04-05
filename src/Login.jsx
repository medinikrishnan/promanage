import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  // --------------------------------------------------
  // LOGIN FORM: State & Logic (unchanged)
  // --------------------------------------------------
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Lock-Shackle Toggle on the login button
    const button = document.querySelector(".animated-login-button");
    const shackle = document.getElementById("shackle");
    let isLocked = true;

    if (button && shackle) {
      button.addEventListener("click", () => {
        if (isLocked) {
          shackle.style.transform = "translateY(-2.0px) rotate(15deg)";
        } else {
          shackle.style.transform = "translateY(0px) rotate(0deg)";
        }
        isLocked = !isLocked;
      });
    }
  }, []);


  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        console.log("User Role:", data.role);
        if (data.role === "Employee") {
          // Use formData.email here since data.email is not provided by the backend
          localStorage.setItem("employee_email", formData.email);
        }
        navigate(data.redirect);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    }
  };
  

  // --------------------------------------------------
  // FLIP CARD: State & Logic
  // --------------------------------------------------
  // We'll track whether the card is flipped or not
  const [isFlipped, setIsFlipped] = useState(false);

  // Derive the masked password from formData
  const maskedPassword = formData.password
    ? "x".repeat(formData.password.length)
    : "••••••";

  return (
    <div className="page-container">
      <div className="card-and-form">
        {/* =================== FLIP CARD SECTION =================== */}
        <div className="flip-card">
          <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
            {/* Front Side -> Shows Email */}
            <div className="flip-card-front">
              <div className="top-elements">
                <div className="logo">SC</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {/* Chip SVG */}
                  <svg
                    className="chip-svg"
                    viewBox="0 0 60 40"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect
                      x="1"
                      y="1"
                      width="58"
                      height="38"
                      rx="6"
                      fill="#D8B87B"
                      stroke="#000"
                      strokeWidth="0.5"
                    />
                    <path
                      d="M15 5c3 4 3 26 0 30
                         M45 5c-3 4-3 26 0 30"
                      stroke="#704F24"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* NFC/Contactless SVG */}
                  <svg
                    className="nfc-svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12a10 10 0 0 1 20 0" />
                    <path d="M6 12a6 6 0 0 1 12 0" />
                    <path d="M10 12a2 2 0 0 1 4 0" />
                  </svg>
                </div>
              </div>

              <div className="card-front-info">
                <div className="label">Swift Collaborators</div>
                <div className="value">
                  {formData.email || "_________________"}
                </div>
              </div>

              <div className="bottom-elements">
                {/* Additional info or design if needed */}
              </div>
            </div>

            {/* Back Side -> Shows Masked Password + Company Info */}
            <div className="flip-card-back">
              <div className="card-back-info">
                <div className="label">PASSWORD</div>
                <div className="value">{maskedPassword}</div>
                <div className="company-info">SwiftCollab @2025</div>
              </div>
            </div>
          </div>
        </div>

        {/* =================== LOGIN FORM SECTION =================== */}
        <div className="login-container">
          <form className="form" onSubmit={handleSubmit}>
            <p id="heading">Login</p>
            {error && <p className="error">{error}</p>}

            <input
              type="email"
              name="email"
              placeholder="Email"
              className="input-field"
              // On focus, show the front side
              onFocus={() => setIsFlipped(false)}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="input-field"
              // On focus, show the back side
              onFocus={() => setIsFlipped(true)}
              onChange={handleChange}
              required
            />

            <div className="btn">
              <button
                type="submit"
                className="login-button animated-login-button"
              >
                {/* Lock Icon */}
                <svg className="lock-icon" viewBox="0 0 24 24">
                  <path
                    id="shackle"
                    className="lock-shackle"
                    d="M12 3a5 5 0 0 0-5 5v3h2V8a3 3 0 0 1 6 0v3h2V8a5 5 0 0 0-5-5z"
                  />
                  <path d="M6 10v10h12V10H6zm6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
                </svg>
                <span>Login</span>
              </button>

              <button
                type="button"
                className="login-button animated-login-button"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
