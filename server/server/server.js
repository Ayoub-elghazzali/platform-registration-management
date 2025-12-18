require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

app.use(cors());
app.use(express.json());

const DEFAULT_MONGO_URI =
  "mongodb+srv://fatima:d3TCUhfPngRDfryY@cluster0.iksgczs.mongodb.net/application";
const FALLBACK_LOCAL_URI =
  process.env.MONGODB_FALLBACK_URI || "mongodb://127.0.0.1:27017/application";

const mongoUris = [process.env.MONGODB_URI || DEFAULT_MONGO_URI];
if (!mongoUris.includes(FALLBACK_LOCAL_URI)) {
  mongoUris.push(FALLBACK_LOCAL_URI);
}

async function connectToDatabase() {
  let lastError = null;
  for (const uri of mongoUris) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ Connecté à MongoDB (${uri})`);
      return;
    } catch (error) {
      lastError = error;
      console.error(`❌ Échec de connexion à ${uri}:`, error.message);
    }
  }

  throw lastError;
}

const userSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  age: Number,
  cin: String,
  profession: String,
  region: String,
  province: String,
  commune: String,
  adresse: String,
  telephone: String,
  email: String,
  status: { type: String, default: "en attente" },
  validatedByDirectorRegional: { type: Boolean, default: false },
});

const User = mongoose.model("User", userSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String,
  province: String, // الولاية أو المقاطعة التي ينتمي إليها
});
const Admin = mongoose.model("Admin", adminSchema);

// Routes
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({});
    console.log("Nombre total d'utilisateurs:", users.length); // هنا
    res.json(users);
  } catch (error) {
    console.error("Erreur dans /users:", error);
    res.status(500).send("Erreur serveur");
  }
});

// إنشاء مستخدم جديد
app.post("/createUser", async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json({ success: true, message: "Utilisateur enregistré avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// إنشاء admin جديد
app.post("/addAdmin", async (req, res) => {
  try {
    const { username, password, role, province } = req.body;
    const newAdmin = new Admin({ username, password, role, province });
    await newAdmin.save();
    res.json({ success: true, message: "Admin ajouté avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// تسجيل دخول admin
app.post("/loginAdmin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });
    if (admin) {
      res.json({
        success: true,
        role: admin.role,
        province: admin.province,
      });
    } else {
      res.json({
        success: false,
        message: "Nom d'utilisateur ou mot de passe incorrect.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/users/:province", async (req, res) => {
  try {
    const inputProvince = req.params.province.trim();
    const regex = new RegExp(inputProvince, "i");
    const users = await User.find({ province: regex });
    res.json(users);
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur du serveur" });
  }
});

// API لتحديث حالة مستخدم (status)
app.post("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// code
app.delete("/deleteAdmin/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const deleted = await Admin.findOneAndDelete({ username });

    if (!deleted) {
      return res.json({ message: "❌ Aucun admin trouvé avec ce nom." });
    }

    res.json({ message: "✅ Admin supprimé." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression." });
  }
});

// 🔄 Récupérer tous les admins
app.get("/admins", async (req, res) => {
  try {
    const admins = await Admin.find();
    if (!admins || admins.length === 0) {
      return res.json([]);
    }
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération." });
  }
});
//1

// 📌 Schéma pour les champs personnalisés (province / commune)
const FieldSchema = new mongoose.Schema({
  type: String, // "province" ou "commune"
  name: String, // Le nom entré par l’admin général
});

const Field = mongoose.model("Field", FieldSchema);

// ✅ Route POST pour ajouter un champ
app.post("/addField", async (req, res) => {
  const { type, name } = req.body;

  if (!type || !name) {
    return res.status(400).json({ message: "Champs invalides" });
  }

  try {
    // Vérifie s’il existe déjà
    const exists = await Field.findOne({ type, name });
    if (exists) {
      return res.status(400).json({ message: `${type} déjà existant.` });
    }

    const newField = new Field({ type, name });
    await newField.save();

    res.json({ message: `${type} ajouté avec succès.` });
  } catch (error) {
    console.error("Erreur backend :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//

app.post("/validateDecision/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { validatedByDirectorRegional: true },
      { new: true }
    );

    console.log("✅ Utilisateur mis à jour:", user); // أضف هذا السطر

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({ message: "Utilisateur validé avec succès", user });
  } catch (error) {
    console.error("Erreur lors de la validation:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//1

//2
app.get("/acceptedUsers", async (req, res) => {
  try {
    const users = await User.find({ status: "accepté" }); // بدون فيلتر على المقاطعة
    console.log("👀 Utilisateurs retournés:", users); // أضف هذا السطر
    res.json(users);
  } catch (error) {
    console.error("Erreur récupération:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//
// في ملف server.js أو أي ملف فيه تعريف الروتات
app.get("/finalAccepted", async (req, res) => {
  try {
    const users = await User.find({ validatedByDirectorRegional: true });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
//



// Nouvelle route : statistiques par province
app.get("/stats/provinces", async (req, res) => {
  try {
    const users = await User.find(); // récupère tous les utilisateurs

    // Regrouper les utilisateurs par province
    const stats = {};

    users.forEach((user) => {
      const province = (user.province || "Inconnue").trim();

      if (!stats[province]) {
        stats[province] = {
          total: 0,
          accepted: 0,
          refused: 0,
          pending: 0,
        };
      }

      stats[province].total++;

      const status = (user.status || "").toLowerCase().trim();
      if (status === "accepted" || status === "accepté") stats[province].accepted++;
      else if (status === "refused" || status === "refusé") stats[province].refused++;
      else stats[province].pending++;
    });

    res.json(stats);
  } catch (error) {
    console.error("Erreur stats:", error);
    res.status(500).json({ error: "Erreur lors du calcul des statistiques" });
  }
});
const nodemailer = require("nodemailer");

// Configure ton transporter SMTP (ex: Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ton.email@gmail.com",
    pass: "ton-mot-de-passe-ou-app-password",
  },
});

// Fonction pour envoyer email
const sendBadgeEmail = (email, userName) => {
  const mailOptions = {
    from: '"MonApp" <ton.email@gmail.com>',
    to: email,
    subject: "Votre badge d'acceptation",
    text: `Bonjour ${userName},\n\nFélicitations, votre inscription a été acceptée.\nVoici votre badge d'acceptation.\n\nCordialement,\nL'équipe MonApp`,
    // Tu peux ajouter un fichier joint ici
    // attachments: [{ filename: "badge.png", path: "./path/to/badge.png" }]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Erreur envoi mail :", error);
    } else {
      console.log("Email envoyé :", info.response);
    }
  });
};

app.get("/", (req, res) => {
  res.send("Server OK");
});

// تشغيل السيرفر (après connexion réussie à MongoDB)
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await connectToDatabase();
    app.listen(PORT, () => {
      console.log(`✅ Serveur fonctionne sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "⛔ Impossible de démarrer le serveur sans base de données. Vérifiez la connexion MongoDB."
    );
    process.exit(1);
  }
};

startServer();
