"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type MapViewerProps = {
  // Customer location (destination)
  customerLat: number;
  customerLon: number;
  customerAddress: string;

  // Store location (origin) - optional, will use default if not provided
  storeLat?: number;
  storeLon?: number;
  storeName?: string;

  // Agent tracking (future implementation)
  agentLat?: number;
  agentLon?: number;
  agentStatus?: string;

  // Visual options
  showRoute?: boolean;
  showPath?: boolean;
  height?: string;
  width?: string;

  // Order info for context
  orderStatus?: string;
  orderId?: string;
};

// Default store location in Bhubaneswar
const DEFAULT_STORE = {
  lat: 20.2961,
  lng: 85.8245,
  name: "Main Store - Bhubaneswar",
};

export function MapViewer({
  customerLat,
  customerLon,
  customerAddress,
  storeLat = DEFAULT_STORE.lat,
  storeLon = DEFAULT_STORE.lng,
  storeName = DEFAULT_STORE.name,
  agentLat,
  agentLon,
  agentStatus,
  showRoute = false,
  showPath = false,
  height = "400px",
  width = "100%",
  orderStatus,
  orderId,
}: MapViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const storeMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const customerMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const agentMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeSourceId = "route";
  const routeLayerId = "route-layer";
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  const createStoreMarker = useCallback(
    (map: mapboxgl.Map) => {
      storeMarkerRef.current = new mapboxgl.Marker({
        color: "blue",
      })
        .setLngLat([storeLon, storeLat])
        .addTo(map);

      // Add popup for store
      const storePopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="text-center">
          <h3 class="font-semibold text-blue-900">🏪 ${storeName}</h3>
          <p class="text-sm text-gray-600">Order pickup location</p>
        </div>
      `);

      storeMarkerRef.current.setPopup(storePopup);
    },
    [storeLat, storeLon, storeName]
  );

  const createCustomerMarker = useCallback(
    (map: mapboxgl.Map) => {
      customerMarkerRef.current = new mapboxgl.Marker({
        color: "red",
      })
        .setLngLat([customerLon, customerLat])
        .addTo(map);

      // Add popup for customer location
      const customerPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="text-center">
          <h3 class="font-semibold text-red-900">🏠 Delivery Location</h3>
          <p class="text-sm text-gray-600">${customerAddress}</p>
          ${
            orderStatus
              ? `<p class="text-xs mt-1 px-2 py-1 rounded bg-blue-100 text-blue-800">${orderStatus}</p>`
              : ""
          }
        </div>
      `);

      customerMarkerRef.current.setPopup(customerPopup);
    },
    [customerLat, customerLon, customerAddress, orderStatus]
  );

  const createAgentMarker = useCallback(
    (map: mapboxgl.Map, lat: number, lon: number) => {
      if (agentMarkerRef.current) {
        agentMarkerRef.current.setLngLat([lon, lat]);
        return;
      }

      agentMarkerRef.current = new mapboxgl.Marker({
        color: "purple",
      })
        .setLngLat([lon, lat])
        .addTo(map);

      // Add popup for agent
      const agentPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="text-center">
          <h3 class="font-semibold text-purple-900">🚚 Delivery Agent</h3>
          <p class="text-sm text-gray-600">Current location</p>
          ${
            agentStatus
              ? `<p class="text-xs mt-1 px-2 py-1 rounded bg-purple-100 text-purple-800">${agentStatus}</p>`
              : ""
          }
        </div>
      `);

      agentMarkerRef.current.setPopup(agentPopup);
    },
    [agentStatus]
  );

  const addRoute = useCallback(
    async (map: mapboxgl.Map) => {
      try {
        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${storeLon},${storeLat};${customerLon},${customerLat}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
        );
        const json = await query.json();

        if (json.routes && json.routes.length > 0) {
          const data = json.routes[0];
          const route = data.geometry.coordinates;

          const geojson = {
            type: "Feature" as const,
            properties: {},
            geometry: {
              type: "LineString" as const,
              coordinates: route,
            },
          };

          // Check if source already exists
          if (map.getSource(routeSourceId)) {
            (map.getSource(routeSourceId) as mapboxgl.GeoJSONSource).setData(
              geojson
            );
          } else {
            map.addSource(routeSourceId, {
              type: "geojson",
              data: geojson,
            });

            map.addLayer({
              id: routeLayerId,
              type: "line",
              source: routeSourceId,
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#3B82F6",
                "line-width": 5,
                "line-opacity": 0.75,
              },
            });
          }

          // Add route info to state
          const distance = (data.distance / 1000).toFixed(1); // Convert to km
          const duration = Math.round(data.duration / 60); // Convert to minutes

          setRouteInfo({
            distance: `${distance} km`,
            duration: `${duration} min`,
          });
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        setRouteInfo(null);
      }
    },
    [storeLat, storeLon, customerLat, customerLon]
  );

  const removeRoute = useCallback((map: mapboxgl.Map) => {
    if (map.getLayer(routeLayerId)) {
      map.removeLayer(routeLayerId);
    }
    if (map.getSource(routeSourceId)) {
      map.removeSource(routeSourceId);
    }
    setRouteInfo(null);
  }, []);

  const fitMapToBounds = useCallback(
    (map: mapboxgl.Map) => {
      const bounds = new mapboxgl.LngLatBounds();

      // Add store location to bounds
      bounds.extend([storeLon, storeLat]);

      // Add customer location to bounds
      bounds.extend([customerLon, customerLat]);

      // Add agent location if available
      if (agentLat && agentLon) {
        bounds.extend([agentLon, agentLat]);
      }

      // Fit map to show all markers with padding
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    },
    [storeLat, storeLon, customerLat, customerLon, agentLat, agentLon]
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [storeLon, storeLat], // Center on store initially
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", () => {
      // Create markers
      createStoreMarker(map);
      createCustomerMarker(map);

      // Create agent marker if location is provided
      if (agentLat && agentLon) {
        createAgentMarker(map, agentLat, agentLon);
      }

      // Add route if showRoute is enabled
      if (showRoute) {
        addRoute(map);
      }

      // Fit map to show all markers
      fitMapToBounds(map);
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      map.remove();
    };
  }, []);

  // Update agent marker when position changes
  useEffect(() => {
    if (agentLat && agentLon && mapRef.current) {
      if (agentMarkerRef.current) {
        agentMarkerRef.current.setLngLat([agentLon, agentLat]);
      } else {
        createAgentMarker(mapRef.current, agentLat, agentLon);
      }

      // Re-fit bounds when agent location updates
      fitMapToBounds(mapRef.current);
    }
  }, [agentLat, agentLon, createAgentMarker, fitMapToBounds]);

  // Handle route display when showRoute prop changes
  useEffect(() => {
    if (mapRef.current) {
      if (showRoute) {
        addRoute(mapRef.current);
      } else {
        removeRoute(mapRef.current);
      }
    }
  }, [showRoute, addRoute, removeRoute]);

  return (
    <div className="relative">
      <div
        ref={mapContainerRef}
        style={{ width, height, borderRadius: "8px" }}
        className="border border-gray-200 shadow-sm"
      />

      {/* Map Info Panel */}
      <div className="absolute top-2 left-2 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-gray-200">
        {/* Map Legend */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-1">
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#3B82F6",
                borderRadius: "50%",
              }}
            ></div>
            <span className="text-blue-900">Store Location</span>
          </div>
          <div className="flex items-center space-x-1">
            <div
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#EF4444",
                borderRadius: "50%",
              }}
            ></div>
            <span className="text-red-900">Delivery Location</span>
          </div>
          {agentLat && agentLon && (
            <div className="flex items-center space-x-1">
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#9333EA",
                  borderRadius: "50%",
                }}
              ></div>
              <span className="text-purple-900">Agent</span>
            </div>
          )}
        </div>
        {/* Route Information */}
        {routeInfo && showRoute && (
          <div className="mt-2 text-xs text-gray-700">
            <div className="flex items-center space-x-2">
              <span>📍</span>
              <span>{routeInfo.distance}</span>
              <span>⏱️</span>
              <span>~{routeInfo.duration}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
