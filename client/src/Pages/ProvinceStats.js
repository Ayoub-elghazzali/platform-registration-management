import React, { useEffect, useState } from "react";
import axios from "axios";

function ProvinceStats() {
  const [users, setUsers] = useState([]);
  const province = localStorage.getItem("province")?.trim();

  useEffect(() => {
    if (province) {
      axios
        .get(`http://localhost:3001/users/${province}`)
        .then((res) => {
          const sorted = res.data.sort((a, b) => a.nom.localeCompare(b.nom));
          setUsers(sorted);
        })
        .catch((err) => console.error(err));
    }
  }, [province]);

  const total = users.length;

  return (
    <div style={{ padding: "30px", fontFamily: "Arial" }}>
      <h2 style={{ marginBottom: "20px" }}>
        📊 Statistiques des utilisateurs - Province : {province}
      </h2>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        <thead style={{ backgroundColor: "#343a40", color: "#fff" }}>
          <tr>
            <th style={thStyle}>#</th>
            <th style={thStyle}>Nom</th>
            <th style={thStyle}>Prénom</th>
            <th style={thStyle}>Statut</th>
            <th style={thStyle}>Commune</th>
            <th style={thStyle}>Profession</th>
            <th style={thStyle}>Âge</th>
            <th style={thStyle}>Téléphone</th>
            <th style={thStyle}>Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr
              key={user._id}
              style={{
                backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                textAlign: "center",
              }}
            >
              <td style={tdStyle}>{index + 1}</td>
              <td style={tdStyle}>{user.nom}</td>
              <td style={tdStyle}>{user.prenom}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    padding: "4px 8px",
                    borderRadius: "5px",
                    backgroundColor:
                      user.status === "accepté"
                        ? "#28a745"
                        : user.status === "refusé"
                        ? "#dc3545"
                        : "#ffc107",
                    color: "#fff",
                  }}
                >
                  {user.status || "en attente"}
                </span>
              </td>
              <td style={tdStyle}>{user.commune || "—"}</td>
              <td style={tdStyle}>{user.profession || "—"}</td>
              <td style={tdStyle}>{user.age || "—"}</td>
              <td style={tdStyle}>{user.telephone || "—"}</td>
              <td style={tdStyle}>{user.email || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", fontWeight: "bold" }}>
        Total des utilisateurs : {total}
      </div>
    </div>
  );
}

const thStyle = {
  padding: "12px",
  borderBottom: "2px solid #ccc",
};

const tdStyle = {
  padding: "10px",
  borderBottom: "1px solid #ddd",
};

export default ProvinceStats;
