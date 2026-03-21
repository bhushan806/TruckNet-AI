'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Dynamic imports
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const LocationMarker = dynamic(() => import('./LocationMarker'), { ssr: false });

export default function LocationPickerMap({
    onLocationSelect,
    initialLocation
}: {
    onLocationSelect: (lat: number, lng: number) => void,
    initialLocation?: { lat: number, lng: number }
}) {
    const [position, setPosition] = useState<[number, number] | null>(
        initialLocation ? [initialLocation.lat, initialLocation.lng] : null
    );
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        (async () => {
            const L = (await import('leaflet')).default;
            // @ts-ignore
            delete L.Icon.Default.prototype._getIconUrl;
            // @ts-ignore
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            });
        })();

        // Get current location if not provided
        if (!initialLocation && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setPosition([latitude, longitude]);
                onLocationSelect(latitude, longitude);
            });
        }
    }, []);

    const handleSetPosition = (pos: [number, number]) => {
        setPosition(pos);
        onLocationSelect(pos[0], pos[1]);
    };

    if (!isMounted) return <div className="h-64 w-full bg-gray-100 flex items-center justify-center">Loading Map...</div>;

    return (
        <div className="h-64 w-full rounded-lg overflow-hidden border z-0 relative">
            {/* @ts-ignore */}
            <MapContainer center={position || [20.5937, 78.9629]} zoom={13} style={{ height: '100%', width: '100%' }}>
                {/* @ts-ignore */}
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {/* @ts-ignore */}
                {position && <LocationMarker position={position} setPosition={handleSetPosition} />}
            </MapContainer>
        </div>
    );
}
