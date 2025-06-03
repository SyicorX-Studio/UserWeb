import React, { useState, useRef, useEffect } from 'react';
import ProductCard from './ProductCard'; // 注意路径，根据你项目调整
import '../page/Home.css'; // 保证上面写的样式能生效

/**
 * ProductSlider 组件
 * @param {Array} props.products - 产品列表
 * @param {Function} props.onOpenModal - 点击卡片“立即查看”时回调
 */
function ProductSlider({ products, onOpenModal }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  // touch 处理
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // 当 currentIndex 变化时，调整 slides 容器的 transform
  useEffect(() => {
    const slidesEl = sliderRef.current.querySelector('.product-slider-slides');
    if (slidesEl) {
      slidesEl.style.transform = `translateX(-${currentIndex * 100}vw)`;
    }
  }, [currentIndex]);

  // 监听鼠标滚轮
  useEffect(() => {
    const sliderEl = sliderRef.current;

    const handleWheel = (e) => {
      // deltaY > 0 表示向下滚滚，想看下一张
      // deltaY < 0 表示向上滚滚，想看上一张
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        // 只有当滚轮主要是纵向滚动时，才处理
        if (e.deltaY > 0) {
          // 想下翻
          if (currentIndex < products.length - 1) {
            e.preventDefault();
            setCurrentIndex((idx) => Math.min(idx + 1, products.length - 1));
          }
          // 如果在最后一张，则放过，让页面滚到下一页
        } else {
          // 想上翻
          if (currentIndex > 0) {
            e.preventDefault();
            setCurrentIndex((idx) => Math.max(idx - 1, 0));
          }
          // 如果在第一张，则放过，让页面滚到上一页（外层容器）
        }
      }
    };

    sliderEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      sliderEl.removeEventListener('wheel', handleWheel);
    };
  }, [currentIndex, products.length]);

  // 监听移动端拖拽
  useEffect(() => {
    const sliderEl = sliderRef.current;

    const handleTouchStart = (e) => {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      // 我们这里只在 touchend 时决定切换逻辑，这里不用做太多
      // 但为了在拖动时让容器跟手，我们可以临时移动：
      const slidesEl = sliderEl.querySelector('.product-slider-slides');
      if (slidesEl) {
        const offset = -currentIndex * window.innerWidth + deltaX;
        slidesEl.style.transition = 'none';
        slidesEl.style.transform = `translateX(${offset}px)`;
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startXRef.current;

      const threshold = window.innerWidth * 0.2; // 20% 宽度为阈值

      if (deltaX > threshold && currentIndex > 0) {
        // 右滑翻上一张
        setCurrentIndex((idx) => idx - 1);
      } else if (deltaX < -threshold && currentIndex < products.length - 1) {
        // 左滑翻下一张
        setCurrentIndex((idx) => idx + 1);
      } else {
        // 不足阈值，回弹到当前页
        const slidesEl = sliderEl.querySelector('.product-slider-slides');
        if (slidesEl) {
          slidesEl.style.transition = 'transform 0.3s ease';
          slidesEl.style.transform = `translateX(-${currentIndex * window.innerWidth}px)`;
        }
      }
    };

    sliderEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    sliderEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    sliderEl.addEventListener('touchend', handleTouchEnd);

    return () => {
      sliderEl.removeEventListener('touchstart', handleTouchStart);
      sliderEl.removeEventListener('touchmove', handleTouchMove);
      sliderEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, products.length]);

  return (
    <div className="product-slider-container" ref={sliderRef}>
      <div className="product-slider-slides">
        {products.map((prod, idx) => (
          <div className="product-slider-slide" key={prod.id}>
            <ProductCard product={prod} onOpenModal={onOpenModal} />
          </div>
        ))}
      </div>

      {/* 下方页码指示器 */}
      <div className="product-slider-indicator">
        {products.map((_, idx) => (
          <div
            key={idx}
            className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ProductSlider;
