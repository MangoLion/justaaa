import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const ModelViewer = ({ model, modelType, showWireframe = false, showGrid = false, backgroundColor = '#333333' }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const gridRef = useRef(null);
  const cameraRef = useRef(null);
  const pointLightRef = useRef(null);
  const originalMaterialsRef = useRef(new Map());

  useEffect(() => {
    if (!model) return;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(backgroundColor);

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ 
      antialias: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;  // Updated from outputEncoding

    mountRef.current?.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;

    // Simplified lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    // Add point light that will follow camera
    const pointLight = new THREE.PointLight(0xffffff, 1.0);
    pointLightRef.current = pointLight;
    scene.add(pointLight);

    // Create grid
    const grid = new THREE.GridHelper(20, 20, 0xffffff, 0xffffff);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    gridRef.current = grid;

    if (showGrid) {
      scene.add(grid);
    }

    let loader;
    switch (modelType) {
      case 'glb':
      case 'gltf':
        loader = new GLTFLoader();
        break;
      case 'fbx':
        loader = new FBXLoader();
        break;
      case 'obj':
        loader = new OBJLoader();
        break;
      default:
        console.error('Unsupported model type');
        return;
    }

    const modelUrl = model.data.startsWith('blob:') ? model.data : (() => {
      const byteCharacters = atob(model.data.split(',')[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: model.type });
      return URL.createObjectURL(blob);
    })();

    loader.load(modelUrl, (object) => {
      if (modelType === 'glb' || modelType === 'gltf') {
        object = object.scene;
      }
      
      object.traverse((child) => {
        if (child.isMesh) {
          const originalMaterial = child.material;
          originalMaterialsRef.current.set(child, originalMaterial.clone());
          
          const material = new THREE.MeshStandardMaterial({
            color: originalMaterial.color || 0xcccccc,
            map: originalMaterial.map,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.7,
          });

          if (showWireframe) {
            const wireframeMaterial = new THREE.WireframeGeometry(child.geometry);
            const line = new THREE.LineSegments(wireframeMaterial);
            line.material.color = new THREE.Color(0xffffff);
            line.material.opacity = 0.5;
            line.material.transparent = true;
            child.add(line);
          }

          child.material = material;
        }
      });

      scene.add(object);

      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = 60;
      const cameraZ = Math.abs(maxDim / 2 / Math.tan((fov / 2) * Math.PI / 180));

      camera.position.z = cameraZ * 1.5;
      const minZ = box.min.z;
      const cameraToFarEdge = (cameraZ - minZ) * 3;
      camera.far = cameraToFarEdge;
      camera.updateProjectionMatrix();

      camera.lookAt(center);
      controls.target.copy(center);
    });

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Update point light position to match camera
      if (pointLightRef.current && cameraRef.current) {
        pointLightRef.current.position.copy(cameraRef.current.position);
      }
      
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      if (!model.data.startsWith('blob:')) {
        URL.revokeObjectURL(modelUrl);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, [model, modelType, backgroundColor]);

  // Effect for toggling grid
  useEffect(() => {
    if (!sceneRef.current || !gridRef.current) return;

    if (showGrid) {
      sceneRef.current.add(gridRef.current);
    } else {
      sceneRef.current.remove(gridRef.current);
    }
  }, [showGrid]);

  // Effect for toggling wireframe
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.traverse((child) => {
      if (child.isMesh) {
        const existingWireframe = child.children.find(c => c instanceof THREE.LineSegments);
        if (existingWireframe) {
          child.remove(existingWireframe);
          existingWireframe.geometry.dispose();
          existingWireframe.material.dispose();
        }

        if (showWireframe) {
          const wireframeMaterial = new THREE.WireframeGeometry(child.geometry);
          const line = new THREE.LineSegments(wireframeMaterial);
          line.material.color = new THREE.Color(0xffffff);
          line.material.opacity = 0.5;
          line.material.transparent = true;
          child.add(line);
        }
      }
    });
  }, [showWireframe]);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
};

export default ModelViewer;