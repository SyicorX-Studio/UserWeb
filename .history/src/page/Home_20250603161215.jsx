import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import ProductSlider from '../components/ProductSlider';
import './Home.css';

function Home() {
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
      setCurrentPage(progress >= 0.5 ? 1 : 0);
    };
    const dom = containerRef.current;
    dom.addEventListener('scroll', handleScroll, { passive: true });
    return () => dom.removeEventListener('scroll', handleScroll);
  }, []);

  const boxStyle = {
    transform: `translateY(-${scrollProgress * 30}%) translateX(-50%)`,
    opacity: `${1 - scrollProgress}`,
  };

  // 产品数据示例
  const products = [
    {
      id: 1,
      name: '简冷',
      description: '简冷X冷得刚刚好！\n双半导体冷却\n20W快充热插拔电池设计\n为Furry用户量身打造的随身空调',
      image: '/glass_box.png',
    },
    {
      id: 2,
      name: '速凉',
      description: '极速降温体验\n创新风道设计\n静音夜间模式\n适合各种场景的智能散热方案',
      image: '/cooling_device.png',
    },
  ];

  const openModal = (product) => {
    console.log('打开模态框，产品：', product);
  };

  // variants：容器让子元素逐字 stagger
  const container = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  const child = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  // 将“视觉造梦，设计为你而生”拆成单字数组
  const titleText = '视觉造梦，设计为你而生'.split('');

  return (
    <div className="home-container" ref={containerRef}>
      {/* 第一页 */}
      <section className="home-section first-page">
        <div className="home-title">
          {/* title 图片 */}
          <img
            src={require('../title.svg').default}
            alt="title"
            className="title-image"
          />

          {/* 标语：逐字淡入 */}
          <motion.div
            className="home-slogan"
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {titleText.map((char, index) => (
              <motion.span key={index} variants={child}>
                {char}
              </motion.span>
            ))}
          </motion.div>
        </div>

        {/* 底部 box 图片（不做淡入） */}
        <div className="box-image-wrapper" style={boxStyle}>
          <img src="/glass_box.png" alt="底部 Box" className="box-image" />
        </div>
      </section>

      {/* 第二页：产品滑块 */}
      <section className="home-section second-page">
        <ProductSlider products={products} onOpenModal={openModal} />
      </section>

      {/* 右侧整体页面翻屏指示器（简单淡入一次） */}
      <motion.div
        className="page-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
      >
        <div className={`dot ${currentPage === 0 ? 'active' : ''}`}></div>
        <div className={`dot ${currentPage === 1 ? 'active' : ''}`}></div>
      </motion.div>
    </div>
  );
}

export default Home;
