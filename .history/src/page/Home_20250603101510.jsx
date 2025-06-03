import React, { useState } from 'react';
import SpeedLines3D from '../SpeedLines3D';
import './Home.css';
import ProductSlider from '../components/ProductSlider';
import ProductModal from '../components/ProductModal';

function Home() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    {
      id: 1,
      name: '简冷',
      description: '简冷X冷得刚刚好！\n双半导体冷却\n20W快充热插拔电池设计\n为Furry用户量身打造的随身空调',
      image: '/glass_box.png'
    },
    {
      id: 2,
      name: '速凉',
      description: '极速降温体验\n创新风道设计\n静音夜间模式\n适合各种场景的智能散热方案',
      image: '/cooling_device.png'
    }
  ];

  const openModal = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  return (
    <div className="home-container">
      {/* 第一页内容 */}
      <div className="home-section">
        <div className="home-title">
          <img src={require('../title.svg').default} alt="title" />
          <h3 className="home-subtitle">视觉造梦，设计为你而生</h3>
        </div>
      </div>

      {/* 插入背景图片 */}
      <div className="home-background-image">
        <img src="/glass_box.png" style={{opacity:'0.8'}} alt="玻璃盒子" />
      </div>

      {/* 产品展示区域 */}
      <div className="product-section">
        <ProductSlider 
          products={products}
          onOpenModal={openModal}
        />
      </div>

      {/* 右侧滚动指示器 */}
      <div className="home-dot-indicator">
        <div className="home-dot active" />
        <div className="home-dot" />
      </div>
    </div>
  );
}

export default Home;