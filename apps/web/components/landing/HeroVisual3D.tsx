'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ShieldCheck, Navigation, CheckCircle2, TrendingUp, Truck } from 'lucide-react';
import * as THREE from 'three';

// City node coordinates for the interactive 3D logistics sphere
const CITIES = [
    { name: 'Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
];

const CORRIDORS = [
    { from: 'Delhi', to: 'Mumbai' },
    { from: 'Mumbai', to: 'Bengaluru' },
    { from: 'Delhi', to: 'Kolkata' },
    { from: 'Bengaluru', to: 'Chennai' },
    { from: 'Ahmedabad', to: 'Delhi' },
    { from: 'Hyderabad', to: 'Mumbai' },
];

// Customer-friendly real delivery updates (No internal jargon)
const LIVE_EVENTS = [
    { route: 'Delhi → Mumbai', status: 'Delivered Safely ✅', detail: 'On-time delivery', icon: CheckCircle2, color: 'text-emerald-400' },
    { route: 'Bengaluru → Pune', status: 'On Schedule 🚛', detail: 'Moving via NH-48 Express', icon: Truck, color: 'text-[#00E5C3]' },
    { route: 'Ahmedabad → Kolkata', status: 'In Transit ⚡', detail: 'Live GPS location active', icon: Navigation, color: 'text-amber-400' },
    { route: 'Chennai → Hyderabad', status: 'Arrived at Destination 📦', detail: 'Verified delivery', icon: CheckCircle2, color: 'text-emerald-400' },
    { route: 'Jaipur → Surat', status: 'Completed Successfully ✅', detail: 'Customer verified', icon: CheckCircle2, color: 'text-teal-300' },
];

function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new THREE.Vector3(x, y, z);
}

export function HeroVisual3D() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMobile, setIsMobile] = useState<boolean>(false);
    const [activeShipments, setActiveShipments] = useState(1247);
    const [routesOptimized, setRoutesOptimized] = useState(8932);
    const [eventIndex, setEventIndex] = useState(0);

    // Mouse movement parallax for 3D tilt
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springConfig = { damping: 25, stiffness: 150 };
    const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), springConfig);
    const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Live counter and ticker cycling
    useEffect(() => {
        const counterInterval = setInterval(() => {
            setActiveShipments(prev => prev + (Math.random() > 0.4 ? 1 : -1));
            setRoutesOptimized(prev => prev + Math.floor(Math.random() * 2));
        }, 4000);

        const tickerInterval = setInterval(() => {
            setEventIndex(prev => (prev + 1) % LIVE_EVENTS.length);
        }, 3200);

        return () => {
            clearInterval(counterInterval);
            clearInterval(tickerInterval);
        };
    }, []);

    // Three.js 3D WebGL Globe & Logistics Network
    useEffect(() => {
        if (isMobile || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const width = canvas.clientWidth || 520;
        const height = canvas.clientHeight || 520;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        camera.position.z = 240;

        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const globeGroup = new THREE.Group();
        globeGroup.rotation.x = 0.35;
        globeGroup.rotation.y = -0.5;
        scene.add(globeGroup);

        const globeRadius = 78;

        const sphereGeo = new THREE.SphereGeometry(globeRadius, 28, 28);
        const sphereMat = new THREE.PointsMaterial({
            color: 0x00E5C3,
            size: 1.4,
            transparent: true,
            opacity: 0.32
        });
        const globePoints = new THREE.Points(sphereGeo, sphereMat);
        globeGroup.add(globePoints);

        const innerGeo = new THREE.SphereGeometry(globeRadius * 0.96, 24, 24);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0x0B1120,
            transparent: true,
            opacity: 0.95
        });
        const innerSphere = new THREE.Mesh(innerGeo, innerMat);
        globeGroup.add(innerSphere);

        const cityVectors: Record<string, THREE.Vector3> = {};
        const beaconGroup = new THREE.Group();
        globeGroup.add(beaconGroup);

        CITIES.forEach(city => {
            const pos = latLonToVector3(city.lat, city.lon, globeRadius + 1.2);
            cityVectors[city.name] = pos;

            const beaconGeo = new THREE.SphereGeometry(2.2, 12, 12);
            const beaconMat = new THREE.MeshBasicMaterial({ color: 0x00E5C3 });
            const beacon = new THREE.Mesh(beaconGeo, beaconMat);
            beacon.position.copy(pos);
            beaconGroup.add(beacon);

            const ringGeo = new THREE.RingGeometry(2.8, 3.8, 16);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00E5C3,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(pos);
            ring.lookAt(new THREE.Vector3(0, 0, 0));
            beaconGroup.add(ring);
        });

        const curves: THREE.QuadraticBezierCurve3[] = [];
        const packetMeshes: { mesh: THREE.Mesh; curveIndex: number; progress: number; speed: number }[] = [];

        CORRIDORS.forEach(corridor => {
            const v1 = cityVectors[corridor.from];
            const v2 = cityVectors[corridor.to];
            if (!v1 || !v2) return;

            const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
            const distance = v1.distanceTo(v2);
            mid.normalize().multiplyScalar(globeRadius + distance * 0.45);

            const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
            curves.push(curve);

            const points = curve.getPoints(36);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({
                color: 0x00E5C3,
                transparent: true,
                opacity: 0.55
            });
            const line = new THREE.Line(lineGeo, lineMat);
            globeGroup.add(line);

            const packetGeo = new THREE.SphereGeometry(1.6, 8, 8);
            const packetMat = new THREE.MeshBasicMaterial({ color: 0xFF6B35 });
            const packet = new THREE.Mesh(packetGeo, packetMat);
            globeGroup.add(packet);

            packetMeshes.push({
                mesh: packet,
                curveIndex: curves.length - 1,
                progress: Math.random(),
                speed: 0.004 + Math.random() * 0.003
            });
        });

        const particleCount = 70;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 320;
            positions[i + 1] = (Math.random() - 0.5) * 320;
            positions[i + 2] = (Math.random() - 0.5) * 200;
        }
        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const particleMat = new THREE.PointsMaterial({
            color: 0x94A3B8,
            size: 1.2,
            transparent: true,
            opacity: 0.35
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        let animationFrameId: number;
        const clock = new THREE.Clock();

        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            const delta = clock.getDelta();

            globeGroup.rotation.y += delta * 0.12;

            packetMeshes.forEach(item => {
                item.progress += item.speed;
                if (item.progress > 1) item.progress = 0;
                const pos = curves[item.curveIndex].getPoint(item.progress);
                item.mesh.position.copy(pos);
            });

            particles.rotation.y -= delta * 0.02;

            renderer.render(scene, camera);
        };

        animate();

        const handleResize = () => {
            if (!canvasRef.current) return;
            const newW = canvasRef.current.clientWidth;
            const newH = canvasRef.current.clientHeight;
            camera.aspect = newW / newH;
            camera.updateProjectionMatrix();
            renderer.setSize(newW, newH);
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            sphereGeo.dispose();
            sphereMat.dispose();
            innerGeo.dispose();
            innerMat.dispose();
            particleGeo.dispose();
            particleMat.dispose();
        };
    }, [isMobile]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        mouseX.set(x);
        mouseY.set(y);
    };

    const handleMouseLeave = () => {
        mouseX.set(0);
        mouseY.set(0);
    };

    const currentEvent = LIVE_EVENTS[eventIndex];
    const EventIcon = currentEvent.icon;

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full max-w-[560px] mx-auto select-none"
            style={{ perspective: 1200 }}
        >
            <motion.div
                style={{
                    rotateX: isMobile ? 0 : rotateX,
                    rotateY: isMobile ? 0 : rotateY,
                    transformStyle: 'preserve-3d'
                }}
                className="relative rounded-2xl industrial-card p-4 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-slate-800/90 overflow-hidden"
            >
                <div className="absolute inset-0 bg-industrial-grid opacity-30 pointer-events-none" />

                {/* Header Bar of the Terminal (Customer Friendly) */}
                <div className="relative z-10 flex items-center justify-between pb-3.5 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <span className="text-xs font-bold text-white tracking-wide uppercase">
                            Live Shipment Network
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#00E5C3] animate-ping" />
                        <span className="text-[#00E5C3] font-semibold">Live GPS Active</span>
                    </div>
                </div>

                {/* Main 3D Canvas / Mobile SVG Area */}
                <div className="relative h-[320px] sm:h-[380px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 border border-slate-800/50">
                    
                    {!isMobile ? (
                        <canvas
                            ref={canvasRef}
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            style={{ display: 'block' }}
                        />
                    ) : (
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                            <div className="absolute inset-0 flex items-center justify-center opacity-25">
                                <div className="w-56 h-56 rounded-full border border-teal-500/30 animate-pulse" />
                                <div className="absolute w-40 h-40 rounded-full border border-teal-500/20" />
                            </div>
                            
                            <svg className="w-full h-full max-h-[260px]" viewBox="0 0 320 240" fill="none">
                                <path d="M70,60 Q130,120 180,180" stroke="#00E5C3" strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                                <path d="M180,180 Q220,130 250,90" stroke="#00E5C3" strokeWidth="2" opacity="0.7" />
                                <path d="M70,60 Q170,50 250,90" stroke="#FF6B35" strokeWidth="2" opacity="0.6" />
                                <path d="M70,60 Q90,140 100,190" stroke="#00E5C3" strokeWidth="2" opacity="0.8" />
                                <path d="M100,190 Q150,210 180,180" stroke="#00E5C3" strokeWidth="2" opacity="0.6" />

                                <circle cx="125" cy="115" r="4" fill="#FF6B35" className="animate-ping" />
                                <circle cx="125" cy="115" r="3" fill="#FF6B35" />

                                <circle cx="215" cy="135" r="4" fill="#00E5C3" className="animate-ping" />
                                <circle cx="215" cy="135" r="3" fill="#00E5C3" />

                                <g>
                                    <circle cx="70" cy="60" r="5" fill="#00E5C3" />
                                    <text x="60" y="48" fill="#F8FAFC" fontSize="10" fontWeight="bold">DELHI</text>
                                    
                                    <circle cx="100" cy="190" r="5" fill="#00E5C3" />
                                    <text x="75" y="210" fill="#F8FAFC" fontSize="10" fontWeight="bold">MUMBAI</text>

                                    <circle cx="180" cy="180" r="5" fill="#00E5C3" />
                                    <text x="165" y="200" fill="#F8FAFC" fontSize="10" fontWeight="bold">BENGALURU</text>

                                    <circle cx="250" cy="90" r="5" fill="#00E5C3" />
                                    <text x="230" y="78" fill="#F8FAFC" fontSize="10" fontWeight="bold">KOLKATA</text>
                                </g>
                            </svg>
                        </div>
                    )}

                    {/* Floating Top-Right Live Counters Card */}
                    <div className="absolute top-3 right-3 z-20 p-2.5 sm:p-3 rounded-xl bg-[#0B1120]/90 backdrop-blur-md border border-slate-700/80 shadow-lg flex flex-col gap-1.5 min-w-[135px] sm:min-w-[160px]">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                            <span>ACTIVE SHIPMENTS</span>
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                        </div>
                        <div className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                            <span className="text-[#00E5C3]">#</span>
                            <span>{activeShipments.toLocaleString()}</span>
                            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                        </div>
                        <div className="border-t border-slate-800/80 pt-1 text-[10px] text-slate-400 flex justify-between">
                            <span>DELIVERED:</span>
                            <span className="text-white font-bold">{routesOptimized.toLocaleString()}+</span>
                        </div>
                    </div>

                    {/* Floating Bottom-Left Telemetry Pill */}
                    <div className="absolute bottom-3 left-3 z-20 p-2.5 sm:p-3 rounded-xl bg-[#0B1120]/90 backdrop-blur-md border border-teal-500/30 shadow-[0_0_20px_rgba(0,229,195,0.15)] flex items-center gap-2.5 max-w-[240px] sm:max-w-[270px]">
                        <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center flex-shrink-0">
                            <Navigation className="h-4 w-4 text-[#00E5C3]" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[11px] font-semibold text-white truncate">
                                Route: Delhi ➔ Mumbai
                            </span>
                            <span className="text-[10px] text-emerald-400 font-medium truncate">
                                Saved 2.5 Hours • On Time Delivery
                            </span>
                        </div>
                    </div>
                </div>

                {/* Real-Time Deliveries Ticker (Simple English) */}
                <div className="relative z-10 mt-3 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="font-semibold uppercase tracking-wider text-slate-300">Recent Trips:</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                            <EventIcon className={`h-3.5 w-3.5 ${currentEvent.color}`} />
                            <span className="font-semibold text-white">{currentEvent.route}</span>
                            <span className="text-slate-400">—</span>
                            <span className={currentEvent.color}>{currentEvent.status}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
