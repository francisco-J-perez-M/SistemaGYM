import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useMemo } from "react";
// Componente del modelo 3D con escalado basado en métricas reales
function BodyModel({ gender, metrics }) {
  const modelPath =
    gender === "male"
      ? "/models/male/scene.gltf"
      : "/models/female/scene.gltf";

  const { scene } = useGLTF(modelPath);

  // Calcular escalas basadas en métricas corporales REALES
  const scales = useMemo(() => {
    if (!metrics) {
      return { x: 2.2, y: 2.2, z: 2.2 };
    }

    const baseScale = 2.2;
    
    // Factor de grasa corporal (afecta principalmente anchura)
    // Rango típico: 10-40% -> Factor: 0.9-1.15
    const grasaFactor = 1 + ((metrics.grasaCorporal.actual - 20) * 0.006);
    
    // Factor de músculo (afecta definición y volumen)
    // Rango típico: 30-50% -> Factor: 0.95-1.1
    const musculoFactor = 1 + ((metrics.musculo.actual - 40) * 0.0025);
    
    // Factor de IMC (afecta escala general)
    // IMC normal: 18.5-24.9
    const imcFactor = metrics.imc < 18.5 ? 0.92 : 
                      metrics.imc > 24.9 ? 1 + ((metrics.imc - 24.9) * 0.02) : 
                      1.0;
    
    // Aplicar factores de forma realista
    const xScale = baseScale * grasaFactor * imcFactor;  // Anchura (afectada por grasa e IMC)
    const yScale = baseScale * musculoFactor;             // Altura (afectada por músculo)
    const zScale = baseScale * grasaFactor * imcFactor;  // Profundidad (afectada por grasa e IMC)

    return {
      x: Math.max(1.8, Math.min(3.0, xScale)),  // Limitar rango realista
      y: Math.max(1.8, Math.min(2.8, yScale)),
      z: Math.max(1.8, Math.min(3.0, zScale))
    };
  }, [metrics]);

  // Configurar sombras y materiales
  useMemo(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        
        // Ajustar material según grasa corporal
        if (obj.material && metrics) {
          // Más grasa = piel más suave visualmente
          obj.material.roughness = 0.6 + (metrics.grasaCorporal.actual * 0.003);
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [scene, metrics]);

  return (
    <primitive 
      object={scene} 
      scale={[scales.x, scales.y, scales.z]}
      position={[0, -2.0, 0]} 
      rotation={[0, Math.PI, 0]}
    />
  );
}

export default function BodyViewer({ gender, metrics }) {
  return (
    <Canvas 
      camera={{ 
        position: [0, 0.5, 3.5], 
        fov: 45 
      }}
      style={{ 
        width: '100%', 
        height: '100%',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
      }}
      shadows
    >
      {/* ILUMINACIÓN PROFESIONAL */}
      <ambientLight intensity={0.5} />
      
      {/* Luz principal */}
      <directionalLight 
        position={[5, 8, 5]} 
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Luz de relleno */}
      <directionalLight 
        position={[-5, 5, -5]} 
        intensity={0.7} 
      />
      
      {/* Luz trasera para profundidad */}
      <directionalLight 
        position={[0, 3, -8]} 
        intensity={0.4}
        color="#4a90e2"
      />
      
      {/* Spotlight desde arriba */}
      <spotLight
        position={[0, 12, 0]}
        angle={0.4}
        penumbra={1}
        intensity={0.6}
        castShadow
      />

      {/* MODELO 3D */}
      <BodyModel gender={gender} metrics={metrics} />

      {/* Plano de suelo para sombras */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -2, 0]} 
        receiveShadow
      >
        <planeGeometry args={[10, 10]} />
        <shadowMaterial opacity={0.2} />
      </mesh>

      {/* CONTROLES DE CÁMARA */}
      <OrbitControls
        enablePan={false}
        minDistance={2.0}
        maxDistance={6.0}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.8}
      />
      
      {/* Ambiente HDR para reflejos realistas (opcional) */}
    </Canvas>
  );
}

// Precargar modelos para mejor rendimiento
useGLTF.preload("/models/male/scene.gltf");
useGLTF.preload("/models/female/scene.gltf");