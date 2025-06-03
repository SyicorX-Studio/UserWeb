import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './ModelViewer.css';

function ModelViewer({ fileUrl }) {
  const containerRef = useRef(null);            // 渲染容器引用
  const rendererRef = useRef(null);             // three.js 渲染器
  const sceneRef = useRef(null);                // three.js 场景
  const cameraRef = useRef(null);               // three.js 相机
  const controlsRef = useRef(null);             // OrbitControls
  const animationFrameRef = useRef(null);       // RAF ID

  const [isFullscreen, setIsFullscreen] = useState(false);   // 全屏状态
  const [isInView, setIsInView] = useState(false);           // 是否已进入视口
  const [isLoading, setIsLoading] = useState(true);         // 模型是否正在加载

  // 1. 使用 IntersectionObserver，检测何时进入视口，触发加载
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

  // 2. 在 isInView 变为 true 时，初始化 Three.js 场景并加载模型
  useEffect(() => {
    if (!isInView) return;
    // 如果已经创建过 renderer，就跳过（防止重复创建）
    if (rendererRef.current) {
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // 开始加载，显示“加载中”提示
    setIsLoading(true);

    // --- Three.js 初始化 ---
    const scene = new THREE.Scene();
    scene.background = null; // 背景透明
    sceneRef.current = scene;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 环境光 + 平行光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // 阻止滚轮冒泡
    const wheelHandler = (e) => e.stopPropagation();
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });

    // 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 计算包围盒，将中心移到 (0,0,0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // 按需缩放
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
        }

        scene.add(model);
        // 模型加载完成，隐藏“加载中”
        setIsLoading(false);
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

    // 窗口尺寸变化
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
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fileUrl, isInView]);

  // 双击切换全屏／退出全屏
  const handleDoubleClick = () => {
    setIsFullscreen((prev) => !prev);
    // 切换后等待一帧再更新尺寸
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
      {/* Three.js canvas 会自动插入到 containerRef 所指的 div */}
    </div>
  );
}

export default ModelViewer;
