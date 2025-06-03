import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal';
import '../page/Home.css';
import { motion } from 'framer-motion';

/**
 * 产品卡片组件
 */
function ProductCard({ product, onOpenModal }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, hover: false });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 780);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const buttonRef = React.useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 780);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 按钮 3D 倾斜效果
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!buttonRef.current) return;
      const element = buttonRef.current;
      const rect = element.getBoundingClientRect();
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

  // 逐字浮现文本函数
  const renderTypingText = (text, baseDelay = 0) => {
    return text.split('').map((char, idx) => (
      <motion.span
        key={idx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: baseDelay + idx * 0.03,
          duration: 0.15,
          ease: 'linear'
        }}
        style={{ display: char === '\n' ? 'block' : 'inline-block' }}
      >
        {char === '\n' ? <br /> : char}
      </motion.span>
    ));
  };

  return (
    <div className="product-card">
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

        {/* “立即查看” 按钮：浮现动画，延迟 0.6s */}
        <motion.button
          ref={buttonRef}
          className="glow-button"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) skew(-10deg) scale(${tilt.hover ? 1.05 : 1})`,
            transition: 'transform 0.1s ease-out',
            transformStyle: 'preserve-3d'
          }}
          onClick={() => onOpenModal(product)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
        >
          立即查看 &gt;
        </motion.button>
      </div>

      <div className="preview-container">
        <img src={product.image} alt={product.name} className="preview-image" />
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
