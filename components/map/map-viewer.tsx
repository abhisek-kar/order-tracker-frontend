"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  useWebSocket,
  AgentLocationUpdate,
  OrderStatusUpdate,
} from "@/hooks/use-websocket";

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
  enableRealTimeTracking?: boolean;

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
  enableRealTimeTracking = false,
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

  // Real-time tracking state
  const [realTimeAgentLat, setRealTimeAgentLat] = useState<number | undefined>(
    agentLat
  );
  const [realTimeAgentLon, setRealTimeAgentLon] = useState<number | undefined>(
    agentLon
  );
  const [realTimeAgentStatus, setRealTimeAgentStatus] = useState<
    string | undefined
  >(agentStatus);
  const [realTimeOrderStatus, setRealTimeOrderStatus] = useState<
    string | undefined
  >(orderStatus);
  const [isTrackingLive, setIsTrackingLive] = useState(false);

  // WebSocket handlers
  const handleAgentLocationUpdate = useCallback((data: AgentLocationUpdate) => {
    setRealTimeAgentLat(data.latitude);
    setRealTimeAgentLon(data.longitude);
    setRealTimeAgentStatus(data.status);
    setIsTrackingLive(true);
  }, []);

  const handleOrderStatusUpdate = useCallback((data: OrderStatusUpdate) => {
    setRealTimeOrderStatus(data.status);
  }, []);

  const handleWebSocketConnect = useCallback(() => {
    setIsTrackingLive(true);
  }, []);

  const handleWebSocketDisconnect = useCallback(() => {
    setIsTrackingLive(false);
  }, []);

  // Use real-time data if available, otherwise fall back to props
  const currentAgentLat = realTimeAgentLat ?? agentLat;
  const currentAgentLon = realTimeAgentLon ?? agentLon;
  const currentAgentStatus = realTimeAgentStatus ?? agentStatus;
  const currentOrderStatus = realTimeOrderStatus ?? orderStatus;

  // Determine if agent tracking should be shown based on order status
  const shouldShowAgentTracking =
    currentOrderStatus === "Picked Up" ||
    currentOrderStatus === "Out for Delivery";
  const shouldEnableRealTimeTracking =
    enableRealTimeTracking && shouldShowAgentTracking;

  // WebSocket connection
  const { isConnected, connectionStatus } = useWebSocket({
    orderId: shouldEnableRealTimeTracking ? orderId : undefined,
    onAgentLocationUpdate: handleAgentLocationUpdate,
    onOrderStatusUpdate: handleOrderStatusUpdate,
    onConnect: handleWebSocketConnect,
    onDisconnect: handleWebSocketDisconnect,
  });

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
            currentOrderStatus
              ? `<p class="text-xs mt-1 px-2 py-1 rounded bg-blue-100 text-blue-800">${currentOrderStatus}</p>`
              : ""
          }
        </div>
      `);

      customerMarkerRef.current.setPopup(customerPopup);
    },
    [customerLat, customerLon, customerAddress, currentOrderStatus]
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
            currentAgentStatus
              ? `<p class="text-xs mt-1 px-2 py-1 rounded bg-purple-100 text-purple-800">${currentAgentStatus}</p>`
              : ""
          }
        </div>
      `);

      agentMarkerRef.current.setPopup(agentPopup);
    },
    [currentAgentStatus]
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

          // Check if source already exists and map style is loaded
          if (map.isStyleLoaded()) {
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
          } else {
            // Wait for style to load before adding route
            map.once("styledata", () => {
              if (map.getSource(routeSourceId)) {
                (
                  map.getSource(routeSourceId) as mapboxgl.GeoJSONSource
                ).setData(geojson);
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

      // Add agent location if available and should be shown
      if (currentAgentLat && currentAgentLon && shouldShowAgentTracking) {
        bounds.extend([currentAgentLon, currentAgentLat]);
      }

      // Fit map to show all markers with padding
      map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15,
      });
    },
    [
      storeLat,
      storeLon,
      customerLat,
      customerLon,
      currentAgentLat,
      currentAgentLon,
      shouldShowAgentTracking,
    ]
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

      // Create agent marker if location is provided and should be shown
      if (currentAgentLat && currentAgentLon && shouldShowAgentTracking) {
        createAgentMarker(map, currentAgentLat, currentAgentLon);
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

  // Update agent marker when position changes (real-time or props)
  useEffect(() => {
    if (
      currentAgentLat &&
      currentAgentLon &&
      mapRef.current &&
      shouldShowAgentTracking
    ) {
      if (agentMarkerRef.current) {
        // Smooth transition for real-time updates
        agentMarkerRef.current.setLngLat([currentAgentLon, currentAgentLat]);
      } else {
        createAgentMarker(mapRef.current, currentAgentLat, currentAgentLon);
      }

      // Update agent popup with current status
      if (agentMarkerRef.current) {
        const agentPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="text-center">
            <h3 class="font-semibold text-purple-900">🚚 Delivery Agent</h3>
            <p class="text-sm text-gray-600">Current location</p>
            ${
              currentAgentStatus
                ? `<p class="text-xs mt-1 px-2 py-1 rounded bg-purple-100 text-purple-800">${currentAgentStatus}</p>`
                : ""
            }
            ${
              isTrackingLive
                ? `<p class="text-xs mt-1 text-green-600">🟢 Live tracking</p>`
                : ""
            }
          </div>
        `);
        agentMarkerRef.current.setPopup(agentPopup);
      }

      // Only re-fit bounds if this is a significant location change
      if (isTrackingLive) {
        fitMapToBounds(mapRef.current);
      }
    } else if (agentMarkerRef.current && !shouldShowAgentTracking) {
      // Remove agent marker if it shouldn't be shown
      agentMarkerRef.current.remove();
      agentMarkerRef.current = null;
    }
  }, [
    currentAgentLat,
    currentAgentLon,
    currentAgentStatus,
    isTrackingLive,
    shouldShowAgentTracking,
    createAgentMarker,
    fitMapToBounds,
  ]);

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
        {/* Real-time tracking status */}
        {shouldEnableRealTimeTracking && (
          <div className="mb-2 text-xs">
            <div className="flex items-center space-x-1">
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  backgroundColor: isConnected ? "#10B981" : "#EF4444",
                  borderRadius: "50%",
                }}
              ></div>
              <span className={isConnected ? "text-green-700" : "text-red-700"}>
                {connectionStatus === "connecting"
                  ? "Connecting..."
                  : connectionStatus === "connected"
                  ? "Live tracking"
                  : connectionStatus === "error"
                  ? "Connection error"
                  : "Offline"}
              </span>
            </div>
          </div>
        )}

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
          {currentAgentLat && currentAgentLon && shouldShowAgentTracking && (
            <div className="flex items-center space-x-1">
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  backgroundColor: "#9333EA",
                  borderRadius: "50%",
                }}
              ></div>
              <span className="text-purple-900">
                Agent {isTrackingLive ? "(Live)" : ""}
              </span>
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

        {/* Current Order Status */}
        {currentOrderStatus && (
          <div className="mt-2">
            <p
              className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                currentOrderStatus === "Delivered"
                  ? "bg-green-100 text-green-800"
                  : currentOrderStatus === "Out for Delivery"
                  ? "bg-purple-100 text-purple-800"
                  : currentOrderStatus === "Picked Up"
                  ? "bg-orange-100 text-orange-800"
                  : currentOrderStatus === "Reached Store"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {currentOrderStatus}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
