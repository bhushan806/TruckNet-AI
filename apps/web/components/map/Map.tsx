'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);

export default function MapComponent({
    center = [20.5937, 78.9629], // India center
    zoom = 5,
    markers = []
}: {
    center?: [number, number],
    zoom?: number,
    markers?: Array<{ lat: number; lng: number; title: string }>
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        (async () => {
            const L = (await import('leaflet')).default;
            // Fix Leaflet icon issue
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            // @ts-ignore
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        })();
    }, []);

    if (!isMounted) return <div className="h-full w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;

    return (
        <div className="h-full w-full rounded-lg overflow-hidden border">
            {/* @ts-ignore */}
            <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                {/* @ts-ignore */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {markers.map((marker, idx) => (
                    // @ts-ignore
                    <Marker key={idx} position={[marker.lat, marker.lng]}>
                        {/* @ts-ignore */}
                        <Popup>{marker.title}</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}
