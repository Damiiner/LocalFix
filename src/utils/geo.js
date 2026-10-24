const R = 6371;

/** Approximate neighborhood centers on the map (not street addresses). */
export const NEIGHBORHOOD_CENTERS = {
  "Monastir Centre": [35.7772, 10.8262],
  Skanes: [35.7615, 10.8111],
  Sahline: [35.7513, 10.7118],
  Ouardanine: [35.6469, 10.8895],
  Moknine: [35.6369, 10.9012]
};

/** Stable small offset from neighborhood center so pins don’t stack (by task id). */
export function taskMapOffset(taskId) {
  const s = String(taskId || "x");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) % 997;
  }
  const dx = ((h % 17) - 8) * 0.00035;
  const dy = (((h >> 3) % 17) - 8) * 0.00035;
  return [dx, dy];
}

export function taskLocationForNeighborhood(neighborhood, taskId) {
  const base = NEIGHBORHOOD_CENTERS[neighborhood] || NEIGHBORHOOD_CENTERS["Monastir Centre"];
  const [ox, oy] = taskMapOffset(taskId);
  return [base[0] + ox, base[1] + oy];
}

export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function mockTravelLabels(km) {
  const walkMin = Math.round(km * 12 + 4);
  const driveMin = Math.max(3, Math.round(km * 2.2 + 3));
  return { walkMin, driveMin };
}
