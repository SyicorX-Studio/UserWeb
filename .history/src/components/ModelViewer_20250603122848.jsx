// src/components/ModelViewer.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
// 使用 RGBELoader 来加载 HDR（或 LDR）环境贴图
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
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

  // 标志：确保只初始化一次
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

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
    renderer.setClearColor(0x000000, 0);

    // 兼容早期版本的色彩空间设置：启用 gamma 输出
    renderer.gammaOutput = true;
    renderer.gammaFactor = 2.2;
    // 如果您的 three.js 版本支持 tone mapping，可以启用：
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;

    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. 添加光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
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

    // 6. 阻止 canvas 上的滚轮冒泡
    const wheelHandler = (e) => e.stopPropagation();
    renderer.domElement.addEventListener('wheel', wheelHandler, { passive: false });

    // 7. PMREMGenerator，用于环境贴图
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // 8. 加载 HDR/equirectangular 环境贴图
    //    假设路径为 public/environments/studio.hdr
    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .setPath('/environments/')
      .load('studio.hdr', (hdrEquirect) => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
        scene.environment = envMap; // 用于 PBR 反射
        // 如果想让背景是 HDR 环境，可启用下一行：
        // scene.background = envMap;
        hdrEquirect.dispose();
        pmremGenerator.dispose();
      });

    // 9. 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 计算包围盒，把模型中心放在原点
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

        // 遍历模型，确保 PBR 材质正确应用环境贴图与贴图编码
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            const mat = child.material;
            // 对于 MeshStandardMaterial 或 MeshPhysicalMaterial，设置 envMapIntensity
            if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
              mat.envMapIntensity = 1.0;
            }
            // 如果材质有贴图，需要强制贴图为 gamma 编码
            ['map', 'emissiveMap', 'metalnessMap', 'roughnessMap'].forEach((slot) => {
              if (mat[slot]) {
                // 在早期版本里，可能没有 texture.encoding 属性
                // 这里尽量保持贴图在正确色彩空间，如果报错再删除此段
                try {
                  mat[slot].encoding = THREE.sRGBEncoding;
                } catch (e) {
                  // 如果编码属性不存在则忽略
                }
              }
            });
            mat.needsUpdate = true;
          }
        });

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

    // 11. 窗口或容器尺寸变化时调整相机与渲染器
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

    // 12. 清理
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('wheel', wheelHandler);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      initializedRef.current = false;
    };
  }, [fileUrl]);

  // 双击切换全屏/退出全屏
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
      {/* three.js 渲染器的 canvas 会插入到这里 */}
    </div>
  );
}

export default ModelViewer;
