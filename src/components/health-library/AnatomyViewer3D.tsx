"use client";

import { Suspense, useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Environment, Bounds, useBounds } from "@react-three/drei";
import * as THREE from "three";

// Map region IDs to mesh name keywords for highlighting
// Uses a function-based matcher for precision
function meshMatchesRegion(meshName: string, regionId: string): boolean {
  const n = meshName.toLowerCase();

  switch (regionId) {
    case "heart":
      // Z-Anatomy upstream has no outer heart wall mesh, so the export
      // (export_v2.py) drops the internal valve leaflets and papillary
      // muscles — what's left is the four chambers + pulmonary trunk, which
      // visually merge into a heart-shaped blob. "left/right ventricle"
      // phrase keeps us from highlighting brain ventricles by accident.
      return n.includes("atrium") || n.includes("left ventricle") ||
        n.includes("right ventricle") || n.includes("pulmonary trunk") ||
        n.includes("pulmonary vein") || n.includes("aorta") ||
        n.includes("coronary artery") || n.includes("coronary vein");
    case "lungs":
      return (n.includes("lung") || n.includes("diaphragm") || n.includes("bronch") ||
        n.includes("pleura")) && !n.includes("lingula of cerebellum");
    case "stomach":
      return n.includes("stomach") || n.includes("intestin") || n.includes("colon") ||
        n.includes("duodenum") || n.includes("jejunum") || n.includes("ileum") ||
        n.includes("liver") || n.includes("hepat") || n.includes("gallbladder") ||
        n.includes("pancrea") || n.includes("spleen") || n.includes("esophag") ||
        n.includes("cecum") || n.includes("rectum") || n.includes("appendix") ||
        n.includes("sigmoid") || n.includes("omental") || n.includes("mucosa of stomach") ||
        n.includes("meso-appendix") || n.includes("mesocolon");
    case "kidneys":
      return n.includes("kidney") || n.includes("renal pelvis") ||
        n.includes("urinary bladder") || n.includes("suprarenal gland") ||
        (n.includes("bladder") && !n.includes("gallbladder"));
    case "head":
      // Z-Anatomy uses specific neuroanatomical names, not "brain" / "cerebrum".
      // The hemisphere surface is "White matter of telencephalon.{l,r}", the
      // cerebellum is a set of lobules, and lobes are gyri/sulci.
      return n.includes("telencephalon") || n.includes("corpus callosum") ||
        n.includes("septum pellucidum") || n.includes("fornix") ||
        n.includes("hippocamp") || n.includes("thalamus") ||
        n.includes("hypothalamus") || n.includes("globus pallidus") ||
        n.includes("caudate nucleus") || n.includes("lentiform") ||
        n.includes("putamen") || n.includes("amygdala") ||
        n.includes("pons") || n.includes("medulla oblongata") ||
        n.includes("midbrain") || n.includes("brainstem") ||
        n.includes("forebrain") || n.includes("tectum") || n.includes("tegmentum") ||
        n.includes("aqueduct of midbrain") || n.includes("falx cerebri") ||
        n.includes("gyrus") || n.includes("sulcus") || n.includes("lobule") ||
        n.includes("vermis") || n.includes("culmen") || n.includes("declive") ||
        n.includes("flocculus") || n.includes("biventral") ||
        n.includes("quadrangular") || n.includes("peduncle") ||
        n.includes("optic tract") || n.includes("olfactory") ||
        n.includes("base of peduncle") || n.includes("frontal lobe") ||
        n.includes("parietal lobe") || n.includes("temporal lobe") ||
        n.includes("occipital lobe") || n.includes("choroid plexus") ||
        n.includes("third ventricle") || n.includes("fourth ventricle") ||
        n.includes("lateral ventricle") ||
        (n.includes("cerebellum") && !n.includes("tonsil")) ||
        n.includes("cerebr"); // catches cerebral peduncle, hemisphere, etc.
    case "eyes":
      return n.includes("eyeball") || n.includes("sclera") || n.includes("cornea") ||
        n.includes("iris") || n === "lens.l" || n === "lens.r" || n.includes(" lens.") ||
        (n.includes("retina") && !n.includes("retinaculum")) ||
        n.includes("chamber of eyeball") || n.includes("pole of eyeball") ||
        n.includes("segment of eyeball") || n.includes("axis of eyeball") ||
        n.includes("equator of eyeball") || n.includes("meridians of eyeball") ||
        n.includes("choroid of eye") || n.includes("optic disc") ||
        n.includes("lacrimal") || n.includes("conjunctiv");
    case "ent":
      return n.includes("trachea") || n.includes("larynx") || n.includes("laryngo") ||
        n.includes("pharynx") || n.includes("pharyng") || n.includes("epiglottis") ||
        (n.includes("cochlea") && !n.includes("cochlear nerve") && !n.includes("nucleus")) ||
        n.includes("cricoid cartilage") || n.includes("arytenoid cartilage") ||
        n.includes("thyroid cartilage") || n.includes("vocal") ||
        n.includes("stapes") || n.includes("incus") || n.includes("malleus") ||
        n.includes("tympanic") || n.includes("auditory tube") || n.includes("eustachian") ||
        n.includes("nasal bone") || n.includes("nasal cartilage") || n.includes("nasal septum") ||
        n.includes("tongue") || n.includes("parotid gland") || n.includes("submandibular gland") ||
        n.includes("fibro-elastic membrane of larynx");
    case "thyroid":
      // "thyroid cartilage" is ENT (larynx), not the endocrine gland.
      return (n.includes("thyroid gland") || n.includes("parathyroid"));
    case "spine":
      return n.includes("vertebr") || n.includes("intervertebr") ||
        n.includes("spinal cord") || n.includes("pedicle") ||
        n.includes("lamina of vertebr") || n.includes("articular facet") ||
        n.includes("pars interarticularis") || n.includes("paravertebral") ||
        n.includes("anterior horn of spinal") || n.includes("posterior horn of spinal");
    default:
      return false;
  }
}

// Keep the old constant for backward compat (used nowhere now but just in case)
const REGION_MESH_MAP: Record<string, string[]> = {};

// Meshes to fade out while a specific region is active, so a small target
// organ isn't visually overpowered by a bigger anatomical neighbour. Each
// entry returns true for meshes that should be hidden when that region is
// the active one. Currently: the thyroid CARTILAGE (part of the larynx) is
// much larger than the thyroid GLAND right beside it, so when the user
// selects the thyroid region we hide the cartilage to let the small gland
// read clearly.
const HIDE_WHEN_REGION_ACTIVE: Record<string, (lowerName: string) => boolean> = {
  thyroid: (n) => n.includes("thyroid cartilage"),
};

// Default base colors for organs (light brand palette tints)
const ORGAN_BASE_COLORS: Record<string, number> = {
  // Heart & cardiovascular
  heart: 0xc94e7c, ventricl: 0xc94e7c, atrium: 0xb5436d, aort: 0xb04060, cardiac: 0xc94e7c, valve: 0xd06080, papillary: 0xc05070, semilunar: 0xd06080,
  // Lungs & respiratory
  lung: 0xd4899e, pulmon: 0xd4899e, bronch: 0xc8809a, diaphragm: 0xc4909e, pleura: 0xdba0ae,
  // GI tract
  liver: 0x9e5a6e, hepat: 0x9e5a6e, stomach: 0xd4899e, intestin: 0xdba0ae, colon: 0xd0a0a8,
  pancrea: 0xd4a0b0, spleen: 0x9e5a6e, esophag: 0xd4a0b0, gallbladder: 0x8a9e6e, duoden: 0xdba0ae,
  cecum: 0xd0a0a8, rectum: 0xc8909a, appendix: 0xd0a0a8,
  // Kidneys & urinary
  kidney: 0xb07085, renal: 0xb07085, ureter: 0xc49090, bladder: 0xc48a9a, adrenal: 0xc09a6e, suprarenal: 0xc09a6e,
  // Thyroid
  thyroid: 0xb08090, parathyroid: 0xa07585,
  // Brain & head
  brain: 0xe0b0c0, cerebr: 0xe0b0c0, cerebellum: 0xd0a0b0, hypothalam: 0xd8a8b8, thalamus: 0xd8a8b8,
  hippocampus: 0xd8a8b8, brainstem: 0xc898a8, pons: 0xc898a8, lobe: 0xe0b0c0, medulla: 0xc090a0,
  telencephalon: 0xe0b0c0, gyrus: 0xe0b0c0, sulcus: 0xd8a8b8, lobule: 0xd0a0b0,
  vermis: 0xd0a0b0, culmen: 0xd0a0b0, declive: 0xd0a0b0, flocculus: 0xd0a0b0,
  "corpus callosum": 0xc898a8, fornix: 0xc898a8, "septum pellucidum": 0xc898a8,
  "globus pallidus": 0xc090a0, caudate: 0xc090a0, lentiform: 0xc090a0,
  "choroid plexus": 0xd8a8b8, ventricle: 0xd8a8b8, midbrain: 0xc898a8,
  "falx cerebri": 0xc898a8, peduncle: 0xc090a0, "optic tract": 0xd0a8b0,
  // Eyes
  eye: 0xe8e8f0, sclera: 0xf0f0f5, cornea: 0xe0e8f0, iris: 0x7088a0, lens: 0xd8dce0,
  retina: 0xc8a090, optic: 0xd0a8b0, orbit: 0xd8c0c8, lacrimal: 0xd0b8c0,
  // ENT
  trachea: 0xd4a0b0, laryn: 0xc8909a, pharyn: 0xd0a0aa, tonsil: 0xc89098,
  nasal: 0xd8b8c0, turbinate: 0xd0b0b8, sinus: 0xd8c0c8, cochlea: 0xc8a098,
  auditory: 0xc8a098, tympan: 0xd0a8a0, ossicl: 0xd8c0b8, epiglott: 0xc8909a, cricoid: 0xc0889a,
  parotid: 0xd8b8c0, submandibular: 0xd0b0b8,
  // Spine
  vertebr: 0xe8dcd0, intervertebr: 0xd8c8bc, spinal: 0xd0b8c0, disc: 0xd0c0b4,
  // Reproductive
  uterus: 0xd07888, ovary: 0xc87080, testis: 0xc8a090, prostat: 0xb89888,
};

function getBaseColor(meshName: string): THREE.Color {
  const lower = meshName.toLowerCase();
  for (const [key, color] of Object.entries(ORGAN_BASE_COLORS)) {
    if (lower.includes(key)) {
      return new THREE.Color(color);
    }
  }
  // Default: light pinkish tone from brand palette
  return new THREE.Color(0xd4a0b0);
}

interface OrganModelProps {
  onOrganClick: (name: string) => void;
  activeRegion: string | null;
}

function OrganModel({ onOrganClick, activeRegion }: OrganModelProps) {
  const { scene } = useGLTF("/models/organs.glb");
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Slow auto-rotate only when no organ is selected
  useFrame((_, delta) => {
    if (groupRef.current && !activeRegion) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  // Change cursor on hover
  const { gl } = useThree();
  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "grab";
  }, [hovered, gl]);

  // Preserve original colors, just upgrade material quality
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Grab the original color from the model
        const origMat = child.material as THREE.MeshStandardMaterial;
        const origColor = origMat?.color?.clone() || new THREE.Color(0xd4a0b0);

        child.material = new THREE.MeshPhysicalMaterial({
          color: origColor,
          roughness: 0.5,
          metalness: 0.05,
          transparent: true,
          opacity: 0.92,
          clearcoat: 0.15,
          clearcoatRoughness: 0.3,
        });
        child.userData.baseColor = origColor.clone();
      }
    });
  }, [scene]);

  // Update colors based on active region / hover
  useEffect(() => {
    const hideRule = activeRegion ? HIDE_WHEN_REGION_ACTIVE[activeRegion] : undefined;
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
        const lowerName = child.name.toLowerCase();
        const isHidden = hideRule ? hideRule(lowerName) : false;
        const isActive = !isHidden && activeRegion ? meshMatchesRegion(child.name, activeRegion) : false;
        const isHovered = !isHidden && hovered === child.name;

        if (isHidden) {
          // Region-specific suppression (e.g. thyroid cartilage when the
          // thyroid GLAND region is selected). Fully transparent — keeps the
          // object in the scene graph so toggling regions doesn't trip Three's
          // mesh-state caches, but invisible to the user.
          child.material.color.copy(child.userData.baseColor || new THREE.Color(0xd4a0b0));
          child.material.emissive.set(0x000000);
          child.material.emissiveIntensity = 0;
          child.material.opacity = 0;
          child.material.clearcoat = 0;
        } else if (isActive) {
          // Highlighted organ: bright pink with glow
          child.material.color.set(0xdd64a6);
          child.material.emissive.set(0xdd64a6);
          child.material.emissiveIntensity = 0.35;
          child.material.opacity = 1;
          child.material.clearcoat = 0.4;
        } else if (isHovered) {
          // Hovered: lighter pink
          child.material.color.set(0xc94e7c);
          child.material.emissive.set(0xdd64a6);
          child.material.emissiveIntensity = 0.15;
          child.material.opacity = 1;
          child.material.clearcoat = 0.2;
        } else {
          // Default: base color, but dimmed if something else is active
          child.material.color.copy(child.userData.baseColor || new THREE.Color(0xd4a0b0));
          child.material.emissive.set(0x000000);
          child.material.emissiveIntensity = 0;
          child.material.opacity = activeRegion ? 0.35 : 0.92;
          child.material.clearcoat = 0.1;
        }
      }
    });
  }, [activeRegion, hovered, scene]);

  return (
    <Center>
      <group ref={groupRef}>
        <primitive
          object={scene}
          scale={8}
          onPointerOver={(e: { stopPropagation: () => void; object: THREE.Object3D }) => {
            e.stopPropagation();
            setHovered(e.object.name);
          }}
          onPointerOut={() => setHovered(null)}
          onClick={(e: { stopPropagation: () => void; object: THREE.Object3D }) => {
            e.stopPropagation();
            onOrganClick(e.object.name);
          }}
        />
      </group>
    </Center>
  );
}

function LoadingFallback() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <torusGeometry args={[0.5, 0.15, 8, 32]} />
      <meshStandardMaterial color="#DD64A6" wireframe />
    </mesh>
  );
}

interface AnatomyViewer3DProps {
  onOrganClick: (name: string) => void;
  activeRegion: string | null;
  instructions?: string;
}

export default function AnatomyViewer3D({ onOrganClick, activeRegion, instructions }: AnatomyViewer3DProps) {
  const t = useTranslations("HealthLibrary");
  return (
    <div className="w-full rounded-2xl overflow-hidden relative h-[420px] sm:h-[500px] lg:h-[600px]"
      style={{
        background: "radial-gradient(ellipse at center, #FDF2F8 0%, #F5E6EF 50%, #f0dce6 100%)",
      }}>
      <Canvas
        camera={{ position: [0, 0.8, 4.5], fov: 40 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        {/* Warm medical lighting */}
        <ambientLight intensity={0.6} color="#fff5f9" />
        <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-3, -2, -4]} intensity={0.4} color="#f5e6ef" />
        <pointLight position={[0, 4, 3]} intensity={0.6} color="#DD64A6" distance={12} />
        <pointLight position={[-3, -1, 2]} intensity={0.3} color="#682149" distance={10} />

        <Suspense fallback={<LoadingFallback />}>
          <OrganModel onOrganClick={onOrganClick} activeRegion={activeRegion} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2.5}
          maxDistance={12}
          autoRotate={false}
          maxPolarAngle={Math.PI * 0.8}
          minPolarAngle={Math.PI * 0.2}
          target={[0, 0.3, 0]}
        />
      </Canvas>

      {/* Instruction overlay */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-blackberry/50 backdrop-blur-md text-white/80 text-[11px] font-medium px-4 sm:px-5 py-2 rounded-full pointer-events-none max-w-[calc(100%-1rem)] text-center break-words">
        {instructions || t("viewerInstructions")}
      </div>
    </div>
  );
}

useGLTF.preload("/models/organs.glb");
