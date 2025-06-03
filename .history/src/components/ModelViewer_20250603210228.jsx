// src/components/ModelViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

function ModelViewer({ fileUrl }) {
  // 普通模式容器引用
  const normalContainerRef = useRef(null);
  // 全屏模式容器引用（Portal 渲染的 div）
  const fullscreenContainerRef = useRef(null);

  // Three.js 相关引用
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 用于记录上次 touch 结束时间，以检测双 tap
  const lastTapRef = useRef(0);

  // 1. IntersectionObserver：只有进入视口时才加载 Three.js
  useEffect(() => {
    const container = normalContainerRef.current;
    if (!container) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    io.observe(container);
    return () => io.disconnect();
  }, []);

  // 2. 初始化 Three.js，加载模型，居中并自适应
  useEffect(() => {
    if (!isInView) return;
    if (rendererRef.current) return; // 已初始化则跳过

    const container = normalContainerRef.current;
    if (!container) return;

    setIsLoading(true);

    // --- 场景 ---
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // --- 相机 ---
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // --- 渲染器 ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // 背景透明
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // --- 光源 ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // --- 控制器 ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // --- 阻止滚轮与触摸冒泡 ---
    const wheelHandler = (e) => e.stopPropagation();
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });
    const touchHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    renderer.domElement.addEventListener('touchmove', touchHandler, { passive: false });
    renderer.domElement.addEventListener('touchstart', touchHandler, { passive: false });
    renderer.domElement.addEventListener('touchend', touchHandler, { passive: false });

    // --- 加载 GLB 模型 ---
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;

        // 计算包围盒并按最大边长缩放到 2
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        model.scale.setScalar(scale);

        // 默认绕 Y 轴转 45°
        model.rotation.y = -Math.PI / 4;

        // 重新计算包围盒、中心并居中模型
        const scaledBBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBBox.getCenter(new THREE.Vector3());
        model.position.sub(scaledCenter);

        scene.add(model);
        setIsLoading(false);

        // 计算包围球，更新相机位置
        const bboxAfter = new THREE.Box3().setFromObject(model);
        const sphere = bboxAfter.getBoundingSphere(new THREE.Sphere());
        const radius = sphere.radius;
        const fov = camera.fov * (Math.PI / 180);
        const distance = radius / Math.sin(fov / 2) * 1.2;
        camera.position.set(0, 0, distance);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
      },
      undefined,
      (error) => {
        console.error('GLTFLoader 加载模型失败：', error);
        setIsLoading(false);
      }
    );

    // --- 渲染循环 ---
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // --- 窗口 / 容器尺寸变化 ---
    const handleResize = () => {
      const con = isFullscreen
        ? fullscreenContainerRef.current
        : normalContainerRef.current;
      if (!con) return;
      const w = con.clientWidth;
      const h = con.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- 清理 ---
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.domElement.removeEventListener('wheel', wheelHandler);
      renderer.domElement.removeEventListener('touchmove', touchHandler);
      renderer.domElement.removeEventListener('touchstart', touchHandler);
      renderer.domElement.removeEventListener('touchend', touchHandler);
      renderer.dispose();
      // 确保从当前 DOM 容器中移除 Canvas
      const canvas = renderer.domElement;
      if (
        normalContainerRef.current &&
        canvas.parentNode === normalContainerRef.current
      ) {
        normalContainerRef.current.removeChild(canvas);
      }
      if (
        fullscreenContainerRef.current &&
        canvas.parentNode === fullscreenContainerRef.current
      ) {
        fullscreenContainerRef.current.removeChild(canvas);
      }
      rendererRef.current = null;
    };
  }, [fileUrl, isInView, isFullscreen]);

  // 3. 切换全屏：先显示 loading，再插入 Portal div，最后把 Canvas 移进去
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    // 延迟一帧，等 JSX 渲染出 fullscreenContainerRef.current
    setTimeout(() => {
      const canvas = renderer.domElement;
      if (isFullscreen) {
        // 移到 fullscreen 容器
        if (
          normalContainerRef.current &&
          canvas.parentNode === normalContainerRef.current &&
          fullscreenContainerRef.current
        ) {
          normalContainerRef.current.removeChild(canvas);
          fullscreenContainerRef.current.appendChild(canvas);
        }
      } else {
        // 退出全屏：移回 normal 容器
        if (
          fullscreenContainerRef.current &&
          canvas.parentNode === fullscreenContainerRef.current &&
          normalContainerRef.current
        ) {
          fullscreenContainerRef.current.removeChild(canvas);
          normalContainerRef.current.appendChild(canvas);
        }
      }

      // 切换完成后，触发 resize 并重新对准相机
      window.dispatchEvent(new Event('resize'));
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (camera && controls) {
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // 切换动画完成，隐藏加载遮罩
      setIsLoading(false);
    }, 0);
  }, [isFullscreen]);

  // 切换全屏逻辑：用于桌面双击 & 移动端双 tap
  const toggleFullscreen = () => {
    // 点击后立即显示 loading 遮罩
    setIsLoading(true);
    // 切换全屏状态
    setIsFullscreen((prev) => !prev);
  };

  // 处理桌面双击
  const handleDoubleClick = () => {
    toggleFullscreen();
  };

  // 处理移动端双 tap：手动监听 touchend
  const handleTouchEnd = (e) => {
    console.log('handleTouchEnd');
    // 确保单指触摸，否则两指缩放等不算双 tap
    if (e.touches && e.touches.length > 0) return;
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapRef.current;
    if (tapLength < 300 && tapLength > 0) {
      toggleFullscreen();
    }
    lastTapRef.current = currentTime;
  };

  // 在容器挂载之后，用原生事件监听 touchend
  useEffect(() => {
    const normalEl = normalContainerRef.current;
    if (normalEl) {
      normalEl.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (normalEl) normalEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // 在全屏容器挂载之后，也监听 touchend
  useEffect(() => {
    if (!isFullscreen) return;
    const fullEl = fullscreenContainerRef.current;
    if (fullEl) {
      fullEl.addEventListener('touchend', handleTouchEnd);
    }
    return () => {
      if (fullEl) fullEl.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isFullscreen]);

  return (
    <>
      {/* 普通模式容器 */}
      <div
        ref={normalContainerRef}
        className="model-viewer-container"
        onDoubleClick={handleDoubleClick}
      >
        {isLoading && <div className="loading-overlay">加载中...</div>}
        {/* Three.js 会自动插入 <canvas> */}
      </div>

      {/* 全屏模式时，通过 Portal 将一个空容器渲染到 document.body */}
      {isFullscreen &&
        ReactDOM.createPortal(
          <div
            ref={fullscreenContainerRef}
            className="model-viewer-container fullscreen"
            onDoubleClick={handleDoubleClick}
          >
            {isLoading && <div className="loading-overlay">加载中...</div>}
            {/* Canvas 会在 useEffect 中被移动到这里 */}
          </div>,
          document.body
        )}
    </>
  );
}

export default ModelViewer;
