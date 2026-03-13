/**
 * coordinates.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * City-to-GPS-coordinates lookup utility for Indian cities.
 *
 * WHY THIS EXISTS:
 *  When a customer types a city name like "Mumbai" or "Bangalore",
 *  we need to convert that text into latitude/longitude coordinates
 *  so we can calculate distances and find the nearest hub on the map.
 *
 * WHAT'S IN HERE:
 *  1. HUB_COORDINATES   — A dictionary mapping hub codes to [lat, lng]
 *  2. guessCoords(city) — The main function: converts a city name string
 *                         to approximate [lat, lng] coordinates.
 *                         Returns null if the city is unknown.
 *
 * WHERE IT'S USED:
 *  - ClientPortalPage.tsx (distanceKm function uses guessCoords to calculate shipping distance)
 *  - mapData.ts (agent coordinates)
 * ─────────────────────────────────────────────────────────────────────────────
 */
// Coordinates for known hub cities in India
export const HUB_COORDINATES: Record<string, [number, number]> = {
    MUM: [19.076, 72.8777],  // Mumbai
    DEL: [28.4595, 77.0266], // Gurugram / Delhi
    BLR: [12.8399, 77.6770], // Electronic City, Bangalore
    MAA: [13.1143, 80.1548], // Ambattur, Chennai
    HYD: [17.5250, 78.2673], // Patancheru, Hyderabad
    CCU: [22.6155, 88.2748], // Dankuni, Kolkata
    PNQ: [18.7592, 73.8552], // Chakan, Pune
    AMD: [22.9668, 72.3767], // Sanand, Ahmedabad
    NAG: [21.1458, 79.0882], // Nagpur
    PAT: [25.5941, 85.1376], // Patna
    VNS: [25.3176, 82.9739], // Varanasi
    AGR: [27.1767, 78.0081], // Agra
    ASR: [31.6340, 74.8723], // Amritsar
    SML: [31.1048, 77.1734], // Shimla
    JMU: [32.7266, 74.8570], // Jammu
    GOI: [15.4909, 73.8278], // Goa
    TRV: [8.5241, 76.9366],  // Thiruvananthapuram
    MNG: [12.9141, 74.8560], // Mangalore
    MYS: [12.2958, 76.6394], // Mysore
    RPR: [21.2514, 81.6296], // Raipur
    GWL: [26.2183, 78.1828], // Gwalior
    JDH: [26.2389, 73.0243], // Jodhpur
    UDR: [24.5854, 73.7125], // Udaipur
    SZX: [22.5431, 114.0579],
    SIN: [1.3521, 103.8198],
};

// City name → coordinates mapper for location strings
export function guessCoords(location: string): [number, number] | null {
    const lower = location.toLowerCase().trim();
    if (!lower || lower === "delivered") return null;

    // ── Exact/prefix matches for major cities ──
    if (lower.includes("mumbai") || lower.includes("navi mumbai") || lower.includes("thane")) return [19.076, 72.8777];
    if (lower.includes("delhi") || lower.includes("gurugram") || lower.includes("new delhi") || lower.includes("gurgaon") || lower.includes("noida") || lower.includes("faridabad") || lower.includes("ghaziabad")) return [28.6139, 77.2090];
    if (lower.includes("bangalore") || lower.includes("bengaluru") || lower.includes("electronic city")) return [12.9716, 77.5946];
    if (lower.includes("chennai") || lower.includes("ambattur") || lower.includes("t. nagar")) return [13.0827, 80.2707];
    if (lower.includes("hyderabad") || lower.includes("patancheru") || lower.includes("madhapur") || lower.includes("secunderabad")) return [17.3850, 78.4867];
    if (lower.includes("kolkata") || lower.includes("dankuni") || lower.includes("howrah")) return [22.5726, 88.3639];
    if (lower.includes("pune") || lower.includes("chakan") || lower.includes("pimpri")) return [18.5204, 73.8567];
    if (lower.includes("ahmedabad") || lower.includes("sanand") || lower.includes("gandhinagar")) return [23.0225, 72.5714];
    if (lower.includes("nagpur")) return [21.1458, 79.0882];
    if (lower.includes("patna")) return [25.5941, 85.1376];
    if (lower.includes("lucknow")) return [26.8467, 80.9462];
    if (lower.includes("jaipur")) return [26.9124, 75.7873];
    if (lower.includes("surat")) return [21.1702, 72.8311];
    if (lower.includes("varanasi") || lower.includes("banaras")) return [25.3176, 82.9739];
    if (lower.includes("agra")) return [27.1767, 78.0081];
    if (lower.includes("amritsar")) return [31.6340, 74.8723];
    if (lower.includes("shimla")) return [31.1048, 77.1734];
    if (lower.includes("jammu")) return [32.7266, 74.8570];
    if (lower.includes("goa") || lower.includes("panaji")) return [15.4909, 73.8278];
    if (lower.includes("trivandrum") || lower.includes("thiruvananthapuram")) return [8.5241, 76.9366];
    if (lower.includes("mangalore") || lower.includes("mangaluru")) return [12.9141, 74.8560];
    if (lower.includes("mysore") || lower.includes("mysuru")) return [12.2958, 76.6394];
    if (lower.includes("raipur")) return [21.2514, 81.6296];
    if (lower.includes("gwalior")) return [26.2183, 78.1828];
    if (lower.includes("jodhpur")) return [26.2389, 73.0243];
    if (lower.includes("udaipur")) return [24.5854, 73.7125];
    if (lower.includes("bhopal")) return [23.2599, 77.4126];
    if (lower.includes("indore")) return [22.7196, 75.8577];
    if (lower.includes("chandigarh")) return [30.7333, 76.7794];
    if (lower.includes("dehradun")) return [30.3165, 78.0322];
    if (lower.includes("ranchi")) return [23.3441, 85.3096];
    if (lower.includes("bhubaneswar") || lower.includes("bhubaneshwar")) return [20.2961, 85.8245];
    if (lower.includes("coimbatore")) return [11.0168, 76.9558];
    if (lower.includes("kochi") || lower.includes("cochin") || lower.includes("ernakulam")) return [9.9312, 76.2673];
    if (lower.includes("vizag") || lower.includes("visakhapatnam")) return [17.6868, 83.2185];
    if (lower.includes("guwahati")) return [26.1445, 91.7362];

    // ── Additional districts/cities commonly returned by India Post API ──
    if (lower.includes("kanpur")) return [26.4499, 80.3319];
    if (lower.includes("gautam") || lower.includes("greater noida")) return [28.4744, 77.5040];
    if (lower.includes("meerut")) return [28.9845, 77.7064];
    if (lower.includes("prayagraj") || lower.includes("allahabad")) return [25.4358, 81.8463];
    if (lower.includes("gorakhpur")) return [26.7606, 83.3732];
    if (lower.includes("bareilly")) return [28.3670, 79.4304];
    if (lower.includes("aligarh")) return [27.8974, 78.0880];
    if (lower.includes("moradabad")) return [28.8386, 78.7733];
    if (lower.includes("saharanpur")) return [29.9680, 77.5510];
    if (lower.includes("mathura")) return [27.4924, 77.6737];
    if (lower.includes("firozabad")) return [27.1591, 78.3957];
    if (lower.includes("muzaffarnagar")) return [29.4727, 77.7085];
    if (lower.includes("jhansi")) return [25.4484, 78.5685];
    if (lower.includes("ayodhya") || lower.includes("faizabad")) return [26.7922, 82.1998];
    if (lower.includes("sultanpur")) return [26.2648, 82.0727];
    if (lower.includes("haridwar")) return [29.9457, 78.1642];
    if (lower.includes("nainital")) return [29.3803, 79.4636];
    if (lower.includes("bikaner")) return [28.0229, 73.3119];
    if (lower.includes("kota")) return [25.2138, 75.8648];
    if (lower.includes("ajmer")) return [26.4499, 74.6399];
    if (lower.includes("alwar")) return [27.5530, 76.6346];
    if (lower.includes("jalandhar")) return [31.3260, 75.5762];
    if (lower.includes("ludhiana")) return [30.9010, 75.8573];
    if (lower.includes("patiala")) return [30.3398, 76.3869];
    if (lower.includes("bathinda") || lower.includes("bhatinda")) return [30.2110, 74.9455];
    if (lower.includes("vadodara") || lower.includes("baroda")) return [22.3072, 73.1812];
    if (lower.includes("rajkot")) return [22.3039, 70.8022];
    if (lower.includes("bhavnagar")) return [21.7645, 72.1519];
    if (lower.includes("nashik") || lower.includes("nasik")) return [19.9975, 73.7898];
    if (lower.includes("aurangabad") || lower.includes("sambhajinagar")) return [19.8762, 75.3433];
    if (lower.includes("solapur") || lower.includes("sholapur")) return [17.6599, 75.9064];
    if (lower.includes("kolhapur")) return [16.7050, 74.2433];
    if (lower.includes("nanded")) return [19.1383, 77.3210];
    if (lower.includes("sangli")) return [16.8524, 74.5815];
    if (lower.includes("amravati")) return [20.9374, 77.7796];
    if (lower.includes("jalgaon")) return [21.0077, 75.5626];
    if (lower.includes("dhanbad")) return [23.7957, 86.4304];
    if (lower.includes("jamshedpur")) return [22.8046, 86.2029];
    if (lower.includes("bokaro")) return [23.6693, 86.1511];
    if (lower.includes("bilaspur")) return [22.0797, 82.1409];
    if (lower.includes("durg") || lower.includes("bhilai")) return [21.1904, 81.2849];
    if (lower.includes("cuttack")) return [20.4625, 85.8830];
    if (lower.includes("sambalpur")) return [21.4669, 83.9812];
    if (lower.includes("vijayawada") || lower.includes("krishna")) return [16.5062, 80.6480];
    if (lower.includes("guntur")) return [16.3067, 80.4365];
    if (lower.includes("tirupati")) return [13.6288, 79.4192];
    if (lower.includes("warangal")) return [17.9784, 79.5941];
    if (lower.includes("madurai")) return [9.9252, 78.1198];
    if (lower.includes("tiruchirappalli") || lower.includes("trichy")) return [10.7905, 78.7047];
    if (lower.includes("salem")) return [11.6643, 78.1460];
    if (lower.includes("tirunelveli")) return [8.7139, 77.7567];
    if (lower.includes("kozhikode") || lower.includes("calicut")) return [11.2588, 75.7804];
    if (lower.includes("thrissur") || lower.includes("trichur")) return [10.5276, 76.2144];
    if (lower.includes("kannur")) return [11.8745, 75.3704];
    if (lower.includes("hubli") || lower.includes("dharwad")) return [15.3647, 75.1240];
    if (lower.includes("belgaum") || lower.includes("belagavi")) return [15.8497, 74.4977];
    if (lower.includes("gulbarga") || lower.includes("kalaburagi")) return [17.3297, 76.8343];
    if (lower.includes("shimoga") || lower.includes("shivamogga")) return [13.9299, 75.5681];
    if (lower.includes("silchar")) return [24.8333, 92.7789];
    if (lower.includes("dibrugarh")) return [27.4728, 94.9120];
    if (lower.includes("imphal")) return [24.8170, 93.9368];
    if (lower.includes("agartala")) return [23.8315, 91.2868];
    if (lower.includes("shillong")) return [25.5788, 91.8933];
    if (lower.includes("gangtok")) return [27.3389, 88.6065];
    if (lower.includes("aizawl")) return [23.7271, 92.7176];
    if (lower.includes("kohima")) return [25.6751, 94.1086];
    if (lower.includes("itanagar")) return [27.0844, 93.6053];
    if (lower.includes("pondicherry") || lower.includes("puducherry")) return [11.9416, 79.8083];

    return null;
}
