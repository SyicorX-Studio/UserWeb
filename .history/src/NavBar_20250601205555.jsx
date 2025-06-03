import React, { useState } from 'react';
import logo from './logo.svg';
import './NavBar.css';

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <img src={logo} alt="Logo" />
      </div>
      <div className={`navbar-links${menuOpen ? ' open' : ''}`}>
        <a href="/">首页</a>
        <a href="/about">关于我们</a>
      </div>
      <div className="navbar-menu-icon" onClick={() => setMenuOpen(!menuOpen)}>
        <div className="bar"></div>
        <div className="bar"></div>
        <div className="bar"></div>
      </div>
    </nav>
  );
};

export default NavBar;