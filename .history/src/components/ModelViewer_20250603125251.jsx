import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

function ModelViewer({ fileUrl }) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. 只有当组件进入视口时才开始加载
  useEffect(() => {
    const container = containerRef.current;
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

  // 2. 初始化 Three.js，加载模型，并进行“居中+摄像机适配”
  useEffect(() => {
    if (!isInView) return;
    if (rendererRef.current) return; // 防止重复初始化

    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);

    // --- Three.js 初始化 ---
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // 默认透明，后面全屏时容器改为黑色
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 光源
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // 控制器
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 20;
    controlsRef.current = controls;

    // 拦截滚轮，防止冒泡
    const wheelHandler = (e) => e.stopPropagation();
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });

    // 拦截触摸拖动，防止页面滚动
    const touchMoveHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    renderer.domElement.addEventListener('touchmove', touchMoveHandler, { passive: false });
    renderer.domElement.addEventListener('touchstart', touchMoveHandler, { passive: false });
    renderer.domElement.addEventListener('touchend', touchMoveHandler, { passive: false });

    // 加载 GLB
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;

        // 计算包围盒
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        const center = bbox.getCenter(new THREE.Vector3());

        // 统一缩放到 maxDim = 2
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        model.scale.setScalar(scale);

        // 重新计算包围盒、中心
        const scaledBBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = scaledBBox.getCenter(new THREE.Vector3());
        model.position.sub(scaledCenter); // 把模型中心移到原点

        scene.add(model);
        setIsLoading(false);

        // 计算包围球，以便摄像机从合适距离观察整个模型
        const bboxAfter = new THREE.Box3().setFromObject(model);
        const sphere = bboxAfter.getBoundingSphere(new THREE.Sphere());

        // 摄像机与目标居中
        const radius = sphere.radius;
        const fov = camera.fov * (Math.PI / 180);
        // 计算距离：距离 = radius / sin(fov/2)
        const distance = radius / Math.sin(fov / 2) * 1.2; // 1.2 为一点余量
        // 设置相机位置：沿 z 轴正方向（也可以从其他角度）
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

    // 渲染循环
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 窗口或容器尺寸变化
    const handleResize = () => {
      const con = containerRef.current;
      if (!con) return;
      const w = con.clientWidth;
      const h = con.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 清理
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.domElement.removeEventListener('wheel', wheelHandler);
      renderer.domElement.removeEventListener('touchmove', touchMoveHandler);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
    };
  }, [fileUrl, isInView]);

  // 双击全屏/退出
  const handleDoubleClick = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      const con = containerRef.current;
      if (!con || !cameraRef.current || !rendererRef.current) return;
      const w = con.clientWidth;
      const h = con.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    }, 0);
  };

  return (
    <div
      ref={containerRef}
      className={`model-viewer-container${isFullscreen ? ' fullscreen' : ''}`}
      onDoubleClick={handleDoubleClick}
    >
      {isLoading && (
        <div className="loading-overlay">
          加载中...
        </div>
      )}
      {/* canvas 会自动插入到这里 */}
    </div>
  );
}

export default ModelViewer;
