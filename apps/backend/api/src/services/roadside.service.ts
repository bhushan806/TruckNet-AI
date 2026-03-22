import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { getIO } from '../config/socket';

export class RoadsideService {
    // Report a breakdown
    async reportBreakdown(data: {
        driverId: string;
        vehicleId: string;
        location: { lat: number; lng: number; address: string };
        description: string;
        type: string;
        images: string[];
        voiceUrl?: string;
    }) {
        // 1. Simulate AI Analysis
        const aiAnalysis = this.simulateAIAnalysis(data.description);

        // 2. Create Breakdown Record
        const breakdown = await prisma.breakdown.create({
            data: {
                driverId: data.driverId,
                vehicleId: data.vehicleId,
                location: data.location,
                description: data.description,
                type: data.type,
                images: data.images,
                voiceUrl: data.voiceUrl,
                aiAnalysis,
                status: 'REPORTED'
            }
        });

        // 3. Find Nearby Mechanics (Mocked)
        const mechanics = await this.findNearbyProviders(data.location, 'MECHANIC');

        // 4. Emit Alert to Owner (Mocked Owner ID for now)
        // In real app, fetch ownerId from vehicle -> owner
        const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId }, include: { owner: true } });
        if (vehicle?.owner?.userId) {
            getIO().to(vehicle.owner.userId).emit('breakdownAlert', {
                breakdownId: breakdown.id,
                vehicleId: vehicle.id,
                location: data.location,
                type: data.type,
                severity: aiAnalysis.severity
            });
        }

        return { breakdown, mechanics };
    }

    // Update Breakdown Status
    async updateStatus(breakdownId: string, status: string, eta?: Date, providerId?: string) {
        const breakdown = await prisma.breakdown.update({
            where: { id: breakdownId },
            data: {
                status,
                eta,
                serviceProviderId: providerId
            },
            include: { serviceProvider: true }
        });

        // Emit Status Update to Driver
        // Assuming driver is listening on breakdownId or their userId
        getIO().to(breakdown.driverId).emit('breakdownStatusUpdated', {
            breakdownId,
            status,
            eta,
            provider: breakdown.serviceProvider
        });

        return breakdown;
    }

    // Get Breakdown by ID
    async getBreakdown(id: string) {
        return prisma.breakdown.findUnique({
            where: { id },
            include: { serviceProvider: true }
        });
    }

    // Get Nearby Providers
    async findNearbyProviders(location: { lat: number; lng: number }, type: string = 'MECHANIC') {
        // In a real app, use geospatial query:
        // prisma.serviceProvider.findMany({ where: { location: { near: ... } } })

        // For now, return all and sort by distance in memory (or just return mock)
        // Let's create some mock providers if none exist
        const count = await prisma.serviceProvider.count();
        if (count === 0) {
            await this.seedProviders();
        }

        const providers = await prisma.serviceProvider.findMany({
            where: { type }
        });

        return providers.map((p: any) => ({
            ...p,
            distance: this.calculateDistance(location.lat, location.lng, (p.location as any).lat, (p.location as any).lng)
        })).sort((a: any, b: any) => a.distance - b.distance);
    }

    // Helper: Calculate Distance (Haversine)
    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }

    // Seed Mock Providers
    private async seedProviders() {
        await prisma.serviceProvider.createMany({
            data: [
                {
                    name: 'Quick Fix Garage',
                    type: 'MECHANIC',
                    phone: '+91 98765 43210',
                    location: { lat: 18.5204, lng: 73.8567, address: 'Pune Station' },
                    rating: 4.5
                },
                {
                    name: 'Highway Support Center',
                    type: 'MECHANIC',
                    phone: '+91 98765 43211',
                    location: { lat: 18.5304, lng: 73.8667, address: 'Viman Nagar' },
                    rating: 4.8
                },
                {
                    name: 'City Hospital',
                    type: 'HOSPITAL',
                    phone: '108',
                    location: { lat: 18.5104, lng: 73.8467, address: 'Shivajinagar' },
                    rating: 5.0
                }
            ]
        });
    }

    // Simulated AI Logic (Keyword based)
    private simulateAIAnalysis(description: string) {
        const desc = description.toLowerCase();
        let prediction = 'Unknown Issue';
        let severity = 'LOW';
        let confidence = 0.5;

        if (desc.includes('smoke') || desc.includes('fire') || desc.includes('heat')) {
            prediction = 'Engine Overheating / Fire Risk';
            severity = 'CRITICAL';
            confidence = 0.95;
        } else if (desc.includes('tire') || desc.includes('flat') || desc.includes('puncture')) {
            prediction = 'Tire Puncture / Blowout';
            severity = 'MEDIUM';
            confidence = 0.98;
        } else if (desc.includes('brake') || desc.includes('stop')) {
            prediction = 'Brake Failure';
            severity = 'HIGH';
            confidence = 0.90;
        } else if (desc.includes('start') || desc.includes('battery')) {
            prediction = 'Battery Dead / Alternator Issue';
            severity = 'LOW';
            confidence = 0.85;
        } else if (desc.includes('noise') || desc.includes('sound')) {
            prediction = 'Engine Knocking / Mechanical Failure';
            severity = 'MEDIUM';
            confidence = 0.70;
        }

        return { prediction, severity, confidence };
    }
}
