import React, { useEffect, useRef, useState } from 'react';
import './Home.css';

function Home() {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      const height = window.innerHeight;
      const newPage = Math.round(scrollTop / height);
      setCurrentPage(newPage);
    }
  };

  useEffect(() => {
    const ref = containerRef.current;
    if (ref) {
      ref.addEventListener('scroll', handleScroll);
      return () => ref.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="home-wrapper" ref={containerRef}>
      {/* 第一页 */}
      <section className="home-section">
        <div className="home-title-area">
          <img
            src={require('../title.svg').default}
            alt="title"
            className="home-title-img"
          />
          <h3 className="home-subtitle">视觉造梦，设计为你而生</h3>
        </div>
        <div
          className={`home-box-image ${currentPage === 1 ? 'box-hide' : ''}`}
        >
          <img src="/glass_box.png" alt="box" />
        </div>
      </section>

      {/* 第二页 - 留空 */}
      <section className="home-section">
        {/* 预留产品展示页面 */}
      </section>

      {/* 右侧滚动指示器 */}
      <div className="home-dot-indicator">
        <div className={`home-dot ${currentPage === 0 ? 'active' : ''}`} />
        <div className={`home-dot ${currentPage === 1 ? 'active' : ''}`} />
      </div>
    </div>
  );
}

export default Home;