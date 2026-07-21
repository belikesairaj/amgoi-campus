import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CampusEntranceSceneProps {
  selectedWing: string | null;
  onWingClick: (name: string) => void;
}

const CampusEntranceScene: React.FC<CampusEntranceSceneProps> = ({ selectedWing, onWingClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const wingsRef = useRef<Record<string, THREE.Group>>({});

  // Smooth lerp states
  const targetCamPos = useRef(new THREE.Vector3(0, 200, 350));
  const targetCamLookAt = useRef(new THREE.Vector3(0, 20, -100));
  const currentCamPos = useRef(new THREE.Vector3(0, 200, 350));
  const currentCamLookAt = useRef(new THREE.Vector3(0, 20, -100));

  // Check if mobile device
  const isMobile = () => window.innerWidth < 768;

  // --- Persistent Highlight Logic ---
  useEffect(() => {
    // Reset all highlights first
    Object.entries(wingsRef.current).forEach(([_name, group]) => {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          // Standard color
          if (child.name === 'body') {
            child.material.color.setHex(0xf1f5f9);
          } else if (child.name === 'stripe') {
            child.material.color.setHex(0x1e293b);
          }
        }
      });
    });

    // Apply highlight to selected wing
    if (selectedWing && wingsRef.current[selectedWing]) {
      wingsRef.current[selectedWing].traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          // Highlight color (Slate-400 or Primary-like)
          child.material.color.setHex(0x94a3b8);
        }
      });
    }

    // Determine camera targets based on selected wing
    switch (selectedWing) {
      case 'Centre Wing':
        targetCamPos.current.set(0, 150, -120);
        targetCamLookAt.current.set(0, 42, -270);
        break;
      case 'Left Wing':
        targetCamPos.current.set(-100, 130, -50);
        targetCamLookAt.current.set(-132, 36, -180);
        break;
      case 'Right Wing':
        targetCamPos.current.set(100, 130, -50);
        targetCamLookAt.current.set(132, 36, -180);
        break;
      default:
        // Overview Position - adjust for mobile
        if (isMobile()) {
          // Mobile: camera further back and higher for better framing
          targetCamPos.current.set(0, 250, 450);
          targetCamLookAt.current.set(0, 20, -100);
        } else {
          // Desktop: original position
          targetCamPos.current.set(0, 200, 350);
          targetCamLookAt.current.set(0, 20, -100);
        }
        break;
    }
  }, [selectedWing]);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Light sky blue
    sceneRef.current = scene;

    // --- Camera Setup ---
    const camera = new THREE.PerspectiveCamera(
      isMobile() ? 60 : 50, // Wider FOV on mobile for better framing
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      10000
    );
    
    // Set initial camera position based on device
    if (isMobile()) {
      currentCamPos.current.set(0, 250, 450);
      targetCamPos.current.set(0, 250, 450);
    }
    
    camera.position.copy(currentCamPos.current);
    camera.lookAt(currentCamLookAt.current);
    cameraRef.current = camera;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

    // --- Lighting System ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.3);
    directionalLight.position.set(200, 300, 150);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 4096;
    directionalLight.shadow.mapSize.height = 4096;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 1000;
    directionalLight.shadow.camera.left = -300;
    directionalLight.shadow.camera.right = 300;
    directionalLight.shadow.camera.top = 300;
    directionalLight.shadow.camera.bottom = -300;
    scene.add(directionalLight);

    // --- Ground & Environment ---
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Materials
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });
    const walkwayMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 1.0 });
    const darkAccentMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.5 });

    // 1. Central Walkway
    const walkwayGeom = new THREE.PlaneGeometry(48, 600);
    const walkway = new THREE.Mesh(walkwayGeom, walkwayMat);
    walkway.rotation.x = -Math.PI / 2;
    walkway.position.z = 0;
    walkway.receiveShadow = true;
    worldGroup.add(walkway);

    // 2. Side Walkways for Wings
    const sideWalkwayGeom = new THREE.PlaneGeometry(200, 24);
    const sideWalkway = new THREE.Mesh(sideWalkwayGeom, walkwayMat);
    sideWalkway.rotation.x = -Math.PI / 2;
    sideWalkway.position.set(0, 0.01, -180);
    sideWalkway.receiveShadow = true;
    worldGroup.add(sideWalkway);

    // 3. Grass Area
    const grassGeom = new THREE.PlaneGeometry(2000, 2000);
    const grass = new THREE.Mesh(grassGeom, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.5;
    grass.receiveShadow = true;
    worldGroup.add(grass);

    // 4. Entrance Platform
    const platformGeom = new THREE.BoxGeometry(120, 2.4, 60);
    const platform = new THREE.Mesh(platformGeom, concreteMat);
    platform.position.set(0, 1.2, 0);
    platform.receiveShadow = true;
    worldGroup.add(platform);

    // 5. Trees Helper
    const createTree = (x: number, z: number) => {
      const treeGroup = new THREE.Group();
      const trunkGeom = new THREE.CylinderGeometry(1.2, 1.8, 9);
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
      const trunk = new THREE.Mesh(trunkGeom, trunkMat);
      trunk.position.y = 4.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);
      const leavesGeom = new THREE.ConeGeometry(7.2, 18, 8);
      const leavesMat = new THREE.MeshStandardMaterial({ color: 0x166534 });
      const leaves = new THREE.Mesh(leavesGeom, leavesMat);
      leaves.position.y = 15;
      leaves.castShadow = true;
      treeGroup.add(leaves);
      treeGroup.position.set(x, 0, z);
      return treeGroup;
    };

    // Trees along the main walkway
    for (let i = -2; i < 6; i++) {
        if (i === 0) continue;
        const z = i * 60;
        worldGroup.add(createTree(-48, z));
        worldGroup.add(createTree(48, z));
    }

    // --- Ultra-High-Resolution Label Helper ---
    const createLabel = (text: string, bgColor = 'rgba(15, 23, 42, 0.95)') => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      canvas.width = 4096;
      canvas.height = 1024;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = bgColor;
      ctx.beginPath();
      ctx.roundRect(400, 200, 3296, 624, 312);
      ctx.fill();
      ctx.font = 'bold 280px "Inter", "Arial", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.anisotropy = maxAnisotropy;
      texture.generateMipmaps = true;
      
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(100, 25, 1);
      return sprite;
    };

    // --- Entrance Architecture ---
    const gateGroup = new THREE.Group();
    gateGroup.name = 'Entrance gate';
    scene.add(gateGroup);
    interactiveObjectsRef.current.push(gateGroup);

    const pillarGeom = new THREE.BoxGeometry(9, 36, 9);
    const pLeft = new THREE.Mesh(pillarGeom, pillarMat.clone());
    pLeft.position.set(-30, 18, 0); pLeft.castShadow = true; gateGroup.add(pLeft);
    const pRight = new THREE.Mesh(pillarGeom, pillarMat.clone());
    pRight.position.set(30, 18, 0); pRight.castShadow = true; gateGroup.add(pRight);
    
    const beamGeom = new THREE.BoxGeometry(78, 7.2, 10.8);
    const beam = new THREE.Mesh(beamGeom, pillarMat.clone());
    beam.position.set(0, 36, 0); beam.castShadow = true; gateGroup.add(beam);
    
    const accGeom = new THREE.BoxGeometry(79.2, 0.6, 11.4);
    const accT = new THREE.Mesh(accGeom, darkAccentMat.clone()); accT.position.set(0, 39.6, 0); gateGroup.add(accT);
    const accB = new THREE.Mesh(accGeom, darkAccentMat.clone()); accB.position.set(0, 32.4, 0); gateGroup.add(accB);

    const entranceSign = createLabel('AMGOI CAMPUS');
    if (entranceSign) { 
        entranceSign.position.set(0, 51, 0); 
        gateGroup.add(entranceSign); 
    }

    // --- Building Helper ---
    const createAcademicWing = (name: string, width: number, height: number, depth: number, x: number, y: number, z: number, rotationY = 0) => {
      const wingGroup = new THREE.Group();
      wingGroup.name = name;
      wingGroup.position.set(x, y, z);
      wingGroup.rotation.y = rotationY;
      
      const bodyGeom = new THREE.BoxGeometry(width, height, depth);
      const body = new THREE.Mesh(bodyGeom, concreteMat.clone());
      body.name = 'body';
      body.position.y = height / 2;
      body.castShadow = true;
      body.receiveShadow = true;
      wingGroup.add(body);

      const stripeGeom = new THREE.BoxGeometry(width + 1.2, 3, depth + 1.2);
      const stripeTop = new THREE.Mesh(stripeGeom, darkAccentMat.clone());
      stripeTop.name = 'stripe';
      stripeTop.position.y = height - 6;
      wingGroup.add(stripeTop);
      const stripeBot = new THREE.Mesh(stripeGeom, darkAccentMat.clone());
      stripeBot.name = 'stripe';
      stripeBot.position.y = 9;
      wingGroup.add(stripeBot);

      const label = createLabel(name);
      if (label) {
        label.position.y = height + 21;
        label.scale.set(120, 30, 1);
        wingGroup.add(label);
      }

      scene.add(wingGroup);
      interactiveObjectsRef.current.push(wingGroup);
      wingsRef.current[name] = wingGroup;
      return wingGroup;
    };

    // Centre Wing
    createAcademicWing('Centre Wing', 108, 84, 72, 0, 0, -270);

    // Left Wing
    createAcademicWing('Left Wing', 84, 72, 60, -132, 0, -180, Math.PI / 4);

    // Right Wing
    createAcademicWing('Right Wing', 84, 72, 60, 132, 0, -180, -Math.PI / 4);

    // --- Interaction ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      
      const intersects = raycaster.intersectObjects(interactiveObjectsRef.current, true);
      if (intersects.length > 0) {
        let target: THREE.Object3D | null = intersects[0].object;
        while (target && !interactiveObjectsRef.current.includes(target)) {
          target = target.parent;
        }

        if (target && target.name) {
          if (target.name === 'Entrance gate') {
            console.log('Entrance selected');
          } else {
            console.log(`${target.name} clicked`);
            onWingClick(target.name);
          }
        }
      }
    };

    // Attach listener to container instead of window
    const container = containerRef.current;
    container.addEventListener('click', onMouseClick);
    
    const onTouchStart = (e: TouchEvent) => {
        if(e.touches.length > 0) {
            const touch = e.touches[0];
            const clickEvent = new MouseEvent('click', { clientX: touch.clientX, clientY: touch.clientY });
            onMouseClick(clickEvent);
        }
    };
    container.addEventListener('touchstart', onTouchStart);

    // --- Resize Handler ---
    const onResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      
      // Update FOV based on screen size
      camera.fov = isMobile() ? 60 : 50;
      
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      
      // Update camera position for mobile/desktop when not focused on a wing
      if (!selectedWing) {
        if (isMobile()) {
          targetCamPos.current.set(0, 250, 450);
          currentCamPos.current.set(0, 250, 450);
        } else {
          targetCamPos.current.set(0, 200, 350);
          currentCamPos.current.set(0, 200, 350);
        }
      }
    };
    window.addEventListener('resize', onResize);

    // --- Animation Loop ---
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Smooth camera lerp
      currentCamPos.current.lerp(targetCamPos.current, 0.08); // Slightly faster lerp for snappier feel
      currentCamLookAt.current.lerp(targetCamLookAt.current, 0.08);

      if (cameraRef.current) {
        cameraRef.current.position.copy(currentCamPos.current);
        cameraRef.current.lookAt(currentCamLookAt.current);
      }

      renderer.render(scene, camera);
    };
    animate();

    // --- Cleanup ---
    return () => {
      container.removeEventListener('click', onMouseClick);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
              obj.geometry.dispose();
              if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
              else obj.material.dispose();
          }
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full min-h-[600px] rounded-2xl overflow-hidden shadow-2xl border border-border bg-slate-50 cursor-pointer"
    />
  );
};

export default CampusEntranceScene;
