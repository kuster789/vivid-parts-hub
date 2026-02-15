import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";
import { RotateCcw } from "lucide-react";

const PistonModel = () => {
  return (
    <group>
      {/* Piston body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.8, 0.85, 1.5, 32]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Piston rings */}
      {[-0.4, -0.15, 0.1].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.83, 0.03, 8, 32]} />
          <meshStandardMaterial color="#555" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}
      {/* Pin */}
      <mesh position={[0, -0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.8, 16]} />
        <meshStandardMaterial color="#999" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Connecting rod */}
      <mesh position={[0, -1.3, 0]}>
        <boxGeometry args={[0.2, 1.2, 0.15]} />
        <meshStandardMaterial color="#777" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
};

const ProductViewer3D = () => {
  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border bg-secondary md:h-[500px]">
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 backdrop-blur">
        <RotateCcw className="h-3.5 w-3.5 text-primary" />
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Visualização 3D
        </span>
      </div>
      <Canvas camera={{ position: [3, 2, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-3, 2, -3]} intensity={0.3} color="#f59e0b" />
          <PistonModel />
          <OrbitControls
            enablePan={false}
            minDistance={2}
            maxDistance={8}
            autoRotate
            autoRotateSpeed={2}
          />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
      <div className="absolute bottom-3 left-3 right-3 flex justify-center">
        <div className="rounded-md bg-background/80 px-3 py-1.5 backdrop-blur">
          <span className="text-[10px] text-muted-foreground">
            Arraste para girar · Scroll para zoom
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductViewer3D;
