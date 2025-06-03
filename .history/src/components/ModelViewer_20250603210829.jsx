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

  // 切换全屏：显示 loading，切换状态
  const toggleFullscreen = () => {
    setIsLoading(true);
    setIsFullscreen((prev) => !prev);
  };

  // 3. 切换全屏时将 Canvas 移动到对应容器，并在完成后隐藏 loading
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    // 下一帧保证 fullscreenContainerRef.current 已挂载
    setTimeout(() => {
      const canvas = renderer.domElement;
      if (isFullscreen) {
        // 从 normal 移到 fullscreen
        if (
          normalContainerRef.current &&
          canvas.parentNode === normalContainerRef.current &&
          fullscreenContainerRef.current
        ) {
          normalContainerRef.current.removeChild(canvas);
          fullscreenContainerRef.current.appendChild(canvas);
        }
      } else {
        // 从 fullscreen 移回 normal
        if (
          fullscreenContainerRef.current &&
          canvas.parentNode === fullscreenContainerRef.current &&
          normalContainerRef.current
        ) {
          fullscreenContainerRef.current.removeChild(canvas);
          normalContainerRef.current.appendChild(canvas);
        }
      }

      // 调整尺寸并重新对准相机
      window.dispatchEvent(new Event('resize'));
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (camera && controls) {
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
      }

      // 切换完成，隐藏 loading
      setIsLoading(false);
    }, 0);
  }, [isFullscreen]);

  return (
    <>
      {/* 普通模式容器 */}
      <div
        ref={normalContainerRef}
        className="model-viewer-container"
      >
        {isLoading && <div className="loading-overlay">加载中...</div>}
        {/* Three.js 会自动插入 <canvas> 在这里 */}
        {/* 右下角全屏按钮 */}
        <button
          className="fullscreen-btn"
          onClick={toggleFullscreen}
        >
          {isFullscreen ? '退出全屏' : '全屏预览'}
        </button>
      </div>

      {/* 全屏模式容器，通过 Portal 渲染到 document.body */}
      {isFullscreen &&
        ReactDOM.createPortal(
          <div
            ref={fullscreenContainerRef}
            className="model-viewer-container fullscreen"
          >
            {isLoading && <div className="loading-overlay">加载中...</div>}
            {/* Three.js Canvas 会被移动到这里 */}
            {/* 右下角全屏按钮 */}
            <button
              className="fullscreen-btn"
              onClick={toggleFullscreen}
            >
              退出全屏
            </button>
          </div>,
          document.body
        )}
    </>
  );
}

export default ModelViewer;
