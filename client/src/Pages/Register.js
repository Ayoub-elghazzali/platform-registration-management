
// import React, { useState, useEffect } from "react";
// import "./Register.css";
// import Axios from "axios";

// const Register = () => {
//   const [users, setUsers] = useState([]);

//   const [nom, setNom] = useState("");
//   const [prenom, setPrenom] = useState("");
//   const [age, setAge] = useState("");
//   const [cin, setCIN] = useState("");
//   const [profession, setProfession] = useState("");
//   const [region, setRegion] = useState("");
//   const [province, setProvince] = useState("");
//   const [commune, setCommune] = useState("");
//   const [adresse, setAdresse] = useState("");
//   const [telephone, setTelephone] = useState("");
//   const [email, setEmail] = useState("");

//   // Show/hide form state
//   const [showForm, setShowForm] = useState(false);

//   useEffect(() => {
//     Axios.get("http://localhost:3001/users")
//       .then((res) => {
//         setUsers(res.data);
//       })
//       .catch((err) => {
//         console.error("Erreur lors de la récupération des utilisateurs :", err);
//       });
//   }, []);

//   const createUser = (e) => {
//     e.preventDefault();
//     Axios.post("http://localhost:3001/createUser", {
//       nom,
//       prenom,
//       age,
//       cin,
//       profession,
//       region,
//       province,
//       commune,
//       adresse,
//       telephone,
//       email,
//     })
//       .then((res) => {
//         alert("Utilisateur enregistré avec succès !");
//         setNom("");
//         setPrenom("");
//         setAge("");
//         setCIN("");
//         setProfession("");
//         setRegion("");
//         setProvince("");
//         setCommune("");
//         setAdresse("");
//         setTelephone("");
//         setEmail("");
//         setShowForm(false); // Hide form after submit
//       })
//       .catch((err) => {
//         console.error("Erreur lors de l'enregistrement :", err);
//         alert("Erreur lors de l'enregistrement.");
//       });
//   };

//   return (
//     <div className="form-container">
//       {/* Texte kbir o mzyan */}
//       <h1 className="main-title">
//         Bienvenue sur notre plateforme d'inscription
//       </h1>
//       <p className="description-text">
//         Remplissez ce formulaire pour rejoindre notre communauté et accéder à
//         tous les avantages. Votre inscription est simple, rapide et sécurisée.
//       </p>

//       {/* Bouton Inscription */}
//       {!showForm && (
//         <button
//           onClick={() => setShowForm(true)}
//           className="btn-inscription"
//           aria-label="Afficher formulaire d'inscription"
//         >
//           Inscription
//         </button>
//       )}

//       {/* Formulaire visible seulement si showForm = true */}
//       {showForm && (
//         <div className="form-wrapper">
//           <h2 className="form-title">Formulaire d'inscription</h2>
//           <form onSubmit={createUser} className="formulaire">
//             <div className="form-group">
//               <label>Nom / الإسم :</label>
//               <input
//                 type="text"
//                 value={nom}
//                 onChange={(e) => setNom(e.target.value)}
//                 required
//                 placeholder="Entrez votre nom"
//               />
//             </div>
//             <div className="form-group">
//               <label>Prénom / النسب :</label>
//               <input
//                 type="text"
//                 value={prenom}
//                 onChange={(e) => setPrenom(e.target.value)}
//                 required
//                 placeholder="Entrez votre prénom"
//               />
//             </div>
//             <div className="form-group">
//               <label>Age / العمر :</label>
//               <input
//                 type="number"
//                 value={age}
//                 onChange={(e) => setAge(e.target.value)}
//                 placeholder="Exemple : 30"
//               />
//             </div>
//             <div className="form-group">
//               <label>CIN / رقم البطاقة الوطنية للتعريف :</label>
//               <input
//                 type="text"
//                 value={cin}
//                 onChange={(e) => setCIN(e.target.value)}
//                 required
//                 placeholder="Exemple : AB123456"
//               />
//             </div>
//             <div className="form-group">
//               <label>Profession / المهنة :</label>
//               <input
//                 type="text"
//                 value={profession}
//                 onChange={(e) => setProfession(e.target.value)}
//                 placeholder="Votre profession"
//               />
//             </div>

//             <div className="form-group">
//               <label>Région / الجهة أو المنطقة :</label>
//               <input
//                 list="regions"
//                 value={region}
//                 onChange={(e) => setRegion(e.target.value)}
//                 placeholder="Sélectionnez une région"
//               />
//               <datalist id="regions">
//                 <option value="Région Marrakech-Asfi" />
//               </datalist>
//             </div>

//             <div className="form-group">
//               <label>Province / إقليم :</label>
//               <input
//                 list="provinces"
//                 value={province}
//                 onChange={(e) => setProvince(e.target.value)}
//                 placeholder="Sélectionnez une province"
//               />
//               <datalist id="provinces">
//                 <option value="Province de Marrakech" />
//                 <option value="Province d'Al Haouz" />
//                 <option value="Province de Chichaoua" />
//                 <option value="Province d'El Kelâa" />
//                 <option value="Province de Essaouira" />
//                 <option value="Province de Rehamna" />
//                 <option value="Province de Safi" />
//                 <option value="Province de Youssoufia" />
//               </datalist>
//             </div>

//             <div className="form-group">
//               <label>Commune / جماعة :</label>
//               <input
//                 list="communes"
//                 value={commune}
//                 onChange={(e) => setCommune(e.target.value)}
//                 placeholder="Sélectionnez une commune"
//               />
//               <datalist id="communes">
//                 <option value="Commune de Ménarra" />
//                 <option value="Commune de Gueliz" />
//                 <option value="Commune de Nakhil" />
//                 <option value="Commune de Médina" />
//                 <option value="Commune de Sidi Youssef" />
//                 <option value="Commune de Tassaltant" />
//                 <option value="Commune de Mechouar Kasba" />
//                 <option value="Commune de Al Ouidane" />
//                 <option value="Commune de Harbil" />
//                 <option value="Commune de Ouled-Hassoun" />
//                 <option value="Commune de Ouled-Dlim" />
//                 <option value="Commune de Souihla" />
//                 <option value="Commune de Sidi-Zouin" />
//                 <option value="Commune de Oudaya" />
//                 <option value="Commune de Saada" />
//                 <option value="Commune de mnabha" />
//                 <option value="Commune de Ouahat sidi brahim" />
//                 <option value="Commune de Agafay" />
//                 <option value="Commune de Ait-Imour" />
//                 <option value="Commune de Annakhil" />
//                 <option value="Commune de Tamansourt" />
//                 <option value="Commune de Amizmiz" />
//                 <option value="Commune de Tamaesloht" />
//                 <option value="Commune de Tahannaout" />
//                 <option value="Commune de Tamallalt" />
//                 <option value="Commune El Kelâa des Sraghna" />
//                 <option value="Commune de Smimou" />
//                 <option value="Commune de Essaouira" />
//                 <option value="Commune de Talmest" />
//                 <option value="Commune de Ben Guerir" />
//                 <option value="Commune de Skhour Rehamna" />
//                 <option value="Commune de Jorf Lasfar" />
//                 <option value="Commune de Sebt Gzoula" />
//                 <option value="Commune de Echemmaia" />
//               </datalist>
//             </div>

//             <div className="form-group full-width">
//               <label>Adresse / العنوان :</label>
//               <input
//                 type="text"
//                 value={adresse}
//                 onChange={(e) => setAdresse(e.target.value)}
//                 placeholder="Votre adresse complète"
//               />
//             </div>

//             <div className="form-group">
//               <label>Téléphone / رقم الهاتف :</label>
//               <input
//                 type="text"
//                 value={telephone}
//                 onChange={(e) => setTelephone(e.target.value)}
//                 placeholder="Exemple : +212 6XXXXXXXX"
//               />
//             </div>

//             <div className="form-group">
//               <label>Email / البريد الإلكتروني :</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="exemple@domaine.com"
//               />
//             </div>

//             <button type="submit" className="submit-button">
//               <span className="text">S'inscrire</span>
//             </button>
//           </form>
//           <footer className="footer">
//             <div className="footer-content">
//               <p>📧 Email: contact@notreplateforme.com</p>
//               <p>📞 Téléphone: +212 6 12 34 56 78</p>
//               <p>🏠 Adresse: 123 Rue de Casablanca, Marrakech, Maroc</p>
//               <p>
//                 Merci de votre confiance ! Notre plateforme est dédiée à vous
//                 offrir la meilleure expérience.
//               </p>
//             </div>
//           </footer>
//         </div>
//       )}
//     </div>
//   );
// };


// export default Register;
import React, { useState, useEffect } from "react";
import "./Register.css";
import Axios from "axios";

const Register = () => {
  const [users, setUsers] = useState([]);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [age, setAge] = useState("");
  const [cin, setCIN] = useState("");
  const [profession, setProfession] = useState("");
  const [region, setRegion] = useState("");
  const [province, setProvince] = useState("");
  const [commune, setCommune] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");

  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    Axios.get("http://localhost:3001/users")
      .then((res) => {
        setUsers(res.data);
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des utilisateurs :", err);
      });
  }, []);

  const createUser = (e) => {
    e.preventDefault();
    Axios.post("http://localhost:3001/createUser", {
      nom,
      prenom,
      age,
      cin,
      profession,
      region,
      province,
      commune,
      adresse,
      telephone,
      email,
    })
      .then((res) => {
        alert("Utilisateur enregistré avec succès !");
        setNom("");
        setPrenom("");
        setAge("");
        setCIN("");
        setProfession("");
        setRegion("");
        setProvince("");
        setCommune("");
        setAdresse("");
        setTelephone("");
        setEmail("");
        setShowForm(false);
      })
      .catch((err) => {
        console.error("Erreur lors de l'enregistrement :", err);
        alert("Erreur lors de l'enregistrement.");
      });
  };

  return (
    <div className="form-container">
      {/* Texte de bienvenue, visible uniquement si showForm est false */}
      {!showForm && (
        <>
          <h1 className="main-title">
            Bienvenue sur notre plateforme d'inscription
          </h1>
          <p className="description-text">
            Rejoignez une communauté dynamique et engagée en remplissant ce
            formulaire d'inscription. En devenant membre, vous accédez à un
            ensemble d'avantages exclusifs, adaptés à vos besoins et à votre
            région. 
          </p>
        </>
      )}

      {/* Bouton Inscription */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn-inscription"
          aria-label="Afficher formulaire d'inscription"
        >
          Inscription
        </button>
      )}

      {/* Formulaire visible seulement si showForm = true */}
      {showForm && (
        <div className="form-wrapper">
          <h2 className="form-title">Formulaire d'inscription</h2>
          <form onSubmit={createUser} className="formulaire">
            <div className="form-group">
              <label>Nom / الإسم :</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                placeholder="Entrez votre nom"
              />
            </div>
            <div className="form-group">
              <label>Prénom / النسب :</label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                placeholder="Entrez votre prénom"
              />
            </div>
            <div className="form-group">
              <label>Age / العمر :</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Exemple : 30"
              />
            </div>
            <div className="form-group">
              <label>CIN / رقم البطاقة الوطنية للتعريف :</label>
              <input
                type="text"
                value={cin}
                onChange={(e) => setCIN(e.target.value)}
                required
                placeholder="Exemple : AB123456"
              />
            </div>
            <div className="form-group">
              <label>Profession / المهنة :</label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Votre profession"
              />
            </div>

            <div className="form-group">
              <label>Région / الجهة أو المنطقة :</label>
              <input
                list="regions"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Sélectionnez une région"
              />
              <datalist id="regions">
                <option value="Région Marrakech-Asfi" />
              </datalist>
            </div>

            <div className="form-group">
              <label>Province / إقليم :</label>
              <input
                list="provinces"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="Sélectionnez une province"
              />
              <datalist id="provinces">
                <option value="Province de Marrakech" />
                <option value="Province d'Al Haouz" />
                <option value="Province de Chichaoua" />
                <option value="Province d'El Kelâa" />
                <option value="Province de Essaouira" />
                <option value="Province de Rehamna" />
                <option value="Province de Safi" />
                <option value="Province de Youssoufia" />
              </datalist>
            </div>

            <div className="form-group">
              <label>Commune / جماعة :</label>
              <input
                list="communes"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                placeholder="Sélectionnez une commune"
              />
              <datalist id="communes">
                {/* communes list... */}
                <option value="Commune de Ménarra" />
                <option value="Commune de Gueliz" />
                <option value="Commune de Nakhil" />
                <option value="Commune de Médina" />
                <option value="Commune de Sidi Youssef" />
                <option value="Commune de Tassaltant" />
                <option value="Commune de Mechouar Kasba" />
                <option value="Commune de Al Ouidane" />
                <option value="Commune de Harbil" />
                <option value="Commune de Ouled-Hassoun" />
                <option value="Commune de Ouled-Dlim" />
                <option value="Commune de Souihla" />
                <option value="Commune de Sidi-Zouin" />
                <option value="Commune de Oudaya" />
                <option value="Commune de Saada" />
                <option value="Commune de mnabha" />
                <option value="Commune de Ouahat sidi brahim" />
                <option value="Commune de Agafay" />
                <option value="Commune de Ait-Imour" />
                <option value="Commune de Annakhil" />
                <option value="Commune de Tamansourt" />
                <option value="Commune de Amizmiz" />
                <option value="Commune de Tamaesloht" />
                <option value="Commune de Tahannaout" />
                <option value="Commune de Tamallalt" />
                <option value="Commune El Kelâa des Sraghna" />
                <option value="Commune de Smimou" />
                <option value="Commune de Essaouira" />
                <option value="Commune de Talmest" />
                <option value="Commune de Ben Guerir" />
                <option value="Commune de Skhour Rehamna" />
                <option value="Commune de Jorf Lasfar" />
                <option value="Commune de Sebt Gzoula" />
                <option value="Commune de Echemmaia" />
              </datalist>
            </div>

            <div className="form-group full-width">
              <label>Adresse / العنوان :</label>
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Votre adresse complète"
              />
            </div>

            <div className="form-group">
              <label>Téléphone / رقم الهاتف :</label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Exemple : +212 6XXXXXXXX"
              />
            </div>

            <div className="form-group">
              <label>Email / البريد الإلكتروني :</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemple@domaine.com"
              />
            </div>

            <button type="submit" className="submit-button">
              <span className="text">S'inscrire</span>
            </button>
          </form>
          <footer className="footer">
            <div className="footer-content">
              <p>📧 Email: contact@notreplateforme.com</p>
              <p>📞 Téléphone: +212 6 12 34 56 78</p>
              <p>🏠 Adresse: 123 Rue de Casablanca, Marrakech, Maroc</p>
              <p>
                Merci de votre confiance ! Notre plateforme est dédiée à vous
                offrir la meilleure expérience.
              </p>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
};

export default Register;
