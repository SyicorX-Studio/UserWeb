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

  // 标题图片的浮现动画配置
  const imgVariant = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { delay: 0.2, duration: 0.6, ease: 'easeOut' }
    }
  };

  // 逐字浮现文本的函数
  const renderTypingText = (text, baseDelay = 0) => {
    return text.split('').map((char, idx) => (
      <motion.span
        key={idx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: baseDelay + idx * 0.05,
          duration: 0.2,
          ease: 'linear'
        }}
        style={{ display: char === '\n' ? 'block' : 'inline-block', color: '视觉设计'.split('').includes(char) ? '#00ff00' : 'white' }}
      >
        {char === '\n' ? <br /> : char}
      </motion.span>
    ));
  };

  return (
    <div className="home-container" ref={containerRef}>
      {/* 第一页 */}
      <section className="home-section first-page">
        <div className="home-title">
          {/* title 图片浮现 */}
          <motion.img
            src={require('../title.svg').default}
            alt="title"
            className="title-image"
            variants={imgVariant}
            initial="hidden"
            animate="visible"
          />
          {/* 标语逐字浮现（基准延迟 0.5s） */}
          <h3 className="home-slogan">
            {renderTypingText('视觉造梦，设计为你而生', 0.5)}
          </h3>
        </div>

        {/* 底部略微溢出屏幕的 box 图片 */}
        <div className="box-image-wrapper" style={boxStyle}>
          <img
            src="/glass_box.png"
            alt="底部 Box"
            className="box-image"
          />
        </div>
      </section>

      {/* 第二页：产品滑块 */}
      <section className="home-section second-page">
        <ProductSlider products={[
          {
            id: 1,
            name: '简冷',
            description: '简冷X冷得刚刚好！\n双半导体冷却\n20W快充热插拔电池设计\n为Furry用户量身打造的随身空调',
            image: '/models/jianleng.glb',
            url: 'https://detail.tmall.com/item.htm?detail_redpacket_pop=true&fpChannel=101&fpChannelSig=68a42336a2d162261be0fb09491387d4ecc467d7&id=916356563102&ltk2=17489491374043anhfjrryg5em5mc2w3si&ns=1&priceTId=213e06de17489491310793233e20d6&query=%E6%89%8B%E6%8C%81%E9%A3%8E%E6%89%87&skuId=5791341957615&spm=a21n57.1.hoverItem.1&u_channel=bybtqdyh&umpChannel=bybtqdyh&utparam=%7B%22aplus_abtest%22%3A%22521feee4932a70ef0f701e4bed103513%22%7D&xxc=ad_ztc'
          },
          {
            id: 2,
            name: 'FLOX',
            description: '宿舍空气净化器\n也是一盏台灯、一个充电宝\n一小时不断电\n是宿舍的救命神器',
            image: '/models/FLOX.glb',
            url: 'https://detail.tmall.com/item.htm?detail_redpacket_pop=true&id=834104649978&ltk2=1748950179201clhr532v0hcc7c7pt6mlo&ns=1&priceTId=2150425e17489501739402154e1a67&query=%E6%B2%B9%E7%83%9F%E6%9C%BA&skuId=5581960972913&spm=a21n57.1.hoverItem.2&utparam=%7B%22aplus_abtest%22%3A%221031998f2e2ac5cbab452c8b6949c6c1%22%7D&xxc=ad_ztc'
          },
          {
            id: 3,
            name: 'NIVA',
            description: '不止五分钟出冰\n还能制热供水\n智能联动\n视觉至上的桌面水温魔方',
            image: '/models/NIVA.glb',
            url: 'https://detail.tmall.com/item.htm?priceTId=2150446017489502202358916e1c9c&utparam=%7B%22aplus_abtest%22%3A%2234818ccc5a8bd5fef82bbcad2568451f%22%7D&id=806919740337&ns=1&detail_redpacket_pop=true&query=%E5%88%B6%E5%86%B0%E6%9C%BA&xxc=ad_ztc&skuId=5484197516305&spm=a21n57.1.hoverItem.7&ltk2=1748950228574ocj4qt62vx0sikdrjygg9'
          },
          {
            id: 4,
            name: 'VEYA',
            description: '你的第二双眼\n夜视拍摄、信息投影、遥控操控\n2k画质\n让现实层层展开',
            image: '/models/AR.glb',
            url: 'https://detail.tmall.com/item.htm?priceTId=2150446017489502202358916e1c9c&utparam=%7B%22aplus_abtest%22%3A%2234818ccc5a8bd5fef82bbcad2568451f%22%7D&id=806919740337&ns=1&detail_redpacket_pop=true&query=%E5%88%B6%E5%86%B0%E6%9C%BA&xxc=ad_ztc&skuId=5484197516305&spm=a21n57.1.hoverItem.7&ltk2=1748950228574ocj4qt62vx0sikdrjygg9'
          }
        ]} onOpenModal={() => {}} />
      </section>

      {/* 页码指示器 */}
      <motion.div
        className="page-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <div className={`dot ${currentPage === 0 ? 'active' : ''}`}></div>
        <div className={`dot ${currentPage === 1 ? 'active' : ''}`}></div>
      </motion.div>
    </div>
  );
}

export default Home;
