import React, { useState, useEffect } from "react";
import axios from "../security/api";
import { useNavigate } from "react-router-dom";
import "./DashboardGeneral.css";

function DashboardGeneral() {
  const [selectedOption, setSelectedOption] = useState("dashboard");
  const [adminList, setAdminList] = useState([]);
  const [showProvince, setShowProvince] = useState(false);
  const [showRegion, setShowRegion] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const provinces = [
    "Province de Marrakech", "Province d'Al Haouz", "Province de Chichaoua",
    "Province d'El Kelâa", "Province de Essaouira", "Province de Rehamna",
    "Province de Safi", "Province de Youssoufia"
  ];

  useEffect(() => {
    if (selectedOption === "deleteAdmin") {
      axios.get("/admins").then(response => setAdminList(response.data))
        .catch(() => setError("Impossible de charger les administrateurs."));
    }
  }, [selectedOption]);

  async function handleDelete(username) {
    try {
      await axios.delete(`/deleteAdmin/${encodeURIComponent(username)}`);
      setAdminList(current => current.filter(admin => admin.username !== username));
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Désactivation impossible.");
    }
  }

  async function handleAddAdmin(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const role = form.role.value;
    const payload = {
      username: form.username.value,
      password: form.password.value,
      role,
      province: role.toLowerCase().includes("provincial") ? form.province.value : undefined,
      region: role.toLowerCase().includes("regional") ? form.region.value : undefined
    };
    try {
      await axios.post("/addAdmin", payload);
      setError("Administrateur créé.");
      form.reset();
      setShowProvince(false);
      setShowRegion(false);
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Création impossible.");
    }
  }

  async function handleAddField(event) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await axios.post("/addField", { type: form.elements.type.value, name: form.elements.fieldName.value });
      setError("Champ ajouté.");
      form.reset();
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Ajout impossible.");
    }
  }

  const renderContent = () => {
    switch (selectedOption) {
      case "addAdmin":
        return (
          <div>
            <h3>Créer un administrateur</h3>
            <form onSubmit={handleAddAdmin}>
              <input name="username" type="text" placeholder="Nom d’utilisateur" minLength="3" maxLength="80" required />
              <input name="password" type="password" placeholder="Mot de passe (12 caractères minimum)" minLength="12" maxLength="128" autoComplete="new-password" required />
              <select name="role" required onChange={event => {
                const value = event.target.value.toLowerCase();
                setShowProvince(value.includes("provincial"));
                setShowRegion(value.includes("regional"));
              }}>
                <option value="">Sélectionner un rôle</option>
                <option value="ADMIN">ADMIN</option>
                <option value="REGIONAL_ADMIN">REGIONAL_ADMIN</option>
                <option value="PROVINCIAL_ADMIN">PROVINCIAL_ADMIN</option>
              </select>
              {showRegion && <select name="region" required><option value="">Sélectionner une région</option><option value="Marrakech-Safi">Marrakech-Safi</option></select>}
              {showProvince && <select name="province" required><option value="">Sélectionner une province</option>{provinces.map(value => <option key={value} value={value}>{value}</option>)}</select>}
              <button type="submit">Créer le compte</button>
            </form>
          </div>
        );
      case "deleteAdmin":
        return (
          <div>
            <h3>Désactiver un administrateur</h3>
            {adminList.length === 0 ? <p>Aucun administrateur trouvé.</p> : <ul>
              {adminList.map(admin => <li key={admin.id || admin._id}>
                <strong>{admin.username}</strong> · {admin.role} · {admin.isActive ? "Actif" : "Désactivé"}
                {admin.province && ` · ${admin.province}`}
                <button type="button" disabled={!admin.isActive} onClick={() => handleDelete(admin.username)}>Désactiver</button>
              </li>)}
            </ul>}
          </div>
        );
      case "addField":
        return (
          <div>
            <h3>Ajouter une province ou une commune</h3>
            <form onSubmit={handleAddField}>
              <select name="type" defaultValue="province" required><option value="province">Province</option><option value="commune">Commune</option></select>
              <input name="fieldName" type="text" placeholder="Nom" maxLength="120" required />
              <button type="submit">Ajouter</button>
            </form>
          </div>
        );
      default:
        return <h3>Administration générale : gestion des comptes, des référentiels et consultation des statistiques.</h3>;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Administration générale</h1>
      {error && <p role="status">{error}</p>}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => navigate("/dashboard")}>Afficher le tableau de bord</button>
        <button onClick={() => setSelectedOption("addAdmin")}>Ajouter un administrateur</button>
        <button onClick={() => setSelectedOption("deleteAdmin")}>Administrateurs</button>
        <button onClick={() => setSelectedOption("addField")}>Ajouter un champ</button>
      </div>
      <div style={{ border: "1px solid #ccc", padding: "20px" }}>{renderContent()}</div>
    </div>
  );
}
export default DashboardGeneral;
