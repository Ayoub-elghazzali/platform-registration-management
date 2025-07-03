
import React, { useEffect, useState } from "react";
import Axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./Dashboard.css";

const Dashboard = () => {
  const [provinceStats, setProvinceStats] = useState([]);
  const [users, setUsers] = useState([]);
  const [activePage, setActivePage] = useState("stats");

  const navigate = useNavigate();

  // Fonction pour normaliser les noms des provinces
  const normalizeProvinceName = (name) => {
    return name
      .replace(/^Province (de|d')\s*/i, "")
      .trim()
      .toLowerCase();
  };

  useEffect(() => {
    // Récupérer les statistiques des provinces
    Axios.get("http://localhost:3001/stats/provinces")
      .then((res) => {
        const data = res.data;
        const mergedStats = {};

        Object.entries(data).forEach(([province, values]) => {
          const key = normalizeProvinceName(province);
          if (!mergedStats[key]) {
            mergedStats[key] = {
              province: province,
              accepted: 0,
              refused: 0,
              pending: 0,
            };
          }
          mergedStats[key].accepted += values.accepted;
          mergedStats[key].refused += values.refused;
          mergedStats[key].pending += values.pending;
        });

        const formatted = Object.values(mergedStats);
        setProvinceStats(formatted);
      })
      .catch((err) => {
        console.error("Erreur chargement stats provinces:", err);
      });

    // Récupérer les utilisateurs
    Axios.get("http://localhost:3001/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        console.error("Erreur chargement utilisateurs:", err);
      });
  }, []);

  // Utilisateurs validés par le Directeur Régional
  const finalValidatedUsers = users.filter(
    (user) => user.validatedByDirectorRegional === true
  );

  const finalValidatedCount = finalValidatedUsers.length;

  const cellStyle = {
    border: "1px solid #ccc",
    padding: "8px",
    textAlign: "center",
  };

  // Fonction déconnexion
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Fonction pour télécharger badge en PDF
  const downloadBadgeAsPDF = (userId) => {
    const badgeElement = document.getElementById(`badge-${userId}`);
    if (!badgeElement) {
      alert("Badge introuvable!");
      return;
    }
    html2canvas(badgeElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`badge_${userId}.pdf`);
    });
  };

  return (
    <div className="dashboard-wrapper">
      <nav className="navbar">
        <div className="navbar-logo">📌 MonApp</div>
        <div className="navbar-welcome">Bienvenue, Admin !</div>
      </nav>

      <aside className="sidebar">
        <ul>
          <li
            className={activePage === "stats" ? "active" : ""}
            onClick={() => setActivePage("stats")}
          >
            Statistiques par Province
          </li>
          <li
            className={activePage === "users" ? "active" : ""}
            onClick={() => setActivePage("users")}
          >
            Utilisateurs ({users.length})
          </li>
          <li
            className={activePage === "finalStats" ? "active" : ""}
            onClick={() => setActivePage("finalStats")}
          >
            Statistiques Décision Finale ({finalValidatedCount})
          </li>
          <li>Statistiques par région</li>
          <li
            style={{ cursor: "pointer", color: "red" }}
            onClick={handleLogout}
          >
            Déconnexion
          </li>
        </ul>
      </aside>

      <main className="dashboard-container">
        {activePage === "stats" && (
          <>
            <h1 className="dashboard-title">📍 Statistiques par province</h1>
            <BarChart width={800} height={400} data={provinceStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="province" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accepted" fill="#00C49F" name="Acceptés" />
              <Bar dataKey="refused" fill="#FF4444" name="Refusés" />
              <Bar dataKey="pending" fill="#FFBB28" name="En attente" />
            </BarChart>

            <p style={{ marginTop: "20px", fontSize: "16px", color: "#333" }}>
              Ce graphique montre la répartition des utilisateurs par province
              et par statut (accepté, refusé ou en attente).
            </p>

            <h2 style={{ marginTop: "30px" }}>📊 Détail par province</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginTop: "10px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f0f0f0" }}>
                  <th style={cellStyle}>Province</th>
                  <th style={cellStyle}>Acceptés</th>
                  <th style={cellStyle}>Refusés</th>
                  <th style={cellStyle}>En attente</th>
                  <th style={cellStyle}>Total</th>
                </tr>
              </thead>
              <tbody>
                {provinceStats.map((prov) => (
                  <tr key={prov.province}>
                    <td style={cellStyle}>{prov.province}</td>
                    <td style={cellStyle}>{prov.accepted}</td>
                    <td style={cellStyle}>{prov.refused}</td>
                    <td style={cellStyle}>{prov.pending}</td>
                    <td style={cellStyle}>
                      {prov.accepted + prov.refused + prov.pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {activePage === "users" && (
          <>
            <h1 className="dashboard-title">📋 Liste des utilisateurs</h1>
            <div className="users-list">
              {users.length === 0 && <p>Aucun utilisateur pour le moment.</p>}
              {users.map((user) => (
                <div className="user-card" key={user._id || user.email}>
                  {user.validatedByDirectorRegional === true && (
                    <div className="badge-accepted">Accepté ✅</div>
                  )}

                  <ul>
                    <li>
                      <strong>Nom :</strong> {user.nom}
                    </li>
                    <li>
                      <strong>Prénom :</strong> {user.prenom}
                    </li>
                    <li>
                      <strong>Âge :</strong> {user.age}
                    </li>
                    <li>
                      <strong>CIN :</strong> {user.cin}
                    </li>
                    <li>
                      <strong>Profession :</strong> {user.profession}
                    </li>
                    <li>
                      <strong>Région :</strong> {user.region}
                    </li>
                    <li>
                      <strong>Province :</strong> {user.province}
                    </li>
                    <li>
                      <strong>Commune :</strong> {user.commune}
                    </li>
                    <li>
                      <strong>Adresse :</strong> {user.adresse}
                    </li>
                    <li>
                      <strong>Téléphone :</strong> {user.telephone}
                    </li>
                    <li>
                      <strong>Email :</strong> {user.email}
                    </li>
                    <li>
                      <strong>Statut :</strong> {user.status || "N/A"}
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}

        {activePage === "finalStats" && (
          <>
            <h1 className="dashboard-title">
              ✅ Utilisateurs validés par le Directeur Régional
            </h1>
            <div className="users-list">
              {finalValidatedUsers.length === 0 && (
                <p>Aucun utilisateur validé pour le moment.</p>
              )}
              {finalValidatedUsers.map((user) => (
                <div className="user-card" key={user._id || user.email}>
                  <ul>
                    <li>
                      <strong>Nom :</strong> {user.nom}
                    </li>
                    <li>
                      <strong>Prénom :</strong> {user.prenom}
                    </li>
                    <li>
                      <strong>Âge :</strong> {user.age}
                    </li>
                    <li>
                      <strong>CIN :</strong> {user.cin}
                    </li>
                    <li>
                      <strong>Profession :</strong> {user.profession}
                    </li>
                    <li>
                      <strong>Région :</strong> {user.region}
                    </li>
                    <li>
                      <strong>Province :</strong> {user.province}
                    </li>
                    <li>
                      <strong>Commune :</strong> {user.commune}
                    </li>
                    <li>
                      <strong>Adresse :</strong> {user.adresse}
                    </li>
                    <li>
                      <strong>Téléphone :</strong> {user.telephone}
                    </li>
                    <li>
                      <strong>Email :</strong> {user.email}
                    </li>
                    <li>
                      <strong>Statut :</strong> {user.status || "N/A"}
                    </li>
                  </ul>

                  {/* Badge pour téléchargement */}

                  <button
                    onClick={() => downloadBadgeAsPDF(user._id)}
                    style={{ marginTop: "10px", cursor: "pointer" }}
                  >
                    Télécharger le badge
                  </button>
                  <div
                    id={`badge-${user._id}`}
                    style={{
                      width: "250px",
                      padding: "10px",
                      border: "2px solid #00C49F",
                      backgroundColor: "#f0f9f7",
                      marginTop: "10px",
                    }}
                  >
                    <h3>Badge Utilisateur</h3>
                    <p>
                      je vous informe que {user.nom} {user.prenom} dans la{" "}
                      {user.region} dans la {user.province}
                    </p>
                    <p>✔️ Validation acceptée par le Directeur Régional</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
