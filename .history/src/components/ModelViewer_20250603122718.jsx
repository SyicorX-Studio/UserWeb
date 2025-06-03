import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
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

  // 标志位：确保只初始化一次
  const initializedRef = useRef(false);

  // 主 useEffect：初始化 three.js 场景
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    // 1. 创建场景
    const scene = new THREE.Scene();
    scene.background = null; // 保持背景透明
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
    renderer.setClearColor(0x000000, 0);               // 背景透明
    renderer.outputEncoding = THREE.sRGBEncoding;      // 正确的色彩空间输出
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;           // 物理光照模式
    renderer.domElement.style.display = 'block';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. 添加光照（仅作为补充，主要依赖环境贴图）
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 10, 7.5);
    scene.add(dirLight);

    // 5. OrbitControls
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

    // 7. PMREM 生成器，用于环境贴图
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // 8. 加载环境 HDR 或 equirectangular 图
    //    假设你在 public/environments/studio.hdr
    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .setPath('/environments/')
      .load('studio.hdr', (hdrEquirect) => {
        hdrEquirect.mapping = THREE.EquirectangularReflectionMapping;
        const envMap = pmremGenerator.fromEquirectangular(hdrEquirect).texture;
        scene.environment = envMap;         // 为 PBR 材质提供反射
        scene.background = envMap;          // 可选：如果想让背景显示为 HDR 环境
        hdrEquirect.dispose();
        pmremGenerator.dispose();
      });

    // 9. 加载 GLB 模型
    const loader = new GLTFLoader();
    loader.load(
      fileUrl,
      (gltf) => {
        const model = gltf.scene;
        // 计算包围盒，把模型中心移动到 (0,0,0)
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // 缩放到合适大小
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 2) {
          const scale = 2 / maxDim;
          model.scale.setScalar(scale);
        }

        // 确保所有网格材料都正确设置 envMapIntensity 与纹理编码
        model.traverse((child) => {
          if (child.isMesh && child.material) {
            const mat = child.material;
            // 如果是标准 PBR 材质，envMap 由 scene.environment 提供
            if ('envMapIntensity' in mat) {
              mat.envMapIntensity = 1.0;
            }
            // 如果材质包含贴图，则确保贴图的编码是 sRGB
            ['map', 'emissiveMap', 'metalnessMap', 'roughnessMap'].forEach((texSlot) => {
              if (mat[texSlot]) {
                mat[texSlot].encoding = THREE.sRGBEncoding;
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

    // 11. 窗口大小变化时更新尺寸
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
      controls.dispose();
      renderer.domElement.removeEventListener('wheel', wheelHandler);
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
    // 全屏切换后立即触发一次 resize，保证画布尺寸更新
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
      {/* three.js canvas 会动态插入到这里 */}
    </div>
  );
}

export default ModelViewer;
