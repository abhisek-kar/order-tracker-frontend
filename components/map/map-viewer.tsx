"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

type Props = {
  initialCenter?: [number, number];
  initialZoom?: number;
};

export default function MapViewer({
  initialCenter = [77.5946, 12.9716],
  initialZoom = 12,
}: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    // Initialize map
    mapInstance.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: initialCenter,
      zoom: initialZoom,
    });

    // Add navigation (zoom & rotate) controls
    mapInstance.current.addControl(new mapboxgl.NavigationControl());

    // Clean up on unmount
    return () => {
      mapInstance.current?.remove();
    };
  }, [initialCenter, initialZoom]);

  return <div ref={mapContainer} style={{ width: "100%", height: "600px" }} />;
}
