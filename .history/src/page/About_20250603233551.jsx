import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './About.css';

export default function About() {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef(null);

  // 当组件挂载或第一次进入视口时，触发动画
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) {
      io.observe(containerRef.current);
    }
    return () => io.disconnect();
  }, []);

  // 逐字浮现辅助
  const renderTypingText = (text, baseDelay = 0) => {
    return text.split('').map((char, idx) => (
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{
          delay: baseDelay + idx * 0.05,
          duration: 0.25,
          ease: 'easeOut'
        }}
        style={{ display: char === '\n' ? 'block' : 'inline-block' }}
      >
        {char === '\n' ? <br /> : char}
      </motion.span>
    ));
  };

  // 大字幕和联系方式文字
  const mainText = '视觉造梦，设计为你而生';
  const contactText = '联系电话：xxxxxxxxxxx\n地址：四川城市职业学院';

  return (
    <div className="about-container" ref={containerRef}>
      <div className="text-content">
        {/* 大字幕：逐字浮现，延迟 0s */}
        <h1 className="main-title">
          {renderTypingText(mainText, 0)}
        </h1>

        {/* 联系方式：逐字浮现，延迟 0.1s */}
        <div className="contact-info">
          {renderTypingText(contactText, 0.1)}
        </div>
      </div>

      {/* 底部 title 图片 */}
      <div className="bottom-title">
        <motion.img
          src={require('../title.svg').default}
          alt="title"
          className="about-title-image"
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
