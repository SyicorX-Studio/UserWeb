import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ProductModal from './ProductModal';
import ModelViewer from './ModelViewer';
import './ProductCard.css';

/**
 * 产品卡片组件
 * @param {Object} props
 * @param {Object} props.product - 产品数据
 * @param {Function} props.onOpenModal - 打开模态框回调
 */
function ProductCard({ product, onOpenModal }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, hover: false });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 780);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false); // 是否进入视口
  const buttonRef = useRef(null);
  const cardRef = useRef(null);

  // 监听窗口宽度，判断移动端
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 780);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 3D 倾斜 + 悬停放大效果
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (e.clientY - centerY) / (rect.height / 2);
      setTilt({
        x: offsetY * -15,
        y: offsetX * 20,
        hover: true
      });
    };
    const handleMouseLeave = () => {
      setTilt({ x: 0, y: 0, hover: false });
    };
    const ref = buttonRef.current;
    if (ref) {
      ref.addEventListener('mousemove', handleMouseMove);
      ref.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (ref) {
        ref.removeEventListener('mousemove', handleMouseMove);
        ref.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  // IntersectionObserver：当卡片进入视口时触发动画
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    if (cardRef.current) {
      observer.observe(cardRef.current);
    }
    return () => observer.disconnect();
  }, []);

  // 逐字浮现文本助手
  const renderTypingText = (text, baseDelay = 0) => {
    return text.split('').map((char, idx) => (
      <motion.span
        key={idx}
        initial={{ opacity: 0, y: 10 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
        transition={{
          delay: baseDelay + idx * 0.04,
          duration: 0.25,
          ease: 'easeOut'
        }}
        style={{ display: char === '\n' ? 'block' : 'inline-block' }}
      >
        {char === '\n' ? <br /> : char}
      </motion.span>
    ));
  };

  return (
    <div className="product-card" ref={cardRef}>
      <div className="card-content">
        {/* 产品名称：逐字浮现，延迟 0s */}
        <h2 className="product-name">
          {renderTypingText(product.name, 0)}
        </h2>

        {/* 产品描述：逐字浮现，延迟 0.3s */}
        <div className="description-content">
          <div className="description-text">
            {renderTypingText(product.description, 0.3)}
          </div>
        </div>

        {/* “立即查看” 按钮：淡入 + 向上浮动 + 3D 倾斜悬停 */}
        <motion.button
          ref={buttonRef}
          className="glow-button"
          onClick={() => {
            setIsModalOpen(true);
            if (onOpenModal) onOpenModal(product);
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
          style={{
            transform: `
              perspective(1000px)
              rotateX(${tilt.x}deg)
              rotateY(${tilt.y}deg)
              scale(${tilt.hover ? 1.05 : 1})
            `,
            transition: 'transform 0.1s ease-out',
            transformStyle: 'preserve-3d'
          }}
        >
          立即查看 &gt;
        </motion.button>
      </div>

      <div className="preview-container">
        <ModelViewer fileUrl={product.image} />
      </div>

      {/* 模态框 */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </div>
  );
}

export default ProductCard;
