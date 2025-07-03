

import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:3001/loginAdmin", {
        username,
        password,
      });

      if (response.data.success) {
        const role = response.data.role;
        const province = response.data.province || null; // نستخرج ال province من الرد

        // تخزين province في localStorage (إذا كان موجود)
        if (province) {
          localStorage.setItem("province", province);
        } else {
          localStorage.removeItem("province"); // نحيدها إذا ما كايناش
        }

        // التنقل حسب الدور
        if (role === "admin_general") {
          navigate("/dashboardGeneral");
        } else if (role === "president_regional") {
          navigate("/dashboardRegional");
        } else if (role === "Director_Regional") {
          navigate("/DirectorRegional");
        } else if (role === "president_provincial") {
          navigate("/PresidentProvincial");
        } else if (role === "director_provincial") {
          navigate("/DirectorProvincial");
        } else {
          setError("Rôle non reconnu.");
        }
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect.");
      }
    } catch (err) {
      setError("Erreur lors de la connexion.");
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Connexion Admin</h2>

        {error && <p className="error-message">{error}</p>}

        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}

export default Login;

