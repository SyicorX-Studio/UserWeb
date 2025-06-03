// src/components/ModelViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

function ModelViewer({ fileUrl }) {
  const normalContainerRef = useRef(null);
  const portalContainerRef = useRef(null);

  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 如果已经初始化过 renderer，就直接返回，避免重复创建
    if (rendererRef.current) {
      return;
    }

    const container = normalContainerRef.current;
    if (!container) return;

    // 1. 创建场景
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // 2. 创建相机
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';

    // 4. 插入 canvas
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 5. 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // 6. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // 7. 阻止滚轮冒泡
    const wheelHandler = (e) => {
      e.stopPropagation();
    };
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });

    // 8. 加载模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
        }

        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('GLTFLoader 加载模型失败：', error);
      }
    );

    // 9. 渲染循环
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 10. 响应式
    const handleResize = () => {
      const currentContainer = isFullscreen
        ? portalContainerRef.current
        : normalContainerRef.current;
      if (!currentContainer) return;
      const w = currentContainer.clientWidth;
      const h = currentContainer.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. 清理
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.domElement.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      // 确保不同容器下都能正确移除
      if (normalContainerRef.current && renderer.domElement.parentNode === normalContainerRef.current) {
        normalContainerRef.current.removeChild(renderer.domElement);
      }
      if (portalContainerRef.current && renderer.domElement.parentNode === portalContainerRef.current) {
        portalContainerRef.current.removeChild(renderer.domElement);
      }
      rendererRef.current = null; // 重置标记，以便下次重新挂载时可重新初始化
    };
  }, [fileUrl, isFullscreen]);

  // 切换全屏/退出全屏
  const handleDoubleClick = () => {
    setIsFullscreen((prev) => !prev);
  };

  // 当 isFullscreen 变动时，把 canvas 从一个容器移动到另一个（或创建/删除 portal 容器）
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isFullscreen) {
      // 进入全屏
      const portalDiv = document.createElement('div');
      portalDiv.className = 'model-viewer-portal-container';
      document.body.appendChild(portalDiv);
      portalContainerRef.current = portalDiv;

      const currentCanvas = renderer.domElement;
      if (normalContainerRef.current && currentCanvas.parentNode === normalContainerRef.current) {
        normalContainerRef.current.removeChild(currentCanvas);
      }
      portalDiv.appendChild(currentCanvas);
    } else {
      // 退出全屏
      const portalDiv = portalContainerRef.current;
      const currentCanvas = renderer.domElement;
      if (portalDiv && currentCanvas.parentNode === portalDiv) {
        portalDiv.removeChild(currentCanvas);
      }
      if (normalContainerRef.current) {
        normalContainerRef.current.appendChild(currentCanvas);
      }
      if (portalDiv) {
        document.body.removeChild(portalDiv);
      }
      portalContainerRef.current = null;
    }

    // 切换后触发一次 resize
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
  }, [isFullscreen]);

  return (
    <div
      className="model-viewer-container"
      ref={normalContainerRef}
      onDoubleClick={handleDoubleClick}
    >
      {/* Canvas 会自动插入到这里或 portal 中 */}
    </div>
  );
}

export default ModelViewer;
