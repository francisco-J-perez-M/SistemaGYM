import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

/**
 * BodyModel — escala un modelo GLTF estático según las métricas reales del usuario.
 *
 * Limitación conocida: el modelo es una malla rígida (sin morph targets ni huesos
 * expuestos por zona), así que la deformación es por escala global (X=ancho,
 * Y=alto, Z=profundidad). Aun así, separamos "complexión" (grasa/IMC) de
 * "musculatura" para que un cuerpo con grasa se vea ancho y profundo (barriga),
 * uno musculoso se vea más ancho de torso y tenso, y uno delgado más estilizado.
 */
export default function BodyModel({ gender, metrics }) {
  const isFemale = gender === "female";
  const path = isFemale ? "/models/female/scene.gltf" : "/models/male/scene.gltf";
  const { scene } = useGLTF(path);

  const { fatness, muscularity, scales } = useMemo(() => {
    // ===== Referencias "promedio" por sexo =====
    const REF = isFemale
      ? { estatura: 1.65, pecho: 88, cintura: 72, cadera: 96, grasa: 25, musculo: 35, imc: 22 }
      : { estatura: 1.75, pecho: 98, cintura: 85, cadera: 96, grasa: 18, musculo: 42, imc: 23 };

    const m = metrics || {};
    const num = (v, d) => (Number.isFinite(+v) && +v > 0 ? +v : d);

    const estatura = num(m.estatura, REF.estatura);
    const pecho    = num(m.pecho,    REF.pecho);
    const cintura  = num(m.cintura,  REF.cintura);
    const cadera   = num(m.cadera,   REF.cadera);
    const grasa    = num(m.grasaCorporal?.actual ?? m.grasaCorporal, REF.grasa);
    const musculo  = num(m.musculo?.actual ?? m.musculo, REF.musculo);
    const imc      = num(m.imc, REF.imc);

    // Pantorrillas: promedio de ambas si existen (compatibilidad con `pantorrilla` único)
    const pantDer = num(m.pantorrillaDerecha,   m.pantorrilla);
    const pantIzq = num(m.pantorrillaIzquierda, m.pantorrilla);
    const pantorrilla = (pantDer || pantIzq)
      ? ((pantDer || pantIzq) + (pantIzq || pantDer)) / 2
      : 0;

    // ===== Índices normalizados =====
    // Grasa/complexión: combina exceso de IMC y de % grasa. 0 = delgado/normal.
    const imcExceso  = Math.max(0, imc - 23);
    const imcDeficit = Math.max(0, 20 - imc);
    const grasaExceso = Math.max(0, grasa - REF.grasa);
    const fatness  = Math.min(1.6, imcExceso * 0.07 + grasaExceso * 0.025);
    const leanness = Math.min(0.5, imcDeficit * 0.05 + Math.max(0, REF.grasa - grasa) * 0.012);
    // Musculatura: % músculo por encima de la referencia.
    const muscularity = Math.min(1.1, Math.max(0, musculo - REF.musculo) * 0.025);

    // Circunferencia de torso vs referencia (ancho real medido).
    const torsoFactor  = ((pecho + cintura) / 2) / ((REF.pecho + REF.cintura) / 2);
    const caderaFactor = cadera / REF.cadera;
    const piernaFactor = pantorrilla ? pantorrilla / (isFemale ? 35 : 37) : 1;

    // ===== Escalas =====
    // Ancho (X): torso medido + ensanchamiento por músculo + algo de grasa + caderas
    let x = 1
      + (torsoFactor - 1) * 0.6
      + muscularity * 0.20
      + fatness * 0.18
      - leanness * 0.14
      + (caderaFactor - 1) * (isFemale ? 0.22 : 0.12);

    // Profundidad (Z): dominada por la grasa (barriga); músculo aporta algo
    let z = 1
      + fatness * 0.50
      + muscularity * 0.12
      - leanness * 0.22
      + (torsoFactor - 1) * 0.20;

    // Alto (Y): estatura; el músculo casi no cambia la altura
    let y = (estatura / REF.estatura) * (1 + muscularity * 0.02);
    // Las piernas más gruesas suben un pelín el volumen inferior (aprox. vía Y/X menor)
    x += (piernaFactor - 1) * 0.04;

    return {
      fatness,
      muscularity,
      scales: {
        x: Math.max(0.7, Math.min(1.7, x)),
        y: Math.max(0.8, Math.min(1.3, y)),
        z: Math.max(0.7, Math.min(1.8, z)),
      },
    };
  }, [metrics, isFemale]);

  // Materiales: más grasa → piel más suave (roughness alto); más músculo → más tensa.
  useMemo(() => {
    scene.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.castShadow = true;
      obj.receiveShadow = true;
      if (obj.material) {
        const roughness = 0.55 + fatness * 0.18 - muscularity * 0.18;
        obj.material.roughness = Math.max(0.3, Math.min(0.95, roughness));
        obj.material.metalness = 0.0;
        obj.material.needsUpdate = true;
      }
    });
  }, [scene, fatness, muscularity]);

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
