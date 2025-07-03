import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./DirectorProvincial.module.css";


function DirectorProvincial() {
  const [users, setUsers] = useState([]);

  // نجبدو province من localStorage ونديرو trim
  const province = localStorage.getItem("province")?.trim();

  useEffect(() => {
    if (province) {
      console.log("Fetching users for province:", `"${province}"`);
      axios
        .get(`http://localhost:3001/users/${encodeURIComponent(province)}`)
        .then((res) => {
          console.log("Users received:", res.data);
          setUsers(res.data);
        })
        .catch((err) => console.error(err));
    }
  }, [province]);

  const handleStatus = (id, newStatus) => {
    axios
      .post(`http://localhost:3001/users/${id}/status`, { status: newStatus })
      .then(() => {
        setUsers((prev) =>
          prev.map((user) =>
            user._id === id ? { ...user, status: newStatus } : user
          )
        );
      })
      .catch((err) => console.error(err));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>
        Bienvenue directeur de la province:  {province}
      </h2>
      <table
        border="1"
        cellPadding="10"
        cellSpacing="0"
        style={{ width: "100%", textAlign: "left" }}
      >
        <thead>
          <tr>
            <th>Nom</th>
            <th>Prénom</th>
            <th>Age</th>
            <th>CIN</th>
            <th>Profession</th>
            <th>Région</th>
            <th>Province</th>
            <th>Commune</th>
            <th>Adresse</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="14" style={{ textAlign: "center" }}>
                Aucun utilisateur trouvé dans cette province.
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user._id}>
                <td>{user.nom}</td>
                <td>{user.prenom}</td>
                <td>{user.age}</td>
                <td>{user.cin}</td>
                <td>{user.profession}</td>
                <td>{user.region}</td>
                <td>{user.province}</td>
                <td>{user.commune}</td>
                <td>{user.adresse}</td>
                <td>{user.telephone}</td>
                <td>{user.email}</td>
                <td>{user.status}</td>
                <td>
                  <button
                    onClick={() => handleStatus(user._id, "accepté")}
                    disabled={user.status === "accepté"}
                  >
                    Accepter
                  </button>
                  <button
                    onClick={() => handleStatus(user._id, "refusé")}
                    disabled={user.status === "refusé"}
                    style={{ marginLeft: "8px" }}
                  >
                    Refuser
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DirectorProvincial;
