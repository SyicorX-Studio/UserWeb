import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 780);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef(null);
  const cardRef = useRef(null);

  // Tilt motion values
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const [isHovering, setIsHovering] = useState(false);

  // 监听窗口变化
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 780);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 鼠标悬停时启用 Tilt
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (e.clientY - centerY) / (rect.height / 2);
      tiltX.set(offsetY * -15);
      tiltY.set(offsetX * 20);
      setIsHovering(true);
    };
    const handleMouseLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
      setIsHovering(false);
    };
    const btn = buttonRef.current;
    if (btn) {
      btn.addEventListener('mousemove', handleMouseMove);
      btn.addEventListener('mouseleave', handleMouseLeave);
    }
    return () => {
      if (btn) {
        btn.removeEventListener('mousemove', handleMouseMove);
        btn.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [tiltX, tiltY]);

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

  // 逐字浮现辅助
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
        {/* 产品名称 */}
        <h2 className="product-name">
          {renderTypingText(product.name, 0)}
        </h2>

        {/* 产品描述 */}
        <div className="description-content">
          <div className="description-text">
            {renderTypingText(product.description, 0.3)}
          </div>
        </div>

        {/* “立即查看” 按钮：淡入 + 向上浮动 + 3D Tilt + 固定 skewX */}
        <motion.button
          ref={buttonRef}
          className="glow-button"
          onClick={() => {
            setIsModalOpen(true);
            if (onOpenModal) onOpenModal(product);
          }}
          // 淡入 + 向上浮动
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
          // Tilt 3D 倾斜 + 固定 skewX(-10deg) + 悬停放大
          style={{
            rotateX: tiltX,
            rotateY: tiltY,
            skewX: '-10deg',
            scale: isHovering ? 1.05 : 1,
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
