import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding EagleEye database (India Edition)...");

    // Clear existing data
    await prisma.trackingEvent.deleteMany();
    await prisma.shipment.deleteMany();
    await prisma.hub.deleteMany();
    await prisma.agent.deleteMany();
    await prisma.dashboardStats.deleteMany();
    await prisma.shippingVolume.deleteMany();

    // ═══════════════════════════════════════
    // DASHBOARD STATS
    // ═══════════════════════════════════════
    await prisma.dashboardStats.create({
        data: {
            id: "singleton",
            activeShipments: 8420,
            totalHubs: 8,
            registeredAgents: 312,
            hubUtilization: 68.4,
            onlinePercent: "97% Online",
            growthPercent: "+9.8%",
            globalReach: "Pan India",
            loadStatus: "Optimal Load",
        },
    });
    console.log("  ✅ Dashboard stats created");

    // ═══════════════════════════════════════
    // SHIPPING VOLUME (last 7 days)
    // ═══════════════════════════════════════
    const volumeData = [
        { day: "Mon", date: "2024-10-14", units: 1200, trend: "up" },
        { day: "Tue", date: "2024-10-15", units: 1450, trend: "up" },
        { day: "Wed", date: "2024-10-16", units: 1800, trend: "up" },
        { day: "Thu", date: "2024-10-17", units: 1650, trend: "down" },
        { day: "Fri", date: "2024-10-18", units: 2100, trend: "up" },
        { day: "Sat", date: "2024-10-19", units: 1300, trend: "down" },
        { day: "Sun", date: "2024-10-20", units: 950, trend: "down" },
    ];
    for (const v of volumeData) {
        await prisma.shippingVolume.create({ data: v });
    }
    console.log("  ✅ Shipping volume data created");

    // ═══════════════════════════════════════
    // INDIA HUBS (with lat/lon in address for map)
    // ═══════════════════════════════════════
    const hubs = [
        {
            name: "Mumbai Hub",
            code: "MUM",
            city: "Navi Mumbai, Maharashtra",
            region: "West India",
            regionTag: "WESTERN GATEWAY HUB",
            address: "Plot 42, JNPT Road, Navi Mumbai 400707",
            capacity: 82,
            activeAgents: 58,
            totalPersonnel: 65,
            status: "WARNING",
            statusNote: "Approaching critical threshold. Rerouting recommended.",
        },
        {
            name: "Delhi Hub",
            code: "DEL",
            city: "Gurugram, Haryana",
            region: "North India",
            regionTag: "NORTHERN LOGISTICS HUB",
            address: "Sector 18, Logistics Park, Gurugram 122001",
            capacity: 45,
            activeAgents: 42,
            totalPersonnel: 48,
            status: "OPTIMIZED",
            statusNote: "Operating within optimal parameters. High throughput.",
        },
        {
            name: "Bangalore Hub",
            code: "BLR",
            city: "Electronic City, Karnataka",
            region: "South India",
            regionTag: "TECH-CORRIDOR NODE",
            address: "Phase 2, Electronic City, Bangalore 560100",
            capacity: 61,
            activeAgents: 55,
            totalPersonnel: 60,
            status: "OPTIMIZED",
            statusNote: "Moderate load. Upcoming peak expected in 4 hours.",
        },
        {
            name: "Chennai Hub",
            code: "MAA",
            city: "Ambattur, Tamil Nadu",
            region: "South India",
            regionTag: "SOUTH COAST TERMINAL",
            address: "SIDCO Industrial Estate, Ambattur, Chennai 600098",
            capacity: 55,
            activeAgents: 36,
            totalPersonnel: 40,
            status: "OPTIMIZED",
            statusNote: "Steady throughput. No congestion.",
        },
        {
            name: "Hyderabad Hub",
            code: "HYD",
            city: "Patancheru, Telangana",
            region: "South India",
            regionTag: "DECCAN LOGISTICS NODE",
            address: "IDA Patancheru, Hyderabad 502319",
            capacity: 47,
            activeAgents: 30,
            totalPersonnel: 35,
            status: "OPTIMIZED",
            statusNote: "Smooth operations. Cross-city clearance active.",
        },
        {
            name: "Kolkata Hub",
            code: "CCU",
            city: "Dankuni, West Bengal",
            region: "East India",
            regionTag: "EASTERN GATEWAY HUB",
            address: "Dankuni Industrial Complex, Hooghly 712311",
            capacity: 70,
            activeAgents: 38,
            totalPersonnel: 42,
            status: "WARNING",
            statusNote: "High volume from northeast routes. Monitor closely.",
        },
        {
            name: "Pune Hub",
            code: "PNQ",
            city: "Chakan, Maharashtra",
            region: "West India",
            regionTag: "AUTO-CORRIDOR HUB",
            address: "Chakan MIDC Phase II, Pune 410501",
            capacity: 38,
            activeAgents: 24,
            totalPersonnel: 28,
            status: "OPTIMIZED",
            statusNote: "Low load. Capacity available for overflow.",
        },
        {
            name: "Ahmedabad Hub",
            code: "AMD",
            city: "Sanand, Gujarat",
            region: "West India",
            regionTag: "GUJARAT INDUSTRIAL NODE",
            address: "Sanand GIDC, Ahmedabad 382110",
            capacity: 52,
            activeAgents: 29,
            totalPersonnel: 34,
            status: "OPTIMIZED",
            statusNote: "Stable operations. Export corridor active.",
        },
    ];
    for (const hub of hubs) {
        await prisma.hub.create({ data: hub });
    }
    console.log("  ✅ India Hubs created (8)");

    // ═══════════════════════════════════════
    // AGENTS (All India-based)
    // ═══════════════════════════════════════
    const agents = [
        // Mumbai
        { name: "Rajesh Kumar", email: "rajesh.kumar@eagleeye.in", phone: "+91 98765 43210", hubCode: "MUM", assignedTasks: 14, completedToday: 9, status: "ON_ROUTE" },
        { name: "Priya Sharma", email: "priya.sharma@eagleeye.in", phone: "+91 98765 43211", hubCode: "MUM", assignedTasks: 12, completedToday: 10, status: "ACTIVE" },
        { name: "Suresh Patil", email: "suresh.patil@eagleeye.in", phone: "+91 99201 57831", hubCode: "MUM", assignedTasks: 10, completedToday: 7, status: "ACTIVE" },
        // Delhi
        { name: "Amit Patel", email: "amit.patel@eagleeye.in", phone: "+91 98765 43212", hubCode: "DEL", assignedTasks: 9, completedToday: 6, status: "ACTIVE" },
        { name: "Sneha Gupta", email: "sneha.gupta@eagleeye.in", phone: "+91 98765 43213", hubCode: "DEL", assignedTasks: 11, completedToday: 7, status: "ON_ROUTE" },
        // Bangalore
        { name: "Vikram Singh", email: "vikram.singh@eagleeye.in", phone: "+91 98765 43214", hubCode: "BLR", assignedTasks: 8, completedToday: 5, status: "ACTIVE" },
        { name: "Ananya Reddy", email: "ananya.reddy@eagleeye.in", phone: "+91 98765 43215", hubCode: "BLR", assignedTasks: 15, completedToday: 12, status: "ON_ROUTE" },
        // Chennai
        { name: "Karthik Murugan", email: "karthik.murugan@eagleeye.in", phone: "+91 94440 12345", hubCode: "MAA", assignedTasks: 7, completedToday: 5, status: "ACTIVE" },
        { name: "Divya Nair", email: "divya.nair@eagleeye.in", phone: "+91 94440 67890", hubCode: "MAA", assignedTasks: 9, completedToday: 6, status: "ON_ROUTE" },
        // Hyderabad
        { name: "Rahul Deshmukh", email: "rahul.deshmukh@eagleeye.in", phone: "+91 97008 11223", hubCode: "HYD", assignedTasks: 6, completedToday: 4, status: "ACTIVE" },
        // Kolkata
        { name: "Subhash Ghosh", email: "subhash.ghosh@eagleeye.in", phone: "+91 98300 44556", hubCode: "CCU", assignedTasks: 11, completedToday: 8, status: "ACTIVE" },
        { name: "Meera Banerjee", email: "meera.banerjee@eagleeye.in", phone: "+91 98300 77889", hubCode: "CCU", assignedTasks: 9, completedToday: 5, status: "ON_ROUTE" },
        // Pune
        { name: "Ganesh Jadhav", email: "ganesh.jadhav@eagleeye.in", phone: "+91 91580 22334", hubCode: "PNQ", assignedTasks: 5, completedToday: 4, status: "ACTIVE" },
        // Ahmedabad
        { name: "Bhavesh Shah", email: "bhavesh.shah@eagleeye.in", phone: "+91 98250 99001", hubCode: "AMD", assignedTasks: 8, completedToday: 6, status: "ACTIVE" },
    ];
    for (const agent of agents) {
        await prisma.agent.create({ data: agent });
    }
    console.log("  ✅ India Agents created (14)");

    // ═══════════════════════════════════════
    // SHIPMENTS — All India routes
    // ═══════════════════════════════════════

    // Shipment 1: Mumbai → Delhi (IN_TRANSIT)
    await prisma.shipment.create({
        data: {
            awbNumber: "EE-742-9910",
            status: "IN_TRANSIT",
            origin: "Mumbai Warehouse, Maharashtra",
            destination: "Connaught Place, New Delhi",
            currentLocation: "Pune Hub",
            senderName: "Reliance Retail Ltd.",
            senderAddress: "Kurla Complex, BKC, Mumbai 400051",
            receiverName: "Rajesh Electronics Store",
            receiverAddress: "Block A, Connaught Place, New Delhi 110001",
            weight: 85,
            dimensions: "1.2m x 0.8m x 0.6m",
            declaredValue: 45000,
            currency: "INR",
            expectedDelivery: new Date("2024-10-26"),
            shipmentType: "EXPRESS",
            events: {
                create: [
                    {
                        location: "Pune Hub",
                        locationCode: "PNQ",
                        status: "IN_TRANSIT",
                        description: "Arrived at Pune sorting facility. Cleared for onward dispatch to Delhi.",
                        timestamp: new Date("2024-10-23T14:30:00Z"),
                    },
                    {
                        location: "Mumbai Hub",
                        locationCode: "MUM",
                        status: "DEPARTED",
                        description: "Departed Mumbai Hub. Loaded on express truck to Delhi via NH-48.",
                        timestamp: new Date("2024-10-23T06:00:00Z"),
                    },
                    {
                        location: "Mumbai Warehouse, BKC",
                        locationCode: "MUM",
                        status: "PICKED_UP",
                        description: "Shipment picked up from Reliance Retail warehouse.",
                        timestamp: new Date("2024-10-22T11:00:00Z"),
                    },
                ],
            },
        },
    });

    // Shipment 2: Delhi → Bangalore (OUT_FOR_DELIVERY)
    await prisma.shipment.create({
        data: {
            awbNumber: "EE-8829-0012",
            status: "IN_TRANSIT",
            origin: "Gurugram Industrial Area, Haryana",
            destination: "Whitefield, Bangalore, Karnataka",
            currentLocation: "Hyderabad Hub",
            senderName: "Maruti Suzuki Parts Depot",
            senderAddress: "Sector 18 Industrial Area, Gurugram 122015",
            receiverName: "Bosch Automotive India",
            receiverAddress: "Whitefield Road, Bangalore 560066",
            weight: 320,
            dimensions: "2.0m x 1.5m x 1.0m",
            declaredValue: 120000,
            currency: "INR",
            expectedDelivery: new Date("2024-10-25"),
            shipmentType: "STANDARD",
            events: {
                create: [
                    {
                        location: "Hyderabad Hub",
                        locationCode: "HYD",
                        status: "IN_TRANSIT",
                        description: "Arrived Hyderabad Hub. Final leg to Bangalore starts at 06:00 tomorrow.",
                        timestamp: new Date("2024-10-24T18:00:00Z"),
                    },
                    {
                        location: "Nagpur Transit Point",
                        locationCode: "NAG",
                        status: "IN_TRANSIT",
                        description: "Passed Nagpur transit checkpoint. On schedule.",
                        timestamp: new Date("2024-10-23T22:00:00Z"),
                    },
                    {
                        location: "Delhi Hub",
                        locationCode: "DEL",
                        status: "DEPARTED",
                        description: "Departed Delhi Hub. Loaded on trailer heading south.",
                        timestamp: new Date("2024-10-23T08:00:00Z"),
                    },
                ],
            },
        },
    });

    // Shipment 3: Chennai → Mumbai (DELIVERED)
    await prisma.shipment.create({
        data: {
            awbNumber: "EE-1055-3347",
            status: "DELIVERED",
            origin: "Ambattur, Chennai, Tamil Nadu",
            destination: "Andheri East, Mumbai, Maharashtra",
            currentLocation: "Delivered",
            senderName: "TVS Motor Company",
            senderAddress: "SIDCO Industrial Estate, Ambattur, Chennai 600098",
            receiverName: "Bajaj Auto Distributors",
            receiverAddress: "MIDC Andheri East, Mumbai 400093",
            weight: 540,
            dimensions: "2.5m x 1.8m x 1.2m",
            declaredValue: 280000,
            currency: "INR",
            expectedDelivery: new Date("2024-10-22"),
            shipmentType: "STANDARD",
            events: {
                create: [
                    {
                        location: "Andheri East, Mumbai",
                        locationCode: "MUM",
                        status: "DELIVERED",
                        description: "Shipment delivered. Signed by: S. Mehta (Store Manager)",
                        timestamp: new Date("2024-10-22T11:30:00Z"),
                    },
                    {
                        location: "Mumbai Hub, Navi Mumbai",
                        locationCode: "MUM",
                        status: "OUT_FOR_DELIVERY",
                        description: "Out for delivery. Agent: Rajesh Kumar",
                        timestamp: new Date("2024-10-22T07:00:00Z"),
                    },
                    {
                        location: "Pune Hub",
                        locationCode: "PNQ",
                        status: "ARRIVED",
                        description: "Arrived Pune sorting facility. Transferred to Mumbai vehicle.",
                        timestamp: new Date("2024-10-21T20:00:00Z"),
                    },
                    {
                        location: "Chennai Hub, Ambattur",
                        locationCode: "MAA",
                        status: "DEPARTED",
                        description: "Departed Chennai Hub. On road to Mumbai via NH-44.",
                        timestamp: new Date("2024-10-20T14:00:00Z"),
                    },
                ],
            },
        },
    });

    // Shipment 4: Kolkata → Delhi (DELAYED)
    await prisma.shipment.create({
        data: {
            awbNumber: "EE-4471-8820",
            status: "DELAYED",
            origin: "Dankuni, West Bengal",
            destination: "Connaught Place, New Delhi",
            currentLocation: "Patna Transit Point",
            senderName: "ITC Limited",
            senderAddress: "Dankuni Industrial Complex, Hooghly 712311",
            receiverName: "Spencer's Retail",
            receiverAddress: "Connaught Place, New Delhi 110001",
            weight: 420,
            dimensions: "1.8m x 1.2m x 0.9m",
            declaredValue: 95000,
            currency: "INR",
            expectedDelivery: new Date("2024-10-24"),
            shipmentType: "STANDARD",
            events: {
                create: [
                    {
                        location: "Patna Transit Point",
                        locationCode: "PAT",
                        status: "DELAYED",
                        description: "Highway blockage on NH-19 due to road repair. Alternative route identified. ETA revised by 12 hours.",
                        timestamp: new Date("2024-10-23T10:00:00Z"),
                    },
                    {
                        location: "Kolkata Hub, Dankuni",
                        locationCode: "CCU",
                        status: "DEPARTED",
                        description: "Departed Kolkata Hub. En route to Delhi via NH-19.",
                        timestamp: new Date("2024-10-22T06:00:00Z"),
                    },
                ],
            },
        },
    });

    // Shipment 5: Ahmedabad → Hyderabad (PENDING)
    await prisma.shipment.create({
        data: {
            awbNumber: "EE-6639-1102",
            status: "PENDING",
            origin: "Sanand GIDC, Ahmedabad, Gujarat",
            destination: "Madhapur IT Park, Hyderabad, Telangana",
            currentLocation: "Ahmedabad Hub",
            senderName: "Tata Motors Components",
            senderAddress: "Sanand GIDC Phase II, Ahmedabad 382110",
            receiverName: "Cyient Technologies",
            receiverAddress: "Madhapur, Hyderabad 500081",
            weight: 180,
            dimensions: "0.5m x 0.4m x 0.3m",
            declaredValue: 38000,
            currency: "INR",
            expectedDelivery: new Date("2024-10-27"),
            shipmentType: "STANDARD",
            events: {
                create: [
                    {
                        location: "Ahmedabad Hub, Sanand",
                        locationCode: "AMD",
                        status: "PENDING",
                        description: "Shipment registered at Ahmedabad Hub. Awaiting vehicle assignment.",
                        timestamp: new Date("2024-10-24T06:00:00Z"),
                    },
                ],
            },
        },
    });

    // Shipment 6: Bangalore → Chennai (OUT_FOR_DELIVERY)
    await prisma.shipment.create({
        data: {
            awbNumber: "EE-3312-7765",
            status: "IN_TRANSIT",
            origin: "Electronic City, Bangalore, Karnataka",
            destination: "T. Nagar, Chennai, Tamil Nadu",
            currentLocation: "Chennai Hub",
            senderName: "Infosys Technologies",
            senderAddress: "Phase 2, Electronic City, Bangalore 560100",
            receiverName: "HCL Technologies Chennai",
            receiverAddress: "Arihant Cyber Park, T. Nagar, Chennai 600017",
            weight: 65,
            dimensions: "0.6m x 0.4m x 0.3m",
            declaredValue: 22000,
            currency: "INR",
            expectedDelivery: new Date("2024-10-24"),
            shipmentType: "EXPRESS",
            events: {
                create: [
                    {
                        location: "Chennai Hub, Ambattur",
                        locationCode: "MAA",
                        status: "OUT_FOR_DELIVERY",
                        description: "Out for delivery. Agent Karthik Murugan assigned.",
                        timestamp: new Date("2024-10-24T08:00:00Z"),
                    },
                    {
                        location: "Bangalore Hub",
                        locationCode: "BLR",
                        status: "DEPARTED",
                        description: "Departed Bangalore Hub. Express vehicle to Chennai.",
                        timestamp: new Date("2024-10-23T22:00:00Z"),
                    },
                    {
                        location: "Electronic City, Bangalore",
                        locationCode: "BLR",
                        status: "PICKED_UP",
                        description: "Shipment picked up from Infosys campus gate.",
                        timestamp: new Date("2024-10-23T16:00:00Z"),
                    },
                ],
            },
        },
    });

    console.log("  ✅ India Shipments created (6) with tracking events");
    console.log("\n🎉 Seeding complete! All data is India-specific.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
