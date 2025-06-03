// src/components/ModelViewer.jsx
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
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏状态

  // 初始化 three.js 场景、相机、渲染器、控件
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. 创建场景
    const scene = new THREE.Scene();
    scene.background = null; // 背景透明
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
    renderer.setClearColor(0x000000, 0); // 透明背景
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // 5. 添加 OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // 6. 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 计算模型包围盒，将几何中心移动到原点
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
      },
      undefined,
      (error) => {
        console.error('GLTFLoader 加载模型失败：', error);
      }
    );

    // 7. 渲染循环
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 8. 窗口大小变化时更新相机与渲染器尺寸
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

    // 9. 清理
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fileUrl]);

  // 切换全屏／退出全屏（双击触发）
  const handleDoubleClick = () => {
    setIsFullscreen((prev) => !prev);
    // 等待 DOM 更新后立刻调整尺寸
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
      {/* three.js 渲染器会自动把 <canvas> 插入到这里 */}
    </div>
  );
}

export default ModelViewer;
