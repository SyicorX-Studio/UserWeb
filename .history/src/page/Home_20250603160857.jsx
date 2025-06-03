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

  // 示例产品数据
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
    // …可以继续添加更多…
  ];

  const openModal = (product) => {
    console.log('打开模态框，产品：', product);
  };

  // 公共的 fadeIn 变种
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.3,
        duration: 0.6,
        ease: 'easeOut'
      }
    })
  };

  return (
    <div className="home-container" ref={containerRef}>
      {/* 第一页 */}
      <section className="home-section first-page">
        <div className="home-title">
          {/* title 图片 */}
          <motion.img
            src={require('../title.svg').default}
            alt="title"
            className="title-image"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0.5}
          />
          {/* 标语 */}
          <motion.h3
            className="home-slogan"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0.8}
          >
            视觉造梦，设计为你而生
          </motion.h3>
        </div>

        {/* 底部略微溢出屏幕的 box 图片 */}
        <div className="box-image-wrapper" style={boxStyle}>
          <motion.img
            src="/glass_box.png"
            alt="底部 Box"
            className="box-image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
        </div>
      </section>

      {/* 第二页：产品滑块 */}
      <section className="home-section second-page">
        <ProductSlider products={products} onOpenModal={openModal} />
      </section>

      {/* 右侧整体页面翻屏指示器 */}
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
