import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

export default function BodyModel({ gender, grasa, musculo }) {
  const path =
    gender === "male"
      ? "/models/male/scene.gltf"
      : "/models/female/scene.gltf";

  const { scene } = useGLTF(path);

  // Escalado simple basado en métricas
  const fatScale = 1 + grasa * 0.003;
  const muscleScale = 1 + musculo * 0.002;

  const scale = useMemo(
    () => [fatScale * muscleScale, muscleScale, fatScale * muscleScale],
    [fatScale, muscleScale]
  );

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
      position={[0, -1.2, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}
