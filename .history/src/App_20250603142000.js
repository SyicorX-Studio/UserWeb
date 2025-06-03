import logo from './logo.svg';
import './App.css';
import NavBar from './NavBar';
import SpeedLines3D from './SpeedLines3D';
import GlassBottleViewer from './GlassBottleViewer';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React from 'react';
import Home from './page/Home';

function About() {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '2rem' }}>
      关于我们页面内容
    </div>
  );
}

function App() {
  return (
    <Router>
        <SpeedLines3D />
      <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
    </Router>
  );
}

export default App;
