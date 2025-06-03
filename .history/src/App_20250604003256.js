import logo from './logo.svg';
import './App.css';
import NavBar from './NavBar';
import SpeedLines3D from './SpeedLines3D';
import GlassBottleViewer from './GlassBottleViewer';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import Home from './page/Home';
import About from './page/About';
function App() {
  return (
    <Router>
        <SpeedLines3D />
      <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Router>
  );
}

export default App;
