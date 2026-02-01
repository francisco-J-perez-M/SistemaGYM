import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";

// Si usas el BodyModel interno que pegaste al principio:
function BodyModel({ gender }) {
  const modelPath =
    gender === "male"
      ? "/models/male/scene.gltf"
      : "/models/female/scene.gltf";

  const { scene } = useGLTF(modelPath);

  return (
    <primitive 
      object={scene} 
      // 1. Aumentamos la escala base
      scale={2.2} 
      // 2. Bajamos un poco más la posición Y para centrar el cuerpo al crecer
      position={[0, -2.0, 0]} 
    />
  );
}

export default function BodyViewer({ gender }) {
  return (
    <Canvas 
      // 3. CAMBIOS CLAVE AQUÍ:
      // - position: [0, 0.5, 2.5] -> Acercamos la cámara en Z (de 4 a 2.5) y bajamos Y
      // - fov: 50 -> Un campo de visión un poco más estrecho ayuda a llenar la pantalla
      camera={{ position: [0, 0.5, 2.5], fov: 50 }}
    >
      {/* LUCES */}
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />
      <directionalLight position={[-5, 5, -5]} intensity={0.6} />

      <BodyModel gender={gender} />

      <OrbitControls
        enablePan={false}
        // 4. Permitimos que el usuario se acerque más (antes estaba en 2.5)
        minDistance={1.5}
        maxDistance={6}
        // Opcional: Centrar el punto de pivote de la rotación en el pecho/cintura
        target={[0, 0, 0]}
      />
    </Canvas>
  );
}