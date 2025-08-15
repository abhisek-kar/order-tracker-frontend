"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  useWebSocket,
  AgentLocationUpdate,
  OrderStatusUpdate,
} from "@/hooks/use-websocket";
import { toast } from "sonner";

type MapViewerProps = {
  customerLat: number;
  customerLon: number;
  customerAddress: string;

  storeLat?: number;
  storeLon?: number;
  storeName?: string;

  agentLat?: number;
  agentLon?: number;

  showRoute?: boolean;
  showPath?: boolean;
  height?: string;
  width?: string;
  enableRealTimeTracking?: boolean;

  orderStatus?: string;
  orderId?: string;
};

const DEFAULT_STORE = {
  lat: 21.022472,
  lng: 86.48814,
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

  const [realTimeAgentLat, setRealTimeAgentLat] = useState<number | undefined>(
    agentLat
  );
  const [realTimeAgentLon, setRealTimeAgentLon] = useState<number | undefined>(
    agentLon
  );
  const [realTimeOrderStatus, setRealTimeOrderStatus] = useState<
    string | undefined
  >(orderStatus);
  const [isTrackingLive, setIsTrackingLive] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  const handleAgentLocationUpdate = useCallback(
    (data: AgentLocationUpdate) => {
      setRealTimeAgentLat(data.latitude);
      setRealTimeAgentLon(data.longitude);
      setRealTimeOrderStatus(data.status);
      setIsTrackingLive(true);
    },
    [orderId]
  );

  const handleOrderStatusUpdate = useCallback((data: OrderStatusUpdate) => {
    setRealTimeOrderStatus(data.status);
  }, []);

  const handleWebSocketConnect = useCallback(() => {
    setIsTrackingLive(true);
  }, []);

  const handleWebSocketDisconnect = useCallback(() => {
    setIsTrackingLive(false);
  }, []);

  useEffect(() => {
    if (agentLat && agentLon && !realTimeAgentLat && !realTimeAgentLon) {
      setRealTimeAgentLat(agentLat);
      setRealTimeAgentLon(agentLon);
    }

  
    if (agentLat && agentLon && realTimeAgentLat && realTimeAgentLon) {
      const latDiff = Math.abs(agentLat - realTimeAgentLat);
      const lonDiff = Math.abs(agentLon - realTimeAgentLon);

      if (latDiff > 0.0001 || lonDiff > 0.0001) {
        setRealTimeAgentLat(agentLat);
        setRealTimeAgentLon(agentLon);
      }
    }
  }, [agentLat, agentLon, realTimeAgentLat, realTimeAgentLon]);

  const currentAgentLat = realTimeAgentLat ?? agentLat;
  const currentAgentLon = realTimeAgentLon ?? agentLon;
  const currentOrderStatus = realTimeOrderStatus ?? orderStatus;


  const shouldShowAgentTracking = currentOrderStatus !== "Delivered"; 

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

      const customerPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="text-center">
          <h3 class="font-semibold text-red-900">🏠 Delivery Location</h3>
          <p class="text-sm text-gray-600">${customerAddress}</p>
        </div>
      `);

      customerMarkerRef.current.setPopup(customerPopup);
    },
    [customerLat, customerLon, customerAddress]
  );

  const createAgentMarker = useCallback(
    (map: mapboxgl.Map, lat: number, lon: number) => {
      if (!map || !lat || !lon) {
        return;
      }

      if (agentMarkerRef.current) {
        try {
          agentMarkerRef.current.setLngLat([lon, lat]);
        } catch (error) {
          // If update fails, remove and recreate
          agentMarkerRef.current.remove();
          agentMarkerRef.current = null;
        }
        if (agentMarkerRef.current) return;
      }

      try {
        agentMarkerRef.current = new mapboxgl.Marker({
          color: "#F59E0B",
        })
          .setLngLat([lon, lat])
          .addTo(map);

        const agentPopup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div class="text-center">
            <h3 class="font-semibold text-yellow-900">📍 Delivery Agent</h3>
            <p class="text-sm text-gray-600">Vehicle: Bike</p>
            <p class="text-xs text-gray-500">Lat: ${lat.toFixed(6)}</p>
            <p class="text-xs text-gray-500">Lng: ${lon.toFixed(6)}</p>
            ${
              currentOrderStatus
                ? `<p class="text-xs mt-1 px-2 py-1 rounded bg-purple-100 text-purple-800">${currentOrderStatus}</p>`
                : ""
            }
          </div>
        `);

        agentMarkerRef.current.setPopup(agentPopup);
      } catch (error) {
        agentMarkerRef.current = null;
      }
    },
    [currentOrderStatus]
  );
  const addRoute = useCallback(
    async (map: mapboxgl.Map) => {
      try {
        let startLat, startLon;
        if (currentAgentLat && currentAgentLon && shouldShowAgentTracking) {
          startLat = currentAgentLat;
          startLon = currentAgentLon;
        } else {
          startLat = storeLat;
          startLon = storeLon;
        }

        const query = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${startLon},${startLat};${customerLon},${customerLat}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
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

          const distance = (data.distance / 1000).toFixed(1);
          const duration = Math.round(data.duration / 60);

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

      if (
        currentOrderStatus !== "Out for Delivery" &&
        currentOrderStatus !== "Delivered"
      ) {
        bounds.extend([storeLon, storeLat]);
      }

      bounds.extend([customerLon, customerLat]);

      if (currentAgentLat && currentAgentLon && shouldShowAgentTracking) {
        bounds.extend([currentAgentLon, currentAgentLat]);
      }

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
      currentOrderStatus,
    ]
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [storeLon, storeLat],
      zoom: 12,
    });

    mapRef.current = map;

    map.on("load", () => {
      createCustomerMarker(map);

      createStoreMarker(map);

      if (showRoute) {
        addRoute(map);
      }

      setIsMapReady(true); 
    });

    map.on("error", (e) => {
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    return () => {
      if (storeMarkerRef.current) {
        storeMarkerRef.current = null;
      }
      if (customerMarkerRef.current) {
        customerMarkerRef.current = null;
      }
      if (agentMarkerRef.current) {
        agentMarkerRef.current = null;
      }
      setIsMapReady(false); 
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      if (
        currentOrderStatus === "Out for Delivery" ||
        currentOrderStatus === "Delivered"
      ) {
        if (storeMarkerRef.current) {
          storeMarkerRef.current.remove();
          storeMarkerRef.current = null;
        }
      } else {
        if (!storeMarkerRef.current) {
          createStoreMarker(mapRef.current);
        }
      }

      fitMapToBounds(mapRef.current);
    }
  }, [currentOrderStatus, createStoreMarker, fitMapToBounds]);

  useEffect(() => {
    if (!mapRef.current || !isMapReady) {
      return;
    }

    if (currentAgentLat && currentAgentLon && shouldShowAgentTracking) {
      if (agentMarkerRef.current) {
        try {
          agentMarkerRef.current.remove();
          agentMarkerRef.current = null;

          createAgentMarker(mapRef.current, currentAgentLat, currentAgentLon);
        } catch (error) {
          agentMarkerRef.current = null;
          createAgentMarker(mapRef.current, currentAgentLat, currentAgentLon);
        }
      } else {
        createAgentMarker(mapRef.current, currentAgentLat, currentAgentLon);
      }

      setTimeout(() => {
        if (mapRef.current) {
          fitMapToBounds(mapRef.current);
        }
      }, 100);
    } else if (agentMarkerRef.current && !shouldShowAgentTracking) {
      agentMarkerRef.current.remove();
      agentMarkerRef.current = null;
    }
  }, [
    currentAgentLat,
    currentAgentLon,
    shouldShowAgentTracking,
    isMapReady,
    createAgentMarker,
    fitMapToBounds,
  ]);

  useEffect(() => {
    if (mapRef.current) {
      if (showRoute) {
        addRoute(mapRef.current);
      } else {
        removeRoute(mapRef.current);
      }
    }
  }, [showRoute, addRoute, removeRoute, currentAgentLat, currentAgentLon]);

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
        {/* {shouldEnableRealTimeTracking && (
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
        )} */}

        {/* Map Legend */}
        <div className="space-y-1 text-xs">
          {currentOrderStatus !== "Out for Delivery" &&
            currentOrderStatus !== "Delivered" && (
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
            )}
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
                  backgroundColor: "#F59E0B",
                  borderRadius: "50%",
                }}
              ></div>{" "}
              <span className="text-amber-900">Agent</span>
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
