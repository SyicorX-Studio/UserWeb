import React, { useState, useRef, useEffect } from 'react';
import ProductCard from './ProductCard';
import '../page/Home.css'; // 确保上面写的所有样式能生效

/**
 * ProductSlider 组件
 * @param {Array} props.products - 产品列表
 * @param {Function} props.onOpenModal - 点击卡片“立即查看”时的回调
 */
function ProductSlider({ products, onOpenModal }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef(null);

  // touch 处理所需的 ref
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // 当 currentIndex 变化时，调整 slides 容器的 transform
  useEffect(() => {
    const slidesEl = sliderRef.current.querySelector('.product-slider-slides');
    if (slidesEl) {
      slidesEl.style.transition = 'transform 0.3s ease';
      slidesEl.style.transform = `translateX(-${currentIndex * 100}vw)`;
    }
  }, [currentIndex]);

  // 监听页面滚轮，做“上下滚”转换卡片逻辑
  useEffect(() => {
    const sliderEl = sliderRef.current;

    const handleWheel = (e) => {
      // 当纵向滚动意图明显时，才阻止默认纵向滚动并切换卡片
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (e.deltaY > 0) {
          // 向下滚，尝试下一张
          if (currentIndex < products.length - 1) {
            e.preventDefault();
            setCurrentIndex((idx) => Math.min(idx + 1, products.length - 1));
          }
          // 如果已经是最后一张，让事件继续冒泡到外层，外层 Home 容器会滚到下一页
        } else {
          // 向上滚，尝试上一张
          if (currentIndex > 0) {
            e.preventDefault();
            setCurrentIndex((idx) => Math.max(idx - 1, 0));
          }
          // 如果已经是第一张，让事件继续冒泡，让 Home 滚到上一页
        }
      }
    };

    sliderEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => sliderEl.removeEventListener('wheel', handleWheel);
  }, [currentIndex, products.length]);

  // 移动端横向拖拽逻辑
  useEffect(() => {
    const sliderEl = sliderRef.current;

    const handleTouchStart = (e) => {
      isDraggingRef.current = true;
      startXRef.current = e.touches[0].clientX;
      // 取消正在进行的 transition，好让滑动跟手
      const slidesEl = sliderEl.querySelector('.product-slider-slides');
      if (slidesEl) slidesEl.style.transition = 'none';
    };

    const handleTouchMove = (e) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.touches[0].clientX - startXRef.current;
      const slidesEl = sliderEl.querySelector('.product-slider-slides');
      if (slidesEl) {
        const offset = -currentIndex * window.innerWidth + deltaX;
        slidesEl.style.transform = `translateX(${offset}px)`;
      }
    };

    const handleTouchEnd = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startXRef.current;
      const threshold = window.innerWidth * 0.2; // 20% 宽度阈值

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

      {/* 下方卡片定位指示器 */}
      <div className="product-slider-indicator">
        {products.map((_, idx) => (
          <div
            key={idx}
            className={`slider-dot ${idx === currentIndex ? 'active' : ''}`}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default ProductSlider;
