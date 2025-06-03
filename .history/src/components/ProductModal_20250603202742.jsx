import React, { useState, useEffect, useRef } from 'react';
import './ProductModal.css';

function ProductModal({ isOpen, onClose, product }) {
  const [isClosing, setIsClosing] = useState(false);
  // 用于标记是否为内部点击触发的关闭
  const isInternalCloseRef = useRef(false);

  // 点击遮罩时关闭
  const handleOverlayClick = () => {
    triggerClose(true);
  };

  // 点击关闭按钮时关闭
  const handleClose = () => {
    triggerClose(true);
  };

  /**
   * 触发关闭动效
   * @param {boolean} notifyParent 如果是内部点击关闭，则动画结束后调用 onClose。若为外部属性关，则不重复调用 onClose。
   */
  const triggerClose = (notifyParent) => {
    if (isClosing) return; // 若已经在关闭动画中，忽略额外点击
    if (notifyParent) {
      isInternalCloseRef.current = true;
    }
    setIsClosing(true);

    // 动画时长 300ms
    setTimeout(() => {
      setIsClosing(false);
      if (notifyParent) {
        onClose();
      }
      // 如果是外部触发，则 onClose 已经被调用，isInternalCloseRef 会在下方 useEffect 中重置
    }, 300);
  };

  // 监听 isOpen 变化：如果 isOpen 从 true 变为 false，且不是内部点击触发，就执行关闭动画
  useEffect(() => {
    if (!isOpen && !isClosing) {
      // 如果上次关闭是内部触发，就跳过这次
      if (isInternalCloseRef.current) {
        isInternalCloseRef.current = false;
        return;
      }
      // 外部直接将 isOpen 设为 false，触发一次动画，但不再调用 onClose
      triggerClose(false);
    }
  }, [isOpen]);

  // 如果既不是打开状态，也不在关闭动画中，就不渲染
  if (!isOpen && !isClosing) {
    return null;
  }

  // 根据 isClosing 切换类名，触发对应动画
  const overlayClass = isClosing
    ? 'modal-overlay closing'
    : 'modal-overlay active';

  return (
    <div className={overlayClass} onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="modal-close"
          onClick={handleClose}
          aria-label="关闭弹窗"
        >
          &times;
        </button>
        <div className="modal-body">
          {product?.description
            ?.split('\n')
            .map((line, index) => (
              <React.Fragment key={index}>
                {line}
              </React.Fragment>
            ))}
        </div>
        {/* 新增双击放大提示 */}
        <div className="modal-zoom-tip">
          双击放大
        </div>
      </div>
    </div>
  );
}

export default ProductModal;
