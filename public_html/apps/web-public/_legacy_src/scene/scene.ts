/**
 * Scene 1 - Cinematografic Polish
 * Platform Core + Ring Layers + Ledger Pulse Beat
 */

import * as THREE from 'three';
import { QualityManager } from './quality';

export class Scene1 {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    private quality: QualityManager;

    // Obiecte scene
    private platformCore: THREE.Group;
    private ringLayer1: THREE.Mesh | null = null;
    private ringLayer2: THREE.Mesh | null = null;
    private breathingPhase = 0;
    private ledgerPulseIntensity = 0; // Pulse pe beat scroll (0-1)

    constructor(canvas: HTMLCanvasElement) {
        this.quality = new QualityManager();

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x0a0a0f, 10, 50);
        this.scene.background = new THREE.Color(0x121212);

        // Camera - perspective cu dolly baseline
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            100
        );
        this.camera.position.set(0, 2, 12); // Wide intro baseline
        this.camera.lookAt(0, 0, 0);

        // Renderer cinematografic
        this.renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: this.quality.antialias,
            alpha: false,
        });

        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(this.quality.pixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.shadowMap.enabled = this.quality.shadows;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lights - cinematografic
        this.setupLights();

        // Platform Core - torus + inner sphere
        this.platformCore = this.createPlatformCore();
        this.scene.add(this.platformCore);

        // Ring layers pentru reveal (beat 2)
        this.createRingLayers();
    }

    private setupLights(): void {
        // Key light (main) - cyan tint
        const keyLight = new THREE.DirectionalLight(0x00f0ff, 2.5);
        keyLight.position.set(5, 8, 5);
        keyLight.castShadow = this.quality.shadows;
        keyLight.shadow.mapSize.width = 1024;
        keyLight.shadow.mapSize.height = 1024;
        this.scene.add(keyLight);

        // Rim light (contur) - magenta tint
        const rimLight = new THREE.DirectionalLight(0xff00e5, 1.5);
        rimLight.position.set(-5, 3, -5);
        this.scene.add(rimLight);

        // Ambient light - foarte subtil
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        this.scene.add(ambientLight);
    }

    private createPlatformCore(): THREE.Group {
        const group = new THREE.Group();

        // Material standard/physical - prinde lumina corect
        const torusMaterial = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            metalness: 0.7,
            roughness: 0.3,
            emissive: 0x001a1f,
            emissiveIntensity: 0.3,
        });

        const sphereMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xff00e5,
            metalness: 0.9,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.1,
            emissive: 0x1a0010,
            emissiveIntensity: 0.2,
        });

        // Torus (outer ring)
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(2, 0.4, 32, 100),
            torusMaterial
        );
        torus.castShadow = this.quality.shadows;
        torus.receiveShadow = this.quality.shadows;
        torus.rotation.x = Math.PI / 2;

        // Inner sphere (core)
        const sphere = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 64, 64),
            sphereMaterial
        );
        sphere.castShadow = this.quality.shadows;
        sphere.receiveShadow = this.quality.shadows;

        group.add(torus);
        group.add(sphere);

        return group;
    }

    private createRingLayers(): void {
        // Ring layer 1 (outer) - cyan thin ring
        const ring1Geo = new THREE.TorusGeometry(3.5, 0.08, 16, 64);
        const ring1Mat = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0, // Hidden initial
        });

        this.ringLayer1 = new THREE.Mesh(ring1Geo, ring1Mat);
        this.ringLayer1.rotation.x = Math.PI / 2;
        this.ringLayer1.position.z = -0.5;
        this.scene.add(this.ringLayer1);

        // Ring layer 2 (inner) - magenta medium ring
        const ring2Geo = new THREE.TorusGeometry(2.8, 0.12, 16, 64);
        const ring2Mat = new THREE.MeshStandardMaterial({
            color: 0xff00e5,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xff00e5,
            emissiveIntensity: 0.4,
            transparent: true,
            opacity: 0, // Hidden initial
        });

        this.ringLayer2 = new THREE.Mesh(ring2Geo, ring2Mat);
        this.ringLayer2.rotation.x = Math.PI / 2;
        this.ringLayer2.position.z = 0.3;
        this.scene.add(this.ringLayer2);
    }

    public revealRings(): void {
        // Triggered de scroll beat 2 - animate opacity rings
        if (this.ringLayer1 && this.ringLayer1.material instanceof THREE.MeshStandardMaterial) {
            this.ringLayer1.material.opacity = 1;
        }
        if (this.ringLayer2 && this.ringLayer2.material instanceof THREE.MeshStandardMaterial) {
            this.ringLayer2.material.opacity = 0.8;
        }
    }

    public setLedgerPulse(intensity: number): void {
        // Pulse pe scroll progress beat (0-1)
        this.ledgerPulseIntensity = intensity;
    }

    resize(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(this.quality.pixelRatio, 2));
    }

    update(deltaTime: number): void {
        // Camera breathing (idle ambient movement) - foarte subtil
        this.breathingPhase += deltaTime * 0.3;
        const breathAmount = Math.sin(this.breathingPhase) * 0.1;
        this.camera.position.y = 2 + breathAmount;
        this.camera.position.z = 12 + Math.cos(this.breathingPhase * 0.5) * 0.15;
        this.camera.lookAt(0, 0, 0);

        // Platform core rotation subtilă
        if (this.platformCore) {
            this.platformCore.rotation.y += deltaTime * 0.15;
            this.platformCore.children[1].rotation.y -= deltaTime * 0.1; // Counter-rotate sphere
        }

        // Ring layers rotation + LEDGER PULSE
        const pulseScale = 1 + this.ledgerPulseIntensity * 0.1; // Max 10% scale

        if (this.ringLayer1) {
            this.ringLayer1.rotation.z += deltaTime * 0.05;
        }
        if (this.ringLayer2) {
            this.ringLayer2.rotation.z -= deltaTime * 0.08;
            // Ledger pulse pe ring interior (magenta) - vizibil clar
            this.ringLayer2.scale.set(pulseScale, pulseScale, pulseScale);

            // Emissive intensity pulse
            if (this.ringLayer2.material instanceof THREE.MeshStandardMaterial) {
                this.ringLayer2.material.emissiveIntensity = 0.4 + this.ledgerPulseIntensity * 0.3;
            }
        }

        // Quality monitor
        this.quality.update();
    }

    render(): void {
        this.renderer.render(this.scene, this.camera);
    }

    dispose(): void {
        this.renderer.dispose();
        // Cleanup geometries și materials
        this.scene.traverse((object) => {
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                if (Array.isArray(object.material)) {
                    object.material.forEach(m => m.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}
