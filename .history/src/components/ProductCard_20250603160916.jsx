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

  // 鼠标移动时 3D 倾斜效果
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
    <div className="product-card">
      <div className="card-content">
        {/* 产品名称 */}
        <motion.h2
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={0.3}
        >
          {product.name}
        </motion.h2>

        {/* 移动端“展开介绍”按钮 */}
        {isMobile && (
          <motion.button
            className="expand-button"
            onClick={() => {
              setIsModalOpen(true);
              if (onOpenModal) onOpenModal(product);
            }}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0.6}
          >
            展开介绍
          </motion.button>
        )}

        {/* 描述文本 */}
        <div className="description-content">
          <motion.div
            className="description-text"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={0.9}
          >
            {product.description.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </motion.div>
        </div>

        {/* “立即查看” 按钮 */}
        <motion.button
          ref={buttonRef}
          className="glow-button"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) skew(-10deg) scale(${tilt.hover ? 1.05 : 1})`,
            transition: 'transform 0.1s ease-out',
            transformStyle: 'preserve-3d'
          }}
          onClick={() => onOpenModal(product)}
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          custom={1.2}
        >
          立即查看 &gt;
        </motion.button>
      </div>

      {/* 预览图片区域 */}
      <motion.div
        className="preview-container"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
        custom={1.5}
      >
        <motion.img
          src={product.image}
          alt={product.name}
          className="preview-image"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        />
      </motion.div>

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
