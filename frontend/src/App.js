import React, { useState, createContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/login';
import MindEaseHome from './components/home';
import SurveyPage from './components/survey';
import MedicalSupport from './components/medical';
import Dashboard from './components/profile';
import MindEaseChat from './components/chatbot';
import PrescriptionPage from './components/prescripton';
import MedicineCartPage from './components/medicinecart';
import AdminPage from './components/adminpage';
import DoctorPage from './components/doctorpage';
import './App.css';

/* ─── Global Theme Context ──────────────────────────────────────── */
export const ThemeContext = createContext();

function App() {
  const [themeKey, setThemeKey] = useState("blue");

  return (
    <ThemeContext.Provider value={{ themeKey, setThemeKey }}>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<MindEaseHome />} />
          <Route path="/survey" element={<SurveyPage />} />
          <Route path="/medical" element={<MedicalSupport />} />
          <Route path="/profile" element={<Dashboard />} />
          <Route path="/chatbot" element={<MindEaseChat />} />
          <Route path="/prescription" element={<PrescriptionPage />} />
          <Route path="/medicinecart" element={<MedicineCartPage />} />
          <Route path="/adminpage" element={<AdminPage />} />
          <Route path="/doctorpage" element={<DoctorPage />} />
        </Routes>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
