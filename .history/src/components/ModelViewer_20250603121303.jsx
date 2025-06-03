// src/components/ModelViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

function ModelViewer({ fileUrl }) {
  // 普通状态下的容器
  const normalContainerRef = useRef(null);
  // Portal 下全屏时用的容器
  const portalContainerRef = useRef(null);

  // three.js 相关引用
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  // 当前是否处于全屏模式
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ---------- 初始化 three.js 场景，只执行一次 ----------
  useEffect(() => {
    // 1. 先确定插入 canvas 的“当前”容器，初始使用 normalContainerRef
    const container = normalContainerRef.current;
    if (!container) return;

    // 2. 创建 Scene
    const scene = new THREE.Scene();
    scene.background = null; // 透明背景
    sceneRef.current = scene;

    // 3. 创建 Camera
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 4. 创建 Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // 透明
    renderer.domElement.style.display = 'block';

    // 5. 把 canvas 插入到 normalContainerRef 中
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 6. 添加光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // 7. 添加 OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // 8. 拦截 canvas 上的滚轮，阻止冒泡
    const wheelHandler = (e) => {
      e.stopPropagation();
    };
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });

    // 9. 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 计算包围盒，将模型中心移动到 (0,0,0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // 按需缩放到合适大小
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

    // 10. 渲染循环
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 11. 响应式：窗口或容器尺寸变更时，更新 camera & renderer
    const handleResize = () => {
      // 首先判断当前应该插入在哪个容器
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

    // 12. 清理函数
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      renderer.domElement.removeEventListener('wheel', wheelHandler);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (normalContainerRef.current && renderer.domElement.parentNode === normalContainerRef.current) {
        normalContainerRef.current.removeChild(renderer.domElement);
      }
      if (portalContainerRef.current && renderer.domElement.parentNode === portalContainerRef.current) {
        portalContainerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fileUrl, isFullscreen]);

  // ---------- 切换全屏/退出全屏 ----------
  const handleDoubleClick = () => {
    setIsFullscreen((prev) => !prev);
  };

  // 每当 isFullscreen 变化，就把 canvas 从一个容器移动到另一个
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isFullscreen) {
      // 进入全屏：需要在 body 下创建一个 portal 容器，并把 canvas 移入
      const portalDiv = document.createElement('div');
      portalDiv.className = 'model-viewer-portal-container';
      document.body.appendChild(portalDiv);
      portalContainerRef.current = portalDiv;

      // 把 canvas 从 normalContainer 移到 portalDiv
      const currentCanvas = renderer.domElement;
      if (normalContainerRef.current && currentCanvas.parentNode === normalContainerRef.current) {
        normalContainerRef.current.removeChild(currentCanvas);
      }
      portalDiv.appendChild(currentCanvas);
    } else {
      // 退出全屏：把 canvas 从 portalContainer 移回 normalContainer，移除 portalDiv
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

    // 切换后，强制触发一次 resize 以适配新容器尺寸
    setTimeout(() => {
      const evt = new Event('resize');
      window.dispatchEvent(evt);
    }, 0);
  }, [isFullscreen]);

  // 最终的 JSX：正常态下渲染 <div ref={normalContainerRef}>；全屏态下不渲染它，而是通过 Portal 手动插入
  // 但这里依然保留 <div ref={normalContainerRef}>，因为退回正常态时会插回去
  return (
    <div
      className="model-viewer-container"
      ref={normalContainerRef}
      onDoubleClick={handleDoubleClick}
    >
      {/* three.js 渲染器的 <canvas> 会自动插到这个 div（或 portal 时插到 body 下的 portalDiv） */}
    </div>
  );
}

export default ModelViewer;
