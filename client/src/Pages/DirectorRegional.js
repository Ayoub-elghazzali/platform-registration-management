import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DirectorProvincial.module.css"

const DirectorRegional = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:3001/acceptedUsers")
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Erreur:", err));
  }, []);

  const handleValidate = async (userId) => {
    try {
      await axios.post(`http://localhost:3001/validateDecision/${userId}`);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, validatedByDirectorRegional: true } : u
        )
      );
    } catch (err) {
      console.error("Erreur validation:", err);
    }
  };

  return (
    <div>
      <h2>✅ Utilisateurs Acceptés à Valider</h2>

      {users.length === 0 ? (
        <p>Aucun utilisateur accepté trouvé.</p>
      ) : (
        <table border="1" style={{ width: "100%", marginTop: "20px" }}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Email</th>
              <th>Adresse</th> {/* ✅ العنوان */}
              <th>Âge</th>
              <th>Région</th> {/* ✅ الجهة */}
              <th>Province</th>
              <th>Commune</th>
              <th>Validation Directeur Régional</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.nom}</td>
                <td>{u.prenom}</td>
                <td>{u.email}</td>
                <td>{u.adresse}</td> {/* ✅ العنوان */}
                <td>{u.age}</td>
                <td>{u.region}</td> {/* ✅ الجهة */}
                <td>{u.province}</td>
                <td>{u.commune}</td>
                {/* <td>{u.validatedByDirectorRegional ? "✅ Oui" : "❌ Non"}</td> */}
                <td
                  className={
                    u.validatedByDirectorRegional
                      ? "status-accepted"
                      : "status-refused"
                  }
                >
                  {u.validatedByDirectorRegional ? "✅ Oui" : "❌ Non"}
                </td>
                <td>
                  {!u.validatedByDirectorRegional && (
                    <button onClick={() => handleValidate(u._id)}>
                      Valider ✅
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DirectorRegional;
