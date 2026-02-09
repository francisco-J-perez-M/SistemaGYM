import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

/**
 * Componente BodyModel mejorado
 * Escala el modelo 3D basándose en las medidas corporales reales del usuario
 */
export default function BodyModel({ gender, metrics }) {
  const path =
    gender === "male"
      ? "/models/male/scene.gltf"
      : "/models/female/scene.gltf";

  const { scene } = useGLTF(path);

  // Calcular escalas basadas en métricas corporales REALES
  const scales = useMemo(() => {
    if (!metrics) {
      return { x: 1, y: 1, z: 1 };
    }

    // ===== MEDIDAS BASE DE REFERENCIA =====
    // Estas son las medidas "promedio" que usaremos como referencia
    const REFERENCE = gender === "male" ? {
      peso: 75,           // kg
      estatura: 1.75,     // metros
      pecho: 95,          // cm
      cintura: 85,        // cm
      cadera: 95,         // cm
      brazoDerecho: 30,   // cm
      brazoIzquierdo: 30, // cm
      musloDerecho: 50,   // cm
      musloIzquierdo: 50, // cm
      pantorrilla: 35,    // cm
      grasaCorporal: 20,  // %
      musculo: 40         // %
    } : {
      peso: 65,           // kg
      estatura: 1.65,     // metros
      pecho: 85,          // cm
      cintura: 70,        // cm
      cadera: 95,         // cm
      brazoDerecho: 25,   // cm
      brazoIzquierdo: 25, // cm
      musloDerecho: 48,   // cm
      musloIzquierdo: 48, // cm
      pantorrilla: 32,    // cm
      grasaCorporal: 25,  // %
      musculo: 35         // %
    };

    // ===== EXTRAER MÉTRICAS =====
    const peso = metrics.peso?.actual || REFERENCE.peso;
    const estatura = metrics.estatura || REFERENCE.estatura;
    const pecho = metrics.pecho || REFERENCE.pecho;
    const cintura = metrics.cintura || REFERENCE.cintura;
    const cadera = metrics.cadera || REFERENCE.cadera;
    const brazoDerecho = metrics.brazoDerecho || REFERENCE.brazoDerecho;
    const brazoIzquierdo = metrics.brazoIzquierdo || REFERENCE.brazoIzquierdo;
    const musloDerecho = metrics.musloDerecho || REFERENCE.musloDerecho;
    const musloIzquierdo = metrics.musloIzquierdo || REFERENCE.musloIzquierdo;
    const pantorrilla = metrics.pantorrilla || REFERENCE.pantorrilla;
    const grasaCorporal = metrics.grasaCorporal?.actual || REFERENCE.grasaCorporal;
    const musculo = metrics.musculo?.actual || REFERENCE.musculo;
    const imc = metrics.imc || 22;

    // ===== CALCULAR FACTORES DE ESCALA =====
    
    // 1. Factor de ALTURA (eje Y)
    // Basado en la estatura real vs referencia
    const alturaFactor = estatura / REFERENCE.estatura;
    
    // 2. Factor de ANCHURA TORSO (eje X - afectado por pecho, cintura y grasa)
    // Promedio de pecho y cintura comparado con referencia
    const torsoAnchura = (pecho + cintura) / 2;
    const torsoRef = (REFERENCE.pecho + REFERENCE.cintura) / 2;
    const anchoTorsoFactor = torsoAnchura / torsoRef;
    
    // 3. Factor de PROFUNDIDAD (eje Z - afectado por IMC y grasa corporal)
    // IMC normal está entre 18.5 y 24.9
    const imcFactor = imc < 18.5 ? 0.85 : 
                      imc <= 24.9 ? 1.0 : 
                      imc <= 29.9 ? 1 + ((imc - 24.9) * 0.04) : // Sobrepeso
                      1.2 + ((imc - 30) * 0.03); // Obesidad
    
    // La grasa corporal afecta principalmente la profundidad
    const grasaFactor = 1 + ((grasaCorporal - REFERENCE.grasaCorporal) * 0.008);
    
    // 4. Factor de MÚSCULO (afecta definición general)
    // Más músculo = ligeramente más volumen
    const musculoFactor = 1 + ((musculo - REFERENCE.musculo) * 0.004);
    
    // 5. Factor de CADERA (afecta parte inferior)
    const caderaFactor = cadera / REFERENCE.cadera;
    
    // ===== APLICAR ESCALAS CON LÍMITES REALISTAS =====
    
    // Escala en X (anchura): influenciada por torso, músculo y cadera
    const xScale = anchoTorsoFactor * musculoFactor * 0.85 + caderaFactor * 0.15;
    
    // Escala en Y (altura): principalmente por estatura, ligeramente por músculo
    const yScale = alturaFactor * musculoFactor;
    
    // Escala en Z (profundidad): IMC, grasa y músculo
    const zScale = imcFactor * grasaFactor * musculoFactor * 0.9;

    // Limitar a rangos realistas (0.7x - 1.5x del modelo base)
    return {
      x: Math.max(0.7, Math.min(1.5, xScale)),
      y: Math.max(0.7, Math.min(1.5, yScale)),
      z: Math.max(0.7, Math.min(1.5, zScale))
    };
  }, [metrics, gender]);

  // Configurar sombras y materiales
  useMemo(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
        
        // Ajustar material según composición corporal
        if (obj.material && metrics) {
          const grasaCorporal = metrics.grasaCorporal?.actual || 20;
          
          // Más grasa = piel más suave visualmente (mayor roughness)
          // Más músculo = piel más tensa (menor roughness)
          const musculo = metrics.musculo?.actual || 40;
          const roughness = 0.5 + (grasaCorporal * 0.004) - (musculo * 0.002);
          
          obj.material.roughness = Math.max(0.3, Math.min(0.9, roughness));
          obj.material.metalness = 0.0;
          obj.material.needsUpdate = true;
        }
      }
    });
  }, [scene, metrics]);

  return (
    <primitive
      object={scene}
      scale={[scales.x, scales.y, scales.z]}
      position={[0, -1.2, 0]}
      rotation={[0, Math.PI, 0]}
    />
  );
}

// Precargar modelos para mejor rendimiento
useGLTF.preload("/models/male/scene.gltf");
useGLTF.preload("/models/female/scene.gltf");