import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Componente del modelo 3D
function BodyModel({ gender, metrics }) {
  const modelPath =
    gender === "male"
      ? "/models/male/scene.gltf"
      : "/models/female/scene.gltf";

  const { scene } = useGLTF(modelPath);

  // Calcular escala basada en métricas (opcional)
  const baseScale = 2.2;
  
  // Si quieres que el modelo cambie según las métricas:
  // const fatScale = metrics ? 1 + (metrics.grasaCorporal.actual * 0.003) : 1;
  // const muscleScale = metrics ? 1 + (metrics.musculo.actual * 0.002) : 1;
  // const scale = baseScale * fatScale * muscleScale;
  
  const scale = baseScale; // Usar escala fija por ahora

  // Configurar sombras
  scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });

  return (
    <primitive 
      object={scene} 
      scale={scale} 
      position={[0, -2.0, 0]} 
      rotation={[0, Math.PI, 0]}
    />
  );
}

export default function BodyViewer({ gender, metrics }) {
  return (
    <Canvas 
      camera={{ 
        position: [0, 0.5, 2.5], 
        fov: 50 
      }}
      style={{ 
        width: '100%', 
        height: '100%' 
      }}
    >
      {/* LUCES MEJORADAS */}
      <ambientLight intensity={0.7} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1.2}
        castShadow
      />
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.6} 
      />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={0.5}
        castShadow
      />

      {/* MODELO 3D */}
      <BodyModel gender={gender} metrics={metrics} />

      {/* CONTROLES DE CÁMARA */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={6}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
      />
    </Canvas>
  );
}

// Precargar modelos para mejor rendimiento
useGLTF.preload("/models/male/scene.gltf");
useGLTF.preload("/models/female/scene.gltf");