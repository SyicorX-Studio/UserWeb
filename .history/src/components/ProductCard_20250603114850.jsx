import React, { useState, useEffect } from 'react';
import ProductModal from './ProductModal';
import './ProductCard.css';

/**
 * 产品卡片组件
 * @param {Object} props - 组件属性
 * @param {Object} props.product - 产品数据对象
 * @param {string} props.product.name - 产品名称
 * @param {string} props.product.description - 产品描述
 * @param {string} props.product.image - 图片路径
 * @param {Function} props.onOpenModal - 打开模态框的回调函数
 * @returns {React.Component} 产品卡片组件
 */
function ProductCard({ product, onOpenModal }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, hover: false });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 780);
  const buttonRef = React.useRef(null);

  // 添加模态框状态管理
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 780);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 按钮3D倾斜效果
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

  return (
    <div className="product-card">
      <div className="card-content">
        <h2>{product.name}</h2>

        {/* 移动端按钮改为打开弹窗 */}
        {isMobile && (
          <button
            className="expand-button"
            onClick={() => {
              // 优先使用本地状态管理
              setIsModalOpen(true)
              // 保留原有回调兼容性
              if (onOpenModal) onOpenModal(product)
            }}
          >
            展开介绍
          </button>
        )}

        {/* 修改移动端描述显示逻辑 */}
        <div className="description-content">
          {(isMobile ? false : true) && (
            <div className="description-text">
              {product.description.split('\n').map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <button
          ref={buttonRef}
          className="glow-button"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) skew(-10deg) scale(${tilt.hover ? 1.05 : 1})`,
            transition: 'transform 0.1s ease-out',
            transformStyle: 'preserve-3d'
          }}
          onClick={() => onOpenModal(product)}
        >
          立即查看 &gt;
        </button>
      </div>

      <div className="preview-container">
        <ModelViewer fileUrl={product.image} className="preview-image" />
        {/* <img src={product.image} alt={product.name} className="preview-image" /> */}
      </div>

      {/* 直接内联渲染模态框 */}
      <ProductModal
        isOpen={isModalOpen} // 绑定本地状态
        onClose={() => setIsModalOpen(false)}
        product={product}
      />
    </div>
  );
}

export default ProductCard;