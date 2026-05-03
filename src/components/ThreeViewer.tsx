import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Maximize2, RotateCcw, Plus, Minus, RefreshCw } from "lucide-react";
import { colorOptions } from "./ColorSelector";

interface ThreeViewerProps {
  fileUrl: string;
  fileName?: string;
  className?: string;
  selectedColor?: string;
}

const ThreeViewer = ({ fileUrl, fileName, className, selectedColor }: ThreeViewerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const cleanupRef = useRef<(() => void) | null>(null);
  const sceneRef = useRef<any>(null);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const ext = (fileName || fileUrl).split(".").pop()?.toLowerCase() || "";

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleZoom = (type: 'in' | 'out') => {
    if (!controlsRef.current || !cameraRef.current) return;
    const zoomFactor = type === 'in' ? 0.9 : 1.1;
    
    // For PerspectiveCamera, we move the camera closer/further
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    
    const direction = new (window as any).THREE.Vector3();
    camera.getWorldDirection(direction);
    
    const distance = camera.position.distanceTo(controls.target);
    const newDistance = distance * zoomFactor;
    
    // Minimum and maximum zoom limits
    if (newDistance > 0.5 && newDistance < 20) {
      const offset = new (window as any).THREE.Vector3()
        .copy(camera.position)
        .sub(controls.target)
        .multiplyScalar(zoomFactor);
        
      camera.position.copy(controls.target).add(offset);
      controls.update();
    }
  };

  const resetCamera = () => {
    if (!controlsRef.current || !cameraRef.current) return;
    cameraRef.current.position.set(3, 2.5, 4);
    controlsRef.current.target.set(0, 0, 0);
    controlsRef.current.update();
  };

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;
    const container = containerRef.current;

    const init = async () => {
      try {
        setLoading(true);
        setError(null);
        setProgress(10);

        const THREE = await import("three");
        (window as any).THREE = THREE; // Make it available globally for helper functions
        const { OrbitControls } = await import(
          "three/examples/jsm/controls/OrbitControls.js"
        );

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x1e293b);

        const width = container.clientWidth;
        const height = container.clientHeight || 400;

        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
        camera.position.set(3, 2.5, 4);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const existing = container.querySelector("canvas");
        if (existing) container.removeChild(existing);
        container.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controlsRef.current = controls;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.5;

        // Lighting
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
        dir1.position.set(5, 10, 7);
        dir1.castShadow = true;
        scene.add(dir1);
        const dir2 = new THREE.DirectionalLight(0xffffff, 0.4);
        dir2.position.set(-5, 5, -5);
        scene.add(dir2);

        const grid = new THREE.GridHelper(20, 20, 0x334155, 0x1e293b);
        scene.add(grid);

        setProgress(30);

        // Load model
        const resp = await fetch(fileUrl);
        if (!resp.ok) throw new Error("Falha ao baixar modelo");
        
        // Simulating download progress
        setProgress(50);
        const arrayBuffer = await resp.arrayBuffer();
        setProgress(80);

        let loadedObject: THREE.Object3D | null = null;
        const defaultMat = new THREE.MeshPhysicalMaterial({
          color: 0x4488ff,
          metalness: 0.15,
          roughness: 0.4,
        });

        if (ext === "stl") {
          const { STLLoader } = await import(
            "three/examples/jsm/loaders/STLLoader.js"
          );
          const geometry = new STLLoader().parse(arrayBuffer);
          geometry.computeVertexNormals();
          const mesh = new THREE.Mesh(geometry, defaultMat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          loadedObject = mesh;
        } else if (ext === "obj") {
          const { OBJLoader } = await import(
            "three/examples/jsm/loaders/OBJLoader.js"
          );
          const text = new TextDecoder().decode(arrayBuffer);
          const obj = new OBJLoader().parse(text);
          obj.traverse((child: any) => {
            if (child.isMesh) {
              child.material = defaultMat.clone();
              child.material.color.set(0x44aa88);
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          loadedObject = obj;
        } else if (ext === "3mf") {
          const { ThreeMFLoader } = await import(
            "three/examples/jsm/loaders/3MFLoader.js"
          );
          const obj = new ThreeMFLoader().parse(arrayBuffer);
          obj.traverse((child: any) => {
            if (child.isMesh) {
              child.material = defaultMat.clone();
              child.material.color.set(0xff8844);
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          loadedObject = obj;
        } else if (ext === "step" || ext === "stp") {
          const wasmUrls = [
            "/occt-import-js.wasm",
            "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.wasm",
          ];
          let wasmBinary: ArrayBuffer | null = null;
          for (const url of wasmUrls) {
            try {
              const r = await fetch(url);
              if (r.ok) {
                wasmBinary = await r.arrayBuffer();
                break;
              }
            } catch {
              /* ignore */
            }
          }
          if (!wasmBinary) throw new Error("Falha ao carregar módulo STEP (WASM).");

          const occtimportjs = (await import("occt-import-js")).default;
          const occt = await occtimportjs({ wasmBinary });
          const result = occt.ReadStepFile(new Uint8Array(arrayBuffer));

          if (!result || !result.success) throw new Error("Falha ao processar STEP.");

          const group = new THREE.Group();
          for (const meshData of result.meshes) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute(
              "position",
              new THREE.BufferAttribute(
                new Float32Array(meshData.attributes.position.array),
                3
              )
            );
            if (meshData.attributes.normal) {
              geometry.setAttribute(
                "normal",
                new THREE.BufferAttribute(
                  new Float32Array(meshData.attributes.normal.array),
                  3
                )
              );
            }
            geometry.setIndex(
              new THREE.BufferAttribute(new Uint32Array(meshData.index.array), 1)
            );
            if (!meshData.attributes.normal) geometry.computeVertexNormals();

            const mat = new THREE.MeshPhysicalMaterial({
              color: 0x88aacc,
              metalness: 0.2,
              roughness: 0.35,
              side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geometry, mat);
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            group.add(mesh);
          }
          loadedObject = group;
        } else {
          throw new Error(`Formato "${ext}" não suportado. Use STL, OBJ, 3MF ou STEP.`);
        }

        if (loadedObject && !disposed) {
          scene.add(loadedObject);
          setProgress(100);

          // Center & scale
          const box = new THREE.Box3().setFromObject(loadedObject);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 3 / maxDim;
          loadedObject.scale.setScalar(scale);

          const newBox = new THREE.Box3().setFromObject(loadedObject);
          const center = newBox.getCenter(new THREE.Vector3());
          loadedObject.position.sub(center);

          controls.target.set(0, 0, 0);
          controls.update();
          setLoading(false);
          
          // Initial color apply
          if (selectedColor) {
            updateModelColor(loadedObject, selectedColor, THREE);
          }
        }

        let animId = 0;
        const animate = () => {
          if (disposed) return;
          animId = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
          if (disposed || !container) return;
          const w = container.clientWidth;
          const h = container.clientHeight || 400;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", handleResize);

        cleanupRef.current = () => {
          disposed = true;
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(animId);
          controls.dispose();
          renderer.dispose();
          if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (err: any) {
        if (!disposed) {
          setError(err.message || "Erro ao carregar modelo");
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      disposed = true;
      cleanupRef.current?.();
    };
  }, [fileUrl, ext]);

  // Update color when prop changes
  useEffect(() => {
    if (!loading && sceneRef.current && selectedColor) {
      // Find the loaded object in scene (it's the one we added that's not light/grid)
      const model = sceneRef.current.children.find((c: any) => 
        c.type === 'Mesh' || c.type === 'Group' || c.type === 'Object3D'
      );
      if (model && (window as any).THREE) {
        updateModelColor(model, selectedColor, (window as any).THREE);
      }
    }
  }, [selectedColor, loading]);

  const updateModelColor = (model: any, colorName: string, THREE: any) => {
    const color = colorOptions.find(c => c.name === colorName);
    if (!color) return;

    const threeColor = new THREE.Color(color.hex);
    console.log("Applying color to Three.js model:", colorName, color.hex);
    
    model.traverse((child: any) => {
      if (child.isMesh && child.material) {
        // If it's an array of materials
        if (Array.isArray(child.material)) {
          child.material.forEach((m: any) => {
            if (m.color) m.color.copy(threeColor);
          });
        } else {
          if (child.material.color) child.material.color.copy(threeColor);
        }
      }
    });
  };

  const formatLabel: Record<string, string> = {
    stl: "STL",
    obj: "OBJ",
    "3mf": "3MF",
    step: "STEP",
    stp: "STEP",
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-[400px] w-full overflow-hidden rounded-lg border border-border bg-secondary md:h-[500px] transition-all duration-300 ${isFullscreen ? 'h-screen w-screen rounded-none border-none' : ''} ${className || ""}`}
    >
      {/* Header */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-background/80 px-3 py-1.5 backdrop-blur shadow-sm">
        <RotateCcw className="h-3.5 w-3.5 text-primary" />
        <span className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Visualização 3D · {formatLabel[ext] || ext.toUpperCase()}
        </span>
      </div>

      {/* Controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-background/80 backdrop-blur transition-all hover:bg-background shadow-sm hover:scale-105"
        >
          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        
        <div className="flex flex-col rounded-md bg-background/80 backdrop-blur shadow-sm overflow-hidden">
          <button
            onClick={() => handleZoom('in')}
            title="Aumentar zoom"
            className="flex h-8 w-8 items-center justify-center border-b border-border/50 transition-colors hover:bg-background"
          >
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            title="Diminuir zoom"
            className="flex h-8 w-8 items-center justify-center border-b border-border/50 transition-colors hover:bg-background"
          >
            <Minus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={resetCamera}
            title="Resetar câmera"
            className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-background"
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-secondary/80 backdrop-blur-sm">
          <div className="flex w-full max-w-[200px] flex-col items-center gap-4 px-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="absolute text-[10px] font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div 
                className="h-full bg-primary transition-all duration-300 ease-out" 
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {progress < 100 ? "Preparando motor 3D..." : "Processando..."}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-secondary/80">
          <div className="flex flex-col items-center gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <span className="text-xs font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-3 left-3 right-3 flex justify-center">
        <div className="rounded-md bg-background/80 px-3 py-1.5 backdrop-blur shadow-sm border border-border/40">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Arraste para girar · ZOOM COM O MOUSE · CONTROLES LATERAIS
          </span>
        </div>
      </div>
    </div>
  );
};

export default ThreeViewer;