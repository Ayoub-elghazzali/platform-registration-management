
import React, { useEffect, useState } from "react";
import axios from "axios";
import ProvinceStats from "./ProvinceStats";
import "./PresidentProvincial.module.css";


function PresidentProvincial() {
  const [users, setUsers] = useState([]);
  const province = localStorage.getItem("province")?.trim(); // نزيد trim باش نحيد الفراغات

  useEffect(() => {
    if (province) {
      axios
        .get(`http://localhost:3001/users/${province}`)
        .then((res) => setUsers(res.data))
        .catch((err) => console.error(err));
    }
  }, [province]);
  


  return (
    <div style={{ padding: "20px" }}>
      <h1 className="title"> Bienvenue président de la province: {province}</h1>
      <button
        onClick={() => (window.location.href = "/provinceStats")}
        style={{ marginBottom: "20px" }}
      >
        Voir les statistiques
      </button>

      <table border="1" cellPadding="10" cellSpacing="0">
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
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan="12" style={{ textAlign: "center" }}>
                Aucun utilisateur trouvé dans cette province.
              </td>
            </tr>
          )}
          {users.map((user) => (
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
  

}

export default PresidentProvincial;


