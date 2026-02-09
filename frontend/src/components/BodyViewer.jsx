import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import BodyModel from "./BodyModel";

/**
 * BodyViewer - Visualizador 3D del cuerpo humano
 * Muestra el modelo 3D con las proporciones adaptadas a las métricas del usuario
 */
export default function BodyViewer({ gender, metrics }) {
  return (
    <Canvas
      camera={{
        position: [0, 0.3, 2.5],
        fov: 50
      }}
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
      }}
      shadows
      gl={{ antialias: true, alpha: true }}
    >
      {/* ===== ILUMINACIÓN PROFESIONAL ===== */}
      
      {/* Luz ambiental suave para iluminación general */}
      <ambientLight intensity={0.4} />
      
      {/* Luz principal (key light) desde arriba y adelante */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
        shadow-bias={-0.0001}
      />
      
      {/* Luz de relleno (fill light) desde el lado opuesto */}
      <directionalLight
        position={[-5, 5, -3]}
        intensity={0.5}
      />
      
      {/* Luz trasera (rim light) para separar del fondo */}
      <directionalLight
        position={[0, 3, -8]}
        intensity={0.3}
        color="#4a90e2"
      />
      
      {/* Spotlight cenital para resaltar forma */}
      <spotLight
        position={[0, 10, 0]}
        angle={0.5}
        penumbra={1}
        intensity={0.4}
        castShadow
      />
      
      {/* Luces hemisféricas para simular luz del cielo y suelo */}
      <hemisphereLight
        skyColor="#ffffff"
        groundColor="#444444"
        intensity={0.3}
      />

      {/* ===== MODELO 3D ===== */}
      <BodyModel gender={gender} metrics={metrics} />

      {/* ===== SOMBRAS DE CONTACTO (más realistas) ===== */}
      <ContactShadows
        position={[0, -1.2, 0]}
        opacity={0.4}
        scale={3}
        blur={2}
        far={4}
      />

      {/* ===== AMBIENTE HDR OPCIONAL (descomentar si tienes archivos HDR) ===== */}
      {/* <Environment preset="studio" /> */}
      
      {/* ===== CONTROLES DE CÁMARA ===== */}
      <OrbitControls
        enablePan={false}
        minDistance={1.5}
        maxDistance={4.5}
        target={[0, 0, 0]}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        minPolarAngle={Math.PI / 6}    // No permitir ver desde muy arriba
        maxPolarAngle={Math.PI / 1.5}  // No permitir ver desde muy abajo
        autoRotate={false}             // Cambiar a true para rotación automática
        autoRotateSpeed={0.5}
      />
    </Canvas>
  );
}