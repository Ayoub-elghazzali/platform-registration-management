import React, { useEffect, useState } from "react";
import axios from "axios";

function DashboardRegional() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/finalAccepted") // On ne filtre pas par région ici
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Erreur :", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Utilisateurs validés par le directeur régional</h1>

      {users.length === 0 ? (
        <p>Aucun utilisateur validé par le directeur régional trouvé.</p>
      ) : (
        <table border="1" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Adresse</th>
              <th>Âge</th>
              <th>Région</th>
              <th>Province</th>
              <th>Commune</th>
              <th>Statut Final</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.nom}</td>
                <td>{u.prenom}</td>
                <td>{u.email}</td>
                <td>{u.adresse}</td>
                <td>{u.age}</td>
                <td>{u.region}</td>
                <td>{u.province}</td>
                <td>{u.commune}</td>
                <td>Accepté ✅</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default DashboardRegional;
