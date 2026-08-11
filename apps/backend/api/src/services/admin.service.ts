// ── Admin Analytics Service ──
// All metrics query REAL MongoDB data via Mongoose.
// No fake data, no hardcoded numbers.
// This service is the single source of truth for Admin dashboard metrics.

import mongoose from 'mongoose';
import { UserModel } from '../models/mongoose/User';
import { VehicleModel } from '../models/mongoose/Vehicle';
import { LoadModel } from '../models/mongoose/Load';
import { RideModel } from '../models/mongoose/Ride';
import { DriverProfileModel } from '../models/mongoose/DriverProfile';
import { AdminAuditModel } from '../models/mongoose/AdminAudit';
import { getTrafficMetrics } from '../utils/trafficMonitor';
import { env } from '../config/env';
import axios from 'axios';
import { logger } from '../utils/logger';

// ── Date range helpers ──
function getDateRange(period: string): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);

    switch (period) {
        case 'today': {
            const start = new Date(now);
            start.setHours(0, 0, 0, 0);
            return { start, end };
        }
        case '7d': {
            const start = new Date(now);
            start.setDate(start.getDate() - 7);
            return { start, end };
        }
        case '30d': {
            const start = new Date(now);
            start.setDate(start.getDate() - 30);
            return { start, end };
        }
        case '90d': {
            const start = new Date(now);
            start.setDate(start.getDate() - 90);
            return { start, end };
        }
        default: {
            // Default to last 7 days
            const start = new Date(now);
            start.setDate(start.getDate() - 7);
            return { start, end };
        }
    }
}

// ── 1. Platform Overview — full snapshot of current platform state ──
export async function getPlatformOverview() {
    const [
        totalUsers,
        totalCustomers,
        totalDrivers,
        totalOwners,
        totalVehicles,
        availableVehicles,
        onTripVehicles,
        maintenanceVehicles,
        totalLoads,
        openLoads,
        inTransitLoads,
        completedLoads,
        cancelledLoads,
        totalRides,
        pendingRides,
        ongoingRides,
        completedRides,
        availableDrivers,
        activeUsers,
    ] = await Promise.all([
        UserModel.countDocuments({ role: { $ne: 'ADMIN' } }),
        UserModel.countDocuments({ role: 'CUSTOMER', isActive: true }),
        UserModel.countDocuments({ role: 'DRIVER', isActive: true }),
        UserModel.countDocuments({ role: 'OWNER', isActive: true }),
        VehicleModel.countDocuments({}),
        VehicleModel.countDocuments({ status: 'AVAILABLE' }),
        VehicleModel.countDocuments({ status: 'ON_TRIP' }),
        VehicleModel.countDocuments({ status: 'MAINTENANCE' }),
        LoadModel.countDocuments({ isDeleted: { $ne: true } }),
        LoadModel.countDocuments({ status: 'OPEN', isDeleted: { $ne: true } }),
        LoadModel.countDocuments({ status: 'IN_TRANSIT', isDeleted: { $ne: true } }),
        LoadModel.countDocuments({ status: 'COMPLETED', isDeleted: { $ne: true } }),
        LoadModel.countDocuments({ status: 'CANCELLED', isDeleted: { $ne: true } }),
        RideModel.countDocuments({}),
        RideModel.countDocuments({ status: 'PENDING' }),
        RideModel.countDocuments({ status: 'ONGOING' }),
        RideModel.countDocuments({ status: 'COMPLETED' }),
        DriverProfileModel.countDocuments({ isAvailable: true }),
        // Active users = users with isActive: true (across all non-admin roles)
        UserModel.countDocuments({ isActive: true, role: { $ne: 'ADMIN' } }),
    ]);

    // Today's new users
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const [newUsersToday, newLoadsToday, newRidesToday] = await Promise.all([
        UserModel.countDocuments({ createdAt: { $gte: todayStart }, role: { $ne: 'ADMIN' } }),
        LoadModel.countDocuments({ createdAt: { $gte: todayStart }, isDeleted: { $ne: true } }),
        RideModel.countDocuments({ createdAt: { $gte: todayStart } }),
    ]);

    // Accepted (matched) loads = loads that moved past OPEN status
    const acceptedLoads = await LoadModel.countDocuments({
        status: { $in: ['ACCEPTED_BY_OWNER', 'ASSIGNED_TO_DRIVER', 'IN_TRANSIT', 'COMPLETED'] },
        isDeleted: { $ne: true },
    });

    const matchSuccessRate = totalLoads > 0
        ? parseFloat(((acceptedLoads / totalLoads) * 100).toFixed(1))
        : 0;

    return {
        users: {
            total: totalUsers,
            customers: totalCustomers,
            drivers: totalDrivers,
            owners: totalOwners,
            newToday: newUsersToday,
            activeAccounts: activeUsers,
            availableDrivers,
        },
        vehicles: {
            total: totalVehicles,
            available: availableVehicles,
            onTrip: onTripVehicles,
            maintenance: maintenanceVehicles,
        },
        loads: {
            total: totalLoads,
            open: openLoads,
            inTransit: inTransitLoads,
            completed: completedLoads,
            cancelled: cancelledLoads,
            newToday: newLoadsToday,
            accepted: acceptedLoads,
            matchSuccessRate,
        },
        rides: {
            total: totalRides,
            pending: pendingRides,
            ongoing: ongoingRides,
            completed: completedRides,
            newToday: newRidesToday,
        },
    };
}

// ── 2. User Statistics with date range ──
export async function getUserStatistics(period: string = '7d') {
    const { start, end } = getDateRange(period);

    // Users registered in range
    const [usersInRange, roleDistribution] = await Promise.all([
        UserModel.countDocuments({
            createdAt: { $gte: start, $lte: end },
            role: { $ne: 'ADMIN' },
        }),
        UserModel.aggregate([
            { $match: { role: { $ne: 'ADMIN' } } },
            { $group: { _id: '$role', count: { $sum: 1 } } },
        ]),
    ]);

    // Daily user registrations for chart
    const dailyRegistrations = await UserModel.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                role: { $ne: 'ADMIN' },
            },
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' },
                },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
    ]);

    // All users paginated
    const users = await UserModel.find({ role: { $ne: 'ADMIN' } })
        .select('name email role isActive isVerified createdAt')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

    return {
        period,
        newUsersInRange: usersInRange,
        roleDistribution: roleDistribution.map(r => ({ role: r._id, count: r.count })),
        dailyRegistrations: dailyRegistrations.map(d => ({ date: d._id, count: d.count })),
        recentUsers: users.map(u => ({
            id: (u._id as any).toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            isActive: u.isActive,
            isVerified: u.isVerified,
            joinedAt: (u as any).createdAt,
        })),
    };
}

// ── 3. Load / Matching Statistics ──
export async function getLoadStatistics(period: string = '7d') {
    const { start, end } = getDateRange(period);

    const [loadsInRange, statusBreakdown, dailyLoads] = await Promise.all([
        LoadModel.countDocuments({
            createdAt: { $gte: start, $lte: end },
            isDeleted: { $ne: true },
        }),
        LoadModel.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        LoadModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    isDeleted: { $ne: true },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' },
                    },
                    total: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
                    },
                    open: {
                        $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]),
    ]);

    // Match success rate
    const matched = await LoadModel.countDocuments({
        status: { $in: ['ACCEPTED_BY_OWNER', 'ASSIGNED_TO_DRIVER', 'IN_TRANSIT', 'COMPLETED'] },
        createdAt: { $gte: start, $lte: end },
        isDeleted: { $ne: true },
    });

    return {
        period,
        loadsInRange,
        matched,
        matchSuccessRate: loadsInRange > 0 ? parseFloat(((matched / loadsInRange) * 100).toFixed(1)) : 0,
        statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count })),
        dailyLoads: dailyLoads.map(d => ({
            date: d._id,
            total: d.total,
            completed: d.completed,
            open: d.open,
        })),
    };
}

// ── 4. Trip / Ride Statistics ──
export async function getTripStatistics(period: string = '7d') {
    const { start, end } = getDateRange(period);

    const [ridesInRange, statusBreakdown, dailyRides, avgPrice] = await Promise.all([
        RideModel.countDocuments({ createdAt: { $gte: start, $lte: end } }),
        RideModel.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
        RideModel.aggregate([
            { $match: { createdAt: { $gte: start, $lte: end } } },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' },
                    },
                    count: { $sum: 1 },
                    completed: {
                        $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]),
        RideModel.aggregate([
            { $match: { status: 'COMPLETED' } },
            { $group: { _id: null, avg: { $avg: '$price' } } },
        ]),
    ]);

    return {
        period,
        ridesInRange,
        avgPrice: avgPrice[0]?.avg ? Math.round(avgPrice[0].avg) : 0,
        statusBreakdown: statusBreakdown.map(s => ({ status: s._id, count: s.count })),
        dailyRides: dailyRides.map(d => ({
            date: d._id,
            total: d.count,
            completed: d.completed,
        })),
    };
}

// ── 5. System Health — real health checks ──
export async function getSystemHealth() {
    const checks: Array<{ service: string; status: 'healthy' | 'degraded' | 'down'; latencyMs?: number; detail?: string }> = [];

    // 1. MongoDB
    try {
        const start = Date.now();
        const state = mongoose.connection.readyState;
        const latency = Date.now() - start;

        if (state === 1) {
            // Run a lightweight ping
            await mongoose.connection.db.admin().ping();
            checks.push({ service: 'MongoDB', status: 'healthy', latencyMs: Date.now() - start });
        } else {
            checks.push({ service: 'MongoDB', status: 'down', detail: `Connection state: ${state}` });
        }
    } catch (err: any) {
        checks.push({ service: 'MongoDB', status: 'down', detail: err.message });
    }

    // 2. Backend self
    checks.push({
        service: 'Backend API',
        status: 'healthy',
        latencyMs: 0,
        detail: `Node.js ${process.version}`,
    });

    // (Groq AI check removed as we use Hugging Face)

    // 4. Python AI Engine
    try {
        const start = Date.now();
        await axios.get(`${env.AI_ENGINE_URL}/health`, { timeout: 5000 });
        checks.push({ service: 'Python AI Engine', status: 'healthy', latencyMs: Date.now() - start });
    } catch {
        checks.push({ service: 'Python AI Engine', status: 'down', detail: 'Not reachable or not running' });
    }

    // 5. Ollama (optional)
    if (env.OLLAMA_HOST) {
        try {
            const start = Date.now();
            await axios.get(`${env.OLLAMA_HOST}/api/tags`, { timeout: 4000 });
            checks.push({ service: 'Ollama (Local LLM)', status: 'healthy', latencyMs: Date.now() - start });
        } catch {
            checks.push({ service: 'Ollama (Local LLM)', status: 'degraded', detail: 'Not reachable' });
        }
    }

    const overallStatus = checks.every(c => c.status === 'healthy')
        ? 'healthy'
        : checks.some(c => c.status === 'down')
            ? 'degraded'
            : 'degraded';

    return {
        overallStatus,
        checkedAt: new Date().toISOString(),
        services: checks,
        serverUptime: process.uptime(),
        nodeVersion: process.version,
        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    };
}

// ── 6. Recent Admin Audit Log ──
export async function getRecentAuditLog(limit: number = 50) {
    const logs = await AdminAuditModel.find({})
        .sort({ createdAt: -1 })
        .limit(Math.min(limit, 200))
        .lean();

    return logs.map(l => ({
        id: (l._id as any).toString(),
        adminEmail: l.adminEmail,
        action: l.action,
        metadata: l.metadata,
        timestamp: (l as any).createdAt,
    }));
}

// ── 7. Build context snapshot for Admin AI ──
export async function buildAdminAiContext(): Promise<string> {
    try {
        const [overview, traffic] = await Promise.all([
            getPlatformOverview(),
            Promise.resolve(getTrafficMetrics()),
        ]);

        return `
## TruckNet Platform Live Data (fetched ${new Date().toISOString()})

### Users
- Total registered users: ${overview.users.total}
- Customers: ${overview.users.customers}
- Drivers: ${overview.users.drivers}
- Fleet Owners: ${overview.users.owners}
- New users today: ${overview.users.newToday}
- Available drivers: ${overview.users.availableDrivers}

### Vehicles
- Total vehicles: ${overview.vehicles.total}
- Available: ${overview.vehicles.available}
- On trip: ${overview.vehicles.onTrip}
- Maintenance: ${overview.vehicles.maintenance}

### Loads
- Total loads: ${overview.loads.total}
- Open (unmatched): ${overview.loads.open}
- In transit: ${overview.loads.inTransit}
- Completed: ${overview.loads.completed}
- Cancelled: ${overview.loads.cancelled}
- New today: ${overview.loads.newToday}
- Match success rate: ${overview.loads.matchSuccessRate}%

### Rides / Trips
- Total rides: ${overview.rides.total}
- Pending: ${overview.rides.pending}
- Ongoing: ${overview.rides.ongoing}
- Completed: ${overview.rides.completed}
- New today: ${overview.rides.newToday}

### API Traffic (instance memory — resets on restart)
- Total requests this session: ${traffic.summary.totalRequests}
- Requests today: ${traffic.summary.requestsToday}
- Requests this hour: ${traffic.summary.requestsThisHour}
- Requests/minute: ${traffic.summary.requestsPerMinute}
- Average API latency: ${traffic.summary.avgLatencyMs}ms
- Error rate: ${traffic.summary.errorRate}%
- Total errors: ${traffic.summary.totalErrors}
- Server uptime: ${traffic.meta.uptimeHuman}
`.trim();
    } catch (err: any) {
        logger.error('Failed to build Admin AI context', { error: err.message });
        return 'Platform data temporarily unavailable.';
    }
}
