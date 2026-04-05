// ============================================================
// server/src/routes/pincode.ts — Pincode Lookup API Routes
//
// Looks up Indian PIN codes using the India Post public API.
// Used in the registration form to auto-fill city and state when user types their PIN.
// All routes are mounted under: /api/pincode/
//
// Endpoints:
//  - GET /:pin → Returns city, state, district for a 6-digit Indian PIN code
//
// Uses external API: https://api.postalpincode.in/pincode/{pin}
// If the external API fails, returns HTTP 502 (Bad Gateway).
// ============================================================
import { Router } from "express";

export function pincodeRoutes() {
    const router = Router();

    // GET /api/pincode/:pin — Lookup city/state from Indian PIN code
    router.get("/:pin", async (req, res) => {
        const pin = req.params.pin;

        // Validate: must be exactly 6 digits
        if (!/^\d{6}$/.test(pin)) {
            res.status(400).json({ error: "Invalid PIN code. Must be 6 digits." });
            return;
        }

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
            const data = await response.json();

            if (!data || !data[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) {
                res.json({ found: false, pin });
                return;
            }

            const postOffices = data[0].PostOffice;
            const first = postOffices[0];

            // Return city (District), state, and list of areas (post office names)
            res.json({
                found: true,
                pin,
                city: first.District || first.Division || "",
                state: first.State || "",
                district: first.District || "",
                division: first.Division || "",
                region: first.Region || "",
                areas: postOffices.map((po: any) => ({
                    name: po.Name,
                    branchType: po.BranchType,
                    deliveryStatus: po.DeliveryStatus,
                })),
            });
        } catch (error) {
            console.error("Pincode lookup error:", error);
            res.status(502).json({ error: "Failed to fetch pincode data from postal service." });
        }
    });

    return router;
}
