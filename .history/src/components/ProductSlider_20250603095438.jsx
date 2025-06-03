import React, { useState, useEffect, useRef } from 'react';
import ProductCard from './ProductCard';

/**
 * 横向滚动产品展示组件
 * @param {Object[]} props.products - 产品数据数组
 */
function ProductSlider({ products }) {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  // 滚轮事件处理
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      if (e.deltaY > 0 && currentPage < products.length - 1) {
        setCurrentPage(prev => prev + 1);
      } else if (e.deltaY < 0 && currentPage > 0) {
        setCurrentPage(prev => prev - 1);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [currentPage, products.length]);

  // 触摸事件处理
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      const deltaY = touchStartY.current - e.touches[0].clientY;
      
      if (Math.abs(deltaY) > 30) {
        if (deltaY > 0 && currentPage < products.length - 1) {
          setCurrentPage(prev => prev + 1);
        } else if (deltaY < 0 && currentPage > 0) {
          setCurrentPage(prev => prev - 1);
        }
        touchStartY.current = 0;
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [currentPage, products.length]);

  // 滚动到当前页面
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTo({
        left: currentPage * container.offsetWidth,
        behavior: 'smooth'
      });
    }
  }, [currentPage]);

  // 窗口大小变化时保持单页宽度
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      if (container) {
        container.scrollTo({
          left: currentPage * container.offsetWidth,
          behavior: 'smooth'
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPage]);

  return (
    <div className="slider-container">
      <div 
        ref={containerRef}
        className="cards-container"
      >
        {products.map((product, index) => (
          <div 
            key={product.id} 
            className="card-wrapper"
            style={{ width: `${100 / products.length}%` }}
          >
            <ProductCard 
              product={product} 
              onOpenModal={(p) => {
                // 这里可以添加模态框打开逻辑
                console.log('Open modal for', p);
              }}
            />
          </div>
        ))}
      </div>

      <div className="dot-indicator">
        {products.map((_, index) => (
          <div 
            key={index} 
            className={`dot ${index === currentPage ? 'active' : ''}`}
            onClick={() => setCurrentPage(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductSlider;