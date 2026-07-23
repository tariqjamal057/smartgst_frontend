import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser, sendOtp } from "../api/auth";
import taxImage from "../assets/logo_app.jpeg";
import "../styles/login.css";


export default function Login() {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Signup states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP states
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");


  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail || !loginPassword) {
      setLoginError("Please enter email and password.");
      return;
    }
    try {
      const res = await loginUser({ email: loginEmail, password: loginPassword });
      console.log("res ", res)
      const { access, refresh, user } = res.data;
      localStorage.setItem("access_token", access);
      if (refresh) localStorage.setItem("refresh_token", refresh);
      if (user) localStorage.setItem("user", JSON.stringify(user));
      navigate("/select-company");
    } catch (err) {
      console.log("error ", err)
      const detail = err.response?.data?.detail || err.message;
      setLoginError(detail);
    }
  };

  const handleSendOtp = async () => {
    if (!email || !email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setLoading(true);

    try {
      const res = await sendOtp(email, otp);
      if (res.data.success) {
        setOtpSent(true);
        setShowOtpSection(true);
        alert("OTP sent successfully! Check your email.");
      } else {
        alert("Failed to send OTP: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("OTP Send Error:", err);
      const msg = err.response?.data?.message || err.message;
      alert("Failed to send OTP: " + msg);
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setSignupError("");

    if (enteredOtp !== generatedOtp) {
      setSignupError("Invalid OTP!");
      setEnteredOtp("");
      return;
    }

    if (!name || !email || !password || !confirmPassword) {
      setSignupError("Please fill all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setSignupError("Passwords do not match!");
      return;
    }

    try {
      const res = await registerUser({
        email,
        password,
        password2: confirmPassword,
        otp: enteredOtp,
        first_name: name.split(" ")[0] || name,
        last_name: name.split(" ").slice(1).join(" ") || "",
      });
      const { access, refresh } = res.data;
      localStorage.setItem("access_token", access);
      if (refresh) localStorage.setItem("refresh_token", refresh);
      localStorage.setItem("user", JSON.stringify({ name, email, role: "New User" }));
      navigate("/select-company");
    } catch (err) {
      const data = err.response?.data || {};
      const detail = data.detail || err.message;
      if (typeof detail === "string") {
        setSignupError(detail);
      } else if (typeof data === "object") {
        const msgs = Object.entries(data)
          .map(([field, errors]) => {
            const list = Array.isArray(errors) ? errors : [errors];
            return list.map(e => `${field}: ${e}`).join(". ");
          })
          .filter(Boolean)
          .join(". ");
        setSignupError(msgs || "Registration failed.");
      } else {
        setSignupError(detail || "Registration failed.");
      }
    }
  };

  return (
    <div className="smartgst-login-container">
      {/* Left Side - Image */}
      <div className="smartgst-image-half">
  <div className="login-image-wrapper">   {/* ← yeh naya div add kar */}
    <img src={taxImage} alt="SmartGST" className="smartgst-bg-image" />
  </div>
  <div class="smartgst-overlay">
    <h1 class="smartgst-title">SmartAccounts</h1>
    <div class="smartgst-powered">Powered by Sharma & Co</div>
    <p class="smartgst-desc">
    A secure, reliable, and enterprise-grade accounting platform designed for businesses, accountants, and finance professionals. Streamline financial management, invoicing, bookkeeping, reporting, and operational workflows through one integrated solution.
    </p>
    <h4 className="smartgst-desc">Designed, developed, and maintained by AnuBrain Technology.</h4>
  </div>


</div>


      {/* Right Side - Form */}
      <div className="smartgst-form-half">
        <div className="smartgst-login-card">
          <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>
          <p className="smartgst-subtitle">
            {isSignup ? "Register to access SmartGST" : "Login to your dashboard"}
          </p>

          {/* Login Form */}
          {!isSignup ? (
            <form onSubmit={handleLogin} className="smartgst-form">
              <input
                type="email"
                placeholder="Email Address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
              {loginError && <p className="smartgst-error">{loginError}</p>}
              <button type="submit" className="smartgst-btn">
                LOGIN
              </button>

              <div className="smartgst-links">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(true);
                  }}
                >
                  New user? Create account
                </a>
              </div>
            </form>
          ) : (
            /* Signup Form */
            <form onSubmit={(e) => e.preventDefault()} className="smartgst-form">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={otpSent}
                required
              />

              <div className="smartgst-email-group">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  required
                />
                {!otpSent && email.includes("@") && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="smartgst-send-btn"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                )}
                {otpSent && (
                  <small className="smartgst-otp-sent">
                    ✓ OTP Sent to {email}
                  </small>
                )}
              </div>

              {showOtpSection && (
                <div className="smartgst-otp-section">
                  <p>Enter 6-digit OTP</p>
                  <input
                    type="text"
                    placeholder="••••••"
                    value={enteredOtp}
                    onChange={(e) =>
                      setEnteredOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    maxLength={6}
                    autoFocus
                  />
                </div>
              )}

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!otpSent}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!otpSent}
                required
              />

              {signupError && <p className="smartgst-error">{signupError}</p>}

              <button
                type="button"
                onClick={handleVerifyOtp}
                className="smartgst-btn"
                disabled={!otpSent || enteredOtp.length !== 6}
              >
                Verify & Sign Up
              </button>

              <div className="smartgst-links">
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSignup(false);
                  }}
                >
                  Already have an account? Login
                </a>
              </div>
            </form>
          )}

          <p className="smartgst-copyright">
            © 2025 SmartGST - Powered by Sharma & Co
          </p>
        </div>
      </div>
    </div>
  );
}