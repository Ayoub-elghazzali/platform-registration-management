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
import ProtectedRoute from "./security/ProtectedRoute";
import SessionBar from "./security/SessionBar";
import "./index.css";

function Guard({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <>
      <SessionBar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Register />} />
        <Route path="/dashboardGeneral" element={<Guard roles={["SUPER_ADMIN", "ADMIN"]}><DashboardGeneral /></Guard>} />
        <Route path="/dashboard" element={<Guard roles={["SUPER_ADMIN", "ADMIN"]}><Dashboard /></Guard>} />
        <Route path="/dashboardRegional" element={<Guard roles={["REGIONAL_ADMIN"]}><DashboardRegional /></Guard>} />
        <Route path="/DirectorRegional" element={<Guard roles={["REGIONAL_ADMIN"]}><DirectorRegional /></Guard>} />
        <Route path="/PresidentProvincial" element={<Guard roles={["PROVINCIAL_ADMIN"]}><PresidentProvincial /></Guard>} />
        <Route path="/DirectorProvincial" element={<Guard roles={["PROVINCIAL_ADMIN"]}><DirectorProvincial /></Guard>} />
        <Route path="/provinceStats" element={<Guard roles={["SUPER_ADMIN", "ADMIN", "REGIONAL_ADMIN", "PROVINCIAL_ADMIN"]}><ProvinceStats /></Guard>} />
      </Routes>
    </>
  );
}
