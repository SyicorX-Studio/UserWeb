import React, { useEffect, useState, useRef } from 'react';
import './Home.css';

const Home = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollY = containerRef.current.scrollTop;
      const vh = window.innerHeight;
      const progress = Math.min(Math.max(scrollY / vh, 0), 1);
      setScrollProgress(progress);

      if (progress >= 0.5) {
        setCurrentPage(1);
      } else {
        setCurrentPage(0);
      }
    };

    const dom = containerRef.current;
    dom.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      dom.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const boxStyle = {
    transform: `translateY(-${scrollProgress * 100}%)`,
    opacity: `${1 - scrollProgress}`,
  };

  return (
    <div className="home-container" ref={containerRef}>
      {/* 第一页 */}
      <section className="home-section first-page">
        <div className="home-title">
          <img
            src={require('../title.svg').default}
            alt="title"
            className="title-image"
          />
          <h3 className="home-slogan">视觉造梦，设计为你而生</h3>
        </div>

        {/* 底部的 box 图片 */}
        <div className="box-image-wrapper" style={boxStyle}>
          <img
            src="/glass_box.png"
            alt="底部 Box"
            className="box-image"
          />
        </div>
      </section>

      {/* 第二页（目前留空） */}
      <section className="home-section second-page">  <div className="product-slider-wrapper">
        <ProductSlider products={products} onOpenModal={openModal} />
      </div>
      </section>

      {/* 右侧的页码指示器 */}
      <div className="page-indicator">
        <div className={`dot ${currentPage === 0 ? 'active' : ''}`}></div>
        <div className={`dot ${currentPage === 1 ? 'active' : ''}`}></div>
      </div>
    </div>
  );
};

export default Home;
