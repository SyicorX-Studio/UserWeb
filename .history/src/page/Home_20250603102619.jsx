import React, { useEffect, useState, useRef } from 'react';
import './Home.css';

const Home = () => {
  // 用来保存滚动进度：0 表示第一页顶部，1 表示滚到第二页顶部
  const [scrollProgress, setScrollProgress] = useState(0);
  // 用来判断当前激活的是第几页（0 或 1）
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const scrollY = containerRef.current.scrollTop;
      const vh = window.innerHeight;
      // 计算进度（取值范围 0~1）
      const progress = Math.min(Math.max(scrollY / vh, 0), 1);
      setScrollProgress(progress);

      // 根据滚动位置判断当前页（当滚动超过 50% 的时候，认为进入第二页）
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

  // 根据 scrollProgress 计算 box 的样式：向上平移并逐渐透明
  const boxStyle = {
    transform: `translateY(-${scrollProgress * 100}%)`,
    opacity: `${1 - scrollProgress}`,
  };

  return (
    <div className="home-container" ref={containerRef}>
      {/* 第一页 */}
      <section className="home-section first-page">
        <div className="home-title">
          {/* 中间靠上显示的 title 图 */}
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

      {/* 第二页（目前留空，仅用来撑起一页高度） */}
      <section className="home-section second-page">
        {/* 这里可以以后填充产品展示等内容 */}
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
