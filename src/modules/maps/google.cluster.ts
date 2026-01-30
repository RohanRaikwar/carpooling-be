import { LatLng } from './google.types';

export const clusterStops = (stops: LatLng[], size = 25): LatLng[][] => {
  const clusters: LatLng[][] = [];
  for (let i = 0; i < stops.length; i += size) {
    clusters.push(stops.slice(i, i + size));
  }
  return clusters;
};
