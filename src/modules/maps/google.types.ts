export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface RouteRequest {
  origin: LatLng;
  destination: LatLng;
  waypoints?: LatLng[];
  travelMode?: 'DRIVE' | 'WALK' | 'BICYCLE';
}

export interface RoadsRequest {
  points: LatLng[];
}

export interface WifiAccessPoint {
  macAddress: string; // MAC address of the Wi-Fi access point
  signalStrength?: number; // dBm, optional
  age?: number; // milliseconds since observation, optional
  channel?: number; // Wi-Fi channel, optional
  signalToNoiseRatio?: number; // optional
}

export interface CellTower {
  cellId: number;
  locationAreaCode?: number;
  mobileCountryCode?: number;
  mobileNetworkCode?: number;
  signalStrength?: number;
  timingAdvance?: number;
}

export interface GeolocationRequest {
  considerIp?: boolean;
  wifiAccessPoints?: WifiAccessPoint[];
  cellTowers?: CellTower[];
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface MultiRouteRequest {
  origin: LatLng;
  destination: LatLng;
  travelMode?: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TWO_WHEELER';
  routingPreference?: 'TRAFFIC_AWARE' | 'TRAFFIC_UNAWARE'; // v2 uses this
  departureTime?: string; // ISO string
  computeAlternativeRoutes?: boolean; // true to get multiple routes
}
