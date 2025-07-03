
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardGeneral.css";

function DashboardGeneral() {
  const [selectedOption, setSelectedOption] = useState("dashboard");
  const [adminList, setAdminList] = useState([]);
  const [showProvince, setShowProvince] = useState(false);
  const navigate = useNavigate();

  const [fieldType, setFieldType] = useState("province");
  const [fieldName, setFieldName] = useState("");

  const provinces = [
    "Province de Marrakech",
    "Province d'Al Haouz",
    "Province de Chichaoua",
    "Province d'El Kelâa",
    "Province de Essaouira",
    "Province de Rehamna",
    "Province de Safi",
    "Province de Youssoufia",
  ];

  useEffect(() => {
    if (selectedOption === "deleteAdmin") {
      fetch("http://localhost:3001/admins")
        .then((res) => res.json())
        .then((data) => setAdminList(data))
        .catch((err) => console.error("Erreur:", err));
    }
  }, [selectedOption]);

  const handleDelete = async (username) => {
    try {
      const res = await fetch(`http://localhost:3001/deleteAdmin/${username}`, {
        method: "DELETE",
      });
      const data = await res.json();
      alert(data.message);
      setAdminList(adminList.filter((admin) => admin.username !== username));
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value;
    const password = form.password.value;
    const role = form.role.value;
    const province = role.includes("provincial")
      ? form.province?.value
      : undefined;

    try {
      const res = await fetch("http://localhost:3001/addAdmin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role, province }),
      });

      const data = await res.json();
      alert(data.message || "Admin ajouté");
      form.reset();
      setShowProvince(false);
    } catch (error) {
      alert("Erreur lors de l'ajout de l'admin");
    }
  };

  const handleAddField = async (e) => {
    e.preventDefault();
    if (!fieldName || !fieldType)
      return alert("Veuillez remplir tous les champs");

    try {
      const res = await fetch("http://localhost:3001/addField", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: fieldType, name: fieldName }),
      });

      const data = await res.json();
      alert(data.message);
      setFieldName("");
    } catch (err) {
      alert("Erreur lors de l'ajout du champ");
    }
  };

  const renderContent = () => {
    switch (selectedOption) {
      case "addAdmin":
        return (
          <div>
            <h3>Ajouter un Admin</h3>
            <form onSubmit={handleAddAdmin}>
              <input
                type="text"
                placeholder="Nom d'utilisateur"
                name="username"
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                name="password"
                required
              />
              <select
                name="role"
                required
                onChange={(e) => {
                  const value = e.target.value;
                  setShowProvince(
                    value === "direction_provincial" ||
                      value === "president_provincial"
                  );
                }}
              >
                <option value="">Sélectionner un rôle</option>
                <option value="admin_general">admin_general</option>
                <option value="president_provincial">
                  president_provincial
                </option>
                <option value="president_regional">president_regional</option>
                <option value="direction_regional">direction_regional</option>
                <option value="direction_provincial">
                  direction_provincial
                </option>
              </select>

              {showProvince && (
                <select name="province" required>
                  <option value="">Sélectionner une province</option>
                  {provinces.map((province, index) => (
                    <option key={index} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              )}

              <button type="submit">Ajouter</button>
            </form>
          </div>
        );

      case "deleteAdmin":
        return (
          <div>
            <h3>Supprimer un Admin</h3>
            {adminList.length === 0 ? (
              <p>Aucun admin trouvé.</p>
            ) : (
              <ul>
                {adminList.map((admin) => (
                  <li key={admin._id}>
                    <strong>Username:</strong> {admin.username} |{" "}
                    <strong>Password:</strong> {admin.password} |{" "}
                    <strong>Rôle:</strong> {admin.role}{" "}
                    {admin.province && (
                      <>
                        | <strong>Province:</strong> {admin.province}
                      </>
                    )}{" "}
                    <button onClick={() => handleDelete(admin.username)}>
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );

      case "addField":
        return (
          <div>
            <h3>Ajouter une province ou une commune</h3>
            <form onSubmit={handleAddField}>
              <select
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value)}
                required
              >
                <option value="">Choisir le type</option>
                <option value="province">Province</option>
                <option value="commune">Commune</option>
              </select>

              <input
                type="text"
                placeholder={`Nom de la ${fieldType}`}
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                required
              />
              <button type="submit">Ajouter</button>
            </form>
          </div>
        );

      default:
        return (
          <h3>
            Bienvenue sur le tableau de bord de l'admin général. Ici, vous
            pouvez gérer les administrateurs, ajouter des champs personnalisés
            et consulter les statistiques.
          </h3>
        );
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Bienvenue Admin Général</h1>

      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => navigate("/dashboard")}>
          Afficher Dashboard
        </button>
        <button onClick={() => setSelectedOption("addAdmin")}>
          Ajouter Admin
        </button>
        <button onClick={() => setSelectedOption("deleteAdmin")}>
          Supprimer Admin
        </button>
        <button onClick={() => setSelectedOption("addField")}>
          Ajouter Champ
        </button>
      </div>

      <div style={{ border: "1px solid #ccc", padding: "20px" }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default DashboardGeneral;
