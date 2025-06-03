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

  // 1. 监测是否进入视口
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

  // 2. 只有 isInView=true 时才初始化 three.js
  useEffect(() => {
    if (!isInView) return;
    if (rendererRef.current) return;

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

    // 阻止手指拖动页面滚动
    const touchMoveHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    renderer.domElement.addEventListener('touchmove', touchMoveHandler, { passive: false });

    // 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 计算包围盒，将中心移动到 (0,0,0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // ——改动：始终按 2 / maxDim 来放大或缩小——
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
        }

        scene.add(model);
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
      renderer.domElement.removeEventListener('touchmove', touchMoveHandler);
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fileUrl, isInView]);

  // 双击切换全屏
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
      {/* Three.js canvas 会插入到这里 */}
    </div>
  );
}

export default ModelViewer;
