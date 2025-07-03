import React from "react";
import { Routes, Route } from "react-router-dom";

import DashboardGeneral from "./Pages/DashboardGeneral";
import DashboardRegional from "./Pages/DashboardRegional";

import Login from "./Pages/Login";
import Register from "./Pages/Register";
import Dashboard from "./Pages/Dashboard";
import DirectorRegional from "./Pages/DirectorRegional";

import DirectorProvincial from "./Pages/DirectorProvincial";
import PresidentProvincial from "./Pages/PresidentProvincial";
import ProvinceStats from "./Pages/ProvinceStats";

import "./index.css";
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Register />} />
      <Route path="/dashboardGeneral" element={<DashboardGeneral />} />
      <Route path="/dashboard" element={<Dashboard />} />{" "}
      <Route path="/dashboardRegional" element={<DashboardRegional />} />
      <Route path="/DirectorRegional" element={<DirectorRegional />} />
      <Route path="/PresidentProvincial" element={<PresidentProvincial />} />
      <Route path="/DirectorProvincial" element={<DirectorProvincial />} />
      <Route path="/provinceStats" element={<ProvinceStats />} />
    </Routes>
  );
}

export default App;
