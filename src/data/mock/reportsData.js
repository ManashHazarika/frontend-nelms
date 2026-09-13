/**
 * Citizen & Field Verification Reports Data for Arunachal Pradesh
 */

export const INITIAL_REPORTS = [
  {
    id: "REP-2026-092",
    location_name: "Sela Tunnel Approach Road km 136",
    district: "Tawang",
    coordinates: [92.1050, 27.5020],
    reported_at: "2026-09-09T18:10:00Z",
    reporter_type: "FIELD_OFFICER",
    reporter_name: "BRO Detachment Supervisor",
    severity: "CRITICAL",
    verification_status: "VERIFIED",
    verified_by: "DDMO Tawang & BRO Cell",
    verified_at: "2026-09-09T18:30:00Z",
    description: "Active rock fragments rolling down upper cliff onto Tawang arterial highway.",
    current_risk: "CRITICAL",
    media_available: true,
    photo_caption: "Debris blockage near Sela portal",
    status: "ACTION_REQUIRED"
  },
  {
    id: "REP-2026-089",
    location_name: "Sagalee Trans-Arunachal Highway km 43",
    district: "Papum Pare",
    coordinates: [93.4285, 27.2380],
    reported_at: "2026-09-09T16:45:00Z",
    reporter_type: "CITIZEN",
    reporter_name: "Taba Taku (Local Commuter)",
    severity: "CRITICAL",
    verification_status: "VERIFIED",
    verified_by: "DDMO Papum Pare (Yupia HQ)",
    verified_at: "2026-09-09T17:15:00Z",
    description: "Major soil collapse and tree debris fall blocking both lanes near Pare bridge bypass.",
    current_risk: "CRITICAL",
    media_available: true,
    photo_caption: "Debris blockage across two-lane highway carriageway",
    status: "ACTION_REQUIRED"
  },
  {
    id: "REP-2026-091",
    location_name: "Hunli-Anini NH-313 km 162",
    district: "Dibang Valley",
    coordinates: [95.9450, 28.3180],
    reported_at: "2026-09-09T15:50:00Z",
    reporter_type: "CITIZEN",
    reporter_name: "Mipi Gram Burah",
    severity: "HIGH",
    verification_status: "UNVERIFIED",
    verified_by: null,
    verified_at: null,
    description: "Mud slurry accumulation restricting movement to single lane for light motor vehicles.",
    current_risk: "HIGH",
    media_available: true,
    photo_caption: "Highland mud seepage on road surface",
    status: "PENDING_VERIFICATION"
  },
  {
    id: "REP-2026-088",
    location_name: "Karsingsa S-Bend NH-415",
    district: "Papum Pare",
    coordinates: [93.7430, 27.1260],
    reported_at: "2026-09-09T15:20:00Z",
    reporter_type: "FIELD_OFFICER",
    reporter_name: "PWD Highway Inspector R. Nabam",
    severity: "HIGH",
    verification_status: "VERIFIED",
    verified_by: "PWD Highway Division II",
    verified_at: "2026-09-09T15:50:00Z",
    description: "Fissures observed along outer asphalt slope shoulder following morning heavy rainfall.",
    current_risk: "HIGH",
    media_available: true,
    photo_caption: "Tension cracks along highway embankment edge",
    status: "UNDER_MONITORING"
  },
  {
    id: "REP-2026-090",
    location_name: "Pasighat Ranaghat Hill Slope Cut",
    district: "East Siang",
    coordinates: [95.3280, 28.0580],
    reported_at: "2026-09-09T13:40:00Z",
    reporter_type: "CITIZEN",
    reporter_name: "Oken Tayeng",
    severity: "MODERATE",
    verification_status: "UNVERIFIED",
    verified_by: null,
    verified_at: null,
    description: "Minor rock tumbling near water pipeline alignment on hillside cut.",
    current_risk: "MODERATE",
    media_available: false,
    photo_caption: null,
    status: "PENDING_VERIFICATION"
  }
];

export const CITIZEN_REPORTS_GEOJSON = {
  type: "FeatureCollection",
  features: INITIAL_REPORTS
    .filter(r => r.verification_status !== 'VERIFIED')
    .map(r => ({
      type: "Feature",
      id: r.id,
      properties: { ...r, layer_type: 'citizen-report' },
      geometry: { type: "Point", coordinates: r.coordinates }
    }))
};

export const VERIFIED_REPORTS_GEOJSON = {
  type: "FeatureCollection",
  features: INITIAL_REPORTS
    .filter(r => r.verification_status === 'VERIFIED')
    .map(r => ({
      type: "Feature",
      id: r.id,
      properties: { ...r, layer_type: 'verified-report' },
      geometry: { type: "Point", coordinates: r.coordinates }
    }))
};


