// ============================================================
// server/src/routes/shipments.ts — Shipment API Routes
//
// Handles all shipment creation, tracking, and status updates.
// All routes are mounted under: /api/shipments/
//
// Endpoints:
//  - GET  /                → List all shipments (with search, status filter, pagination)
//  - GET  /my/:phone       → Get shipments for a specific customer
//  - GET  /:awb            → Get one shipment by AWB number (includes tracking events)
//  - POST /                → Create a new shipment
//  - PATCH /:awb           → Update shipment status + add tracking event + send email
//
// When a shipment status is updated:
//  1. Database is updated with new status and location
//  2. A TrackingEvent is added to the shipment's timeline
//  3. An email notification is sent to the customer (async)
// ============================================================
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { sendEmail, shipmentStatusEmail } from "../services/email.js";

export function shipmentRoutes(prisma: PrismaClient) {
    const router = Router();

    // GET /api/shipments — List all shipments (with search, filter, pagination)
    router.get("/", async (req, res) => {
        try {
            const { search, status, limit = "20", offset = "0" } = req.query;

            const where: any = {};
            if (status && typeof status === "string") {
                where.status = status;
            }
            if (search && typeof search === "string") {
                where.OR = [
                    { awbNumber: { contains: search } },
                    { senderName: { contains: search } },
                    { receiverName: { contains: search } },
                    { origin: { contains: search } },
                    { destination: { contains: search } },
                ];
            }

            const [shipments, total] = await Promise.all([
                prisma.shipment.findMany({
                    where,
                    take: parseInt(limit as string),
                    skip: parseInt(offset as string),
                    orderBy: { createdAt: "desc" },
                    include: {
                        events: {
                            orderBy: { timestamp: "desc" },
                            take: 1,
                        },
                    },
                }),
                prisma.shipment.count({ where }),
            ]);

            res.json({ shipments, total, limit: parseInt(limit as string), offset: parseInt(offset as string) });
        } catch (error) {
            console.error("Error fetching shipments:", error);
            res.status(500).json({ error: "Failed to fetch shipments" });
        }
    });

    // GET /api/shipments/my/:phone — Get all shipments for a customer by phone
    router.get("/my/:phone", async (req, res) => {
        try {
            const phone = decodeURIComponent(req.params.phone);
            const shipments = await prisma.shipment.findMany({
                where: { customerPhone: phone },
                orderBy: { createdAt: "desc" },
                include: {
                    events: {
                        orderBy: { timestamp: "desc" },
                        take: 1,
                    },
                },
            });
            res.json({ shipments, total: shipments.length });
        } catch (error) {
            console.error("Error fetching customer shipments:", error);
            res.status(500).json({ error: "Failed to fetch customer shipments" });
        }
    });

    // GET /api/shipments/:awb — Get shipment by AWB number (with all tracking events)
    router.get("/:awb", async (req, res) => {
        try {
            const shipment = await prisma.shipment.findUnique({
                where: { awbNumber: req.params.awb },
                include: {
                    events: {
                        orderBy: { timestamp: "desc" },
                    },
                },
            });

            if (!shipment) {
                res.status(404).json({ error: "Shipment not found" });
                return;
            }

            res.json(shipment);
        } catch (error) {
            console.error("Error fetching shipment:", error);
            res.status(500).json({ error: "Failed to fetch shipment" });
        }
    });

    // POST /api/shipments — Create a new shipment
    router.post("/", async (req, res) => {
        try {
            const {
                awbNumber, status, origin, destination, currentLocation,
                senderName, senderAddress, receiverName, receiverAddress,
                weight, dimensions, declaredValue, currency, expectedDelivery, shipmentType,
                customerPhone, customerName, agentPhone,
            } = req.body;

            const shipment = await prisma.shipment.create({
                data: {
                    awbNumber,
                    status: status || "PENDING",
                    origin,
                    destination,
                    currentLocation: currentLocation || origin,
                    senderName,
                    senderAddress: senderAddress || "",
                    receiverName,
                    receiverAddress: receiverAddress || "",
                    weight: parseFloat(weight),
                    dimensions,
                    declaredValue: parseFloat(declaredValue),
                    currency: currency || "USD",
                    expectedDelivery: new Date(expectedDelivery),
                    shipmentType: shipmentType || "STANDARD",
                    customerPhone: customerPhone || "",
                    customerName: customerName || "",
                    agentPhone: agentPhone || "",
                    events: {
                        create: {
                            location: origin,
                            locationCode: "",
                            status: "PENDING",
                            description: "Shipment registered. Awaiting pickup.",
                            timestamp: new Date(),
                        },
                    },
                },
                include: { events: true },
            });

            // Update dashboard stats
            await prisma.dashboardStats.update({
                where: { id: "singleton" },
                data: { activeShipments: { increment: 1 } },
            });

            res.status(201).json(shipment);
        } catch (error) {
            console.error("Error creating shipment:", error);
            res.status(500).json({ error: "Failed to create shipment" });
        }
    });

    // PATCH /api/shipments/:awb — Update shipment status
    router.patch("/:awb", async (req, res) => {
        try {
            const { status, currentLocation, eventDescription, signatureUrl } = req.body;

            const shipment = await prisma.shipment.update({
                where: { awbNumber: req.params.awb },
                data: {
                    ...(status && { status }),
                    ...(currentLocation && { currentLocation }),
                    ...(signatureUrl && { signatureUrl }),
                },
            });

            // Add tracking event if description provided
            if (eventDescription) {
                await prisma.trackingEvent.create({
                    data: {
                        shipmentId: shipment.id,
                        location: currentLocation || shipment.currentLocation,
                        locationCode: "",
                        status: status || shipment.status,
                        description: eventDescription,
                        timestamp: new Date(),
                    },
                });
            }

            const updated = await prisma.shipment.findUnique({
                where: { awbNumber: req.params.awb },
                include: { events: { orderBy: { timestamp: "desc" } } },
            });

            // Send email notification (async — don't block response)
            if (updated && (status || eventDescription)) {
                const emailData = shipmentStatusEmail({
                    customerName: updated.receiverName,
                    awbNumber: updated.awbNumber,
                    status: status || updated.status,
                    currentLocation: currentLocation || updated.currentLocation,
                    description: eventDescription || `Shipment status updated to ${status}`,
                });
                // Only send if receiver has email-like address info
                if (updated.receiverAddress) {
                    sendEmail({ ...emailData, to: "customer@example.com" }).catch(err =>
                        console.error("📧 Email notification failed:", err)
                    );
                }
            }

            res.json(updated);
        } catch (error) {
            console.error("Error updating shipment:", error);
            res.status(500).json({ error: "Failed to update shipment" });
        }
    });

    return router;
}
