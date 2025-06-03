import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import './ModelViewer.css';

/**
 * ModelViewer 组件
 * @param {Object} props
 * @param {string} props.fileUrl - `public` 目录下的 glb 文件链接，例如 "/models/myModel.glb"
 */
function ModelViewer({ fileUrl }) {
  const containerRef = useRef(null);            // 容器 DOM 引用
  const rendererRef = useRef(null);             // three.js 渲染器
  const sceneRef = useRef(null);                // three.js 场景
  const cameraRef = useRef(null);               // three.js 相机
  const controlsRef = useRef(null);             // three.js 交互控制器
  const modelRef = useRef(null);                // 存储已加载的模型
  const animationFrameRef = useRef(null);       // requestAnimationFrame ID
  const [isFullscreen, setIsFullscreen] = useState(false); // 是否全屏预览

  // 初始化 three.js 场景、相机、渲染器、控件、加载模型
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. 创建 scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. 创建 camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.5, 3); // 根据模型大小微调
    cameraRef.current = camera;

    // 3. 创建 renderer，启用透明背景
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); // 背景透明
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. 添加环境光 + 平行光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 5. 添加 OrbitControls（鼠标/触摸交互）
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.screenSpacePanning = false;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0.8, 0);
    controls.update();
    controlsRef.current = controls;

    // 6. 加载 glb 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 让模型居中（假设模型已在原点或需做边界计算，这里简化使用 boundingBox）
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // 将模型中心移动到 (0,0,0)

        // 可按需缩放模型以适配视口
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
        }

        scene.add(model);
        modelRef.current = model;
      },
      undefined,
      (error) => {
        console.error('加载 GLB 模型失败：', error);
      }
    );

    // 7. 渲染循环
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // 8. 响应式：窗口或容器大小变化时，更新相机和渲染器
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };
    window.addEventListener('resize', handleResize);

    // 9. 清理函数
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      // 从 DOM 中移除 Canvas
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [fileUrl]);

  // 切换全屏/退出全屏
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    // 下一帧调整尺寸
    setTimeout(() => {
      const container = containerRef.current;
      if (container && cameraRef.current && rendererRef.current) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    }, 0);
  };

  return (
    <div
      className={
        isFullscreen
          ? 'model-viewer-container fullscreen'
          : 'model-viewer-container'
      }
      ref={containerRef}
      onClick={toggleFullscreen}
    >
      {/* three.js 会自动将 canvas 插入到这里 */}
    </div>
  );
}

export default ModelViewer;
