import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

function ModelViewer({ fileUrl }) {
  // 普通模式下容器引用
  const normalContainerRef = useRef(null);
  // Portal 全屏模式容器引用
  const fullscreenContainerRef = useRef(null);
  // 保存 Portal 节点以便插入和移除
  const [portalContainer, setPortalContainer] = useState(null);

  // Three.js 相关引用
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. IntersectionObserver：进入视口后才初始化 Three.js
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

  // 2. 初始化 Three.js，加载模型，居中+相机自适应
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
    renderer.setClearColor(0x000000, 0); // 背景透明，容器样式控制黑底
    renderer.domElement.style.display = 'block';
    // 初始插入到 normal 容器
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

    // --- 阻止滚轮/触摸冒泡 ---
    const wheelHandler = (e) => e.stopPropagation();
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });
    const touchMoveHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    renderer.domElement.addEventListener('touchmove', touchMoveHandler, { passive: false });
    renderer.domElement.addEventListener('touchstart', touchMoveHandler, { passive: false });
    renderer.domElement.addEventListener('touchend', touchMoveHandler, { passive: false });

    // --- 加载 GLB 模型 ---
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;

        // 计算包围盒并缩放到最大边长 = 2
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        model.scale.setScalar(scale);

        // 默认绕 Y 轴旋转 45°
        model.rotation.y = -Math.PI / 4;

        // 重新计算包围盒、中心并将模型居中
        const scaledBBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBBox.getCenter(new THREE.Vector3());
        model.position.sub(scaledCenter);

        scene.add(model);
        setIsLoading(false);

        // 计算包围球并设置相机位置
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

    // --- 窗口/容器尺寸变化 ---
    const handleResize = () => {
      const con = (isFullscreen ? fullscreenContainerRef.current : normalContainerRef.current);
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
      renderer.domElement.removeEventListener('touchmove', touchMoveHandler);
      renderer.domElement.removeEventListener('touchstart', touchMoveHandler);
      renderer.domElement.removeEventListener('touchend', touchMoveHandler);
      renderer.dispose();
      if (normalContainerRef.current && renderer.domElement.parentNode === normalContainerRef.current) {
        normalContainerRef.current.removeChild(renderer.domElement);
      }
      if (fullscreenContainerRef.current && renderer.domElement.parentNode === fullscreenContainerRef.current) {
        fullscreenContainerRef.current.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, [fileUrl, isInView, isFullscreen]);

  // 3. 切换全屏逻辑：创建/移除 Portal 容器，并移动 Canvas
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (isFullscreen) {
      // 创建一个新的 div，插入到 body 的第一子节点
      const portalDiv = document.createElement('div');
      portalDiv.className = 'model-viewer-portal-container';
      document.body.insertBefore(portalDiv, document.body.firstChild);
      fullscreenContainerRef.current = portalDiv;
      setPortalContainer(portalDiv);

      // 将 canvas 从 normal 容器移到 portalDiv
      const canvas = renderer.domElement;
      if (normalContainerRef.current && canvas.parentNode === normalContainerRef.current) {
        normalContainerRef.current.removeChild(canvas);
      }
      portalDiv.appendChild(canvas);
    } else {
      // 退出全屏：将 canvas 从 portalDiv 移回 normal container，并移除 portalDiv
      const portalDiv = fullscreenContainerRef.current;
      const canvas = renderer.domElement;
      if (portalDiv && canvas.parentNode === portalDiv) {
        portalDiv.removeChild(canvas);
      }
      if (normalContainerRef.current) {
        normalContainerRef.current.appendChild(canvas);
      }
      if (portalDiv) {
        document.body.removeChild(portalDiv);
      }
      fullscreenContainerRef.current = null;
      setPortalContainer(null);
    }

    // 切换后立刻 trigger 一次 resize，以更新相机 & 渲染器尺寸
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 0);
  }, [isFullscreen]);

  // 双击 / 双击触屏 转换全屏
  const handleDoubleClick = () => {
    setIsFullscreen((prev) => !prev);

    // 点击后在下一帧里重新定位相机中心
    setTimeout(() => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      const con = isFullscreen ? normalContainerRef.current : fullscreenContainerRef.current;
      if (!camera || !controls || !rendererRef.current || !con) return;

      // 更新相机纵横比、渲染器尺寸
      const w = con.clientWidth;
      const h = con.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);

      // 强制相机重新 lookAt 模型中心 (0,0,0)
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }, 0);
  };

  return (
    <>
      {/* 正常模式下的容器 */}
      <div
        ref={normalContainerRef}
        className="model-viewer-container"
        onDoubleClick={handleDoubleClick}
      >
        {isLoading && <div className="loading-overlay">加载中...</div>}
        {/* Three.js 会自动把 <canvas> 插入到这里 */}
      </div>

      {/* 当 isFullscreen 时，通过 Portal 在 body 第一子级渲染一个空 div */}
      {portalContainer &&
        ReactDOM.createPortal(
          <div
            ref={fullscreenContainerRef}
            className="model-viewer-container fullscreen"
            onDoubleClick={handleDoubleClick}
          >
            {/* Canvas 会在 useEffect 中被搬到这里 */}
          </div>,
          portalContainer
        )}
    </>
  );
}

export default ModelViewer;
