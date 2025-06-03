import { useEffect, useRef } from 'react';

export default function SpeedLinesBackground() {
  const canvasRef = useRef(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    let cx = width / 2;
    let cy = height / 2;

    canvas.width = width;
    canvas.height = height;

    const particles = [];
    const perspective = 600;
    const baseSpeed = 2;
    const lengthMultiplier = 10;

    let rotation = { x: 0, y: 0 };
    let isPointerDown = false;
    let lastTouchX, lastTouchY;

    // 初始化所有粒子
    function createParticle() {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 200 + 50;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.random() * 400 + 200;
      return { x, y, z, prevZ: z };
    }

    // 重新创建粒子
    function recreateParticle() {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 200 + 50;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = Math.random() * 200 + 400;
      return { x, y, z, prevZ: z };
    }

    for (let i = 0; i < 100; i++) {
      particles.push(createParticle());
    }

    function project(p) {
      const sinY = Math.sin(rotation.y);
      const cosY = Math.cos(rotation.y);
      const sinX = Math.sin(rotation.x);
      const cosX = Math.cos(rotation.x);

      // Yaw
      let dx = cosY * p.x - sinY * p.z;
      let dz = sinY * p.x + cosY * p.z;

      // Pitch
      let dy = cosX * p.y - sinX * dz;
      dz = sinX * p.y + cosX * dz;

      if (dz <= 0.1) dz = 0.1;

      const scale = perspective / dz;
      const screenX = cx + dx * scale;
      const screenY = cy + dy * scale;
      return { x: screenX, y: screenY, z: dz, scale };
    }

    function draw() {
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      ctx.lineCap = 'round';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      for (let p of particles) {
        p.prevZ = p.z;
        p.z -= isPointerDown ? baseSpeed * 2 : baseSpeed; // 按下加速

        if (p.z <= 0.1) {
          Object.assign(p, recreateParticle());
          continue;
        }

        const current = project(p);
        const temp = { x: p.x, y: p.y, z: p.prevZ };
        const prev = project(temp);

        ctx.strokeStyle = `rgba(0, 255, 0, ${Math.max(0, 1 - p.z / 400)})`;
        ctx.lineWidth = Math.max(5, 6 * (1 - p.z / 400));

        const dirX = current.x - prev.x;
        const dirY = current.y - prev.y;

        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(prev.x + dirX * lengthMultiplier, prev.y + dirY * lengthMultiplier);
        ctx.stroke();
      }

      // 平滑视角过渡
      rotation.x += (targetRotation.current.x - rotation.x) * 0.05;
      rotation.y += (targetRotation.current.y - rotation.y) * 0.05;

      requestAnimationFrame(draw);
    }

    // 鼠标事件处理
    document.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const inCanvas =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (inCanvas) {
        const offsetX = e.clientX - (rect.left + rect.width / 2);
        const offsetY = e.clientY - (rect.top + rect.height / 2);
        targetRotation.current.x = (offsetY / rect.height) * 1.0;
        targetRotation.current.y = (offsetX / rect.width) * 1.0;
      } else {
        targetRotation.current.x *= 0.9;
        targetRotation.current.y *= 0.9;
      }
    });

    window.addEventListener('mousedown', () => (isPointerDown = true));
    window.addEventListener('mouseup', () => (isPointerDown = false));

    // 触摸事件处理
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        isPointerDown = true;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1 && isPointerDown) {
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();

        const deltaX = touch.clientX - lastTouchX;
        const deltaY = touch.clientY - lastTouchY;
        targetRotation.current.x -= (deltaY / rect.height) * 1.0;
        targetRotation.current.y -= (deltaX / rect.width) * 1.0;
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
        targetRotation.current.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotation.current.x));
        targetRotation.current.y = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, targetRotation.current.y));
      }
    };

    const handleTouchEnd = () => {
      isPointerDown = false;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);

    window.addEventListener('resize', () => {
      width = window.innerWidth;
      height = window.innerHeight;
      cx = width / 2;
      cy = height / 2;
      canvas.width = width;
      canvas.height = height;
    });

    draw();

    return () => {
      window.removeEventListener('resize', null);
      document.removeEventListener('mousemove', null);
      window.removeEventListener('mouseup', null);
      window.removeEventListener('mousedown', null);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        backgroundColor: 'black',
        display: 'block',
      }}
    />
  );
}