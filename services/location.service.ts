import * as Location from "expo-location";
import { updateMyProfile } from "@/services/user.service";

export type Coords = {
  lat: number;
  lng: number;
};

/**
 * Ask permission + current GPS
 */
export async function getCurrentCoords(): Promise<Coords> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Location permission denied");
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

/**
 * Save worker/customer location to profile
 * updateMyProfile must accept lat/lng (backend Step 3)
 */
export async function updateMyLocation() {
  const coords = await getCurrentCoords();

  // user.service updateMyProfile-এ lat/lng পাঠাও
  // যদি তোমার updateMyProfile শুধু specific fields নেয়,
  // backend merge:true থাকায় lat/lng চলে যাবে
  await updateMyProfile({
    lat: coords.lat,
    lng: coords.lng,
  } as any);

  return coords;
}

/**
 * Haversine distance in KM
 */
export function getDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format: "1.2 km away"
 */
export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined || Number.isNaN(km)) {
    return "Distance N/A";
  }

  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }

  return `${km.toFixed(1)} km away`;
}