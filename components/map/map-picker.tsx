"use client";

import { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type MapPickerProps = {
  height?: string;
  width?: string;
  initialLat?: number;
  initialLon?: number;
  selectedLat?: number;
  selectedLon?: number;
  selectedAddress?: string;
  onLocationSelect: (lat: number, lon: number, address: string) => void;
  showGeocoder?: boolean;
  showMyLocation?: boolean;
  showMarker?: boolean;
};

const DEFAULT_LOCATION = {
  lat: 20.26,
  lng: 85.84,
  address: "Bhubaneswar, Odisha, India",
};

export function MapPicker({
  initialLat = DEFAULT_LOCATION.lat,
  initialLon = DEFAULT_LOCATION.lng,
  selectedLat,
  selectedLon,
  selectedAddress,
  onLocationSelect,
  height = "300px",
  width = "100%",
  showGeocoder = true,
  showMyLocation = true,
  showMarker = true,
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const setMarkerLocation = useCallback(
    async (lng: number, lat: number, givenAddress?: string) => {
      if (!mapRef.current) return;

      if (showMarker) {
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new mapboxgl.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .addTo(mapRef.current);
        }
      }

      if (givenAddress) {
        onLocationSelect(lat, lng, givenAddress);
      } else {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&types=address,poi&limit=1`
          );
          const data = await res.json();

          if (data?.features && data.features.length > 0) {
            const feature = data.features[0];
            const address = feature.place_name || "Address not found";
            console.log("Reverse geocoded address:", address);
            onLocationSelect(lat, lng, address);
          } else {
            console.warn("No address found for coordinates");
            onLocationSelect(lat, lng, "Address not found");
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          onLocationSelect(
            lat,
            lng,
            `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
          );
        }
      }
    },
    [onLocationSelect, showMarker]
  );

  const addGeocoder = useCallback(
    (map: mapboxgl.Map) => {
      const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken as string,
        mapboxgl: mapboxgl as any,
        marker: false,
        placeholder: "Search for address...",
      });
      map.addControl(geocoder, "top-left");

      geocoder.on("result", (e) => {
        const { center, place_name } = e.result;
        setMarkerLocation(center[0], center[1], place_name);
      });
    },
    [setMarkerLocation]
  );

  const addMyLocationButton = useCallback(
    (map: mapboxgl.Map) => {
      const geoBtn = document.createElement("button");
      geoBtn.style.cssText =
        "position:absolute;bottom:10px;right:10px;z-index:1;background:white;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:14px;display:flex;align-items:center;gap:6px;border:1px solid #ddd;";

      geoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-locate-fixed"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>`;

      geoBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.geolocation) {
          geoBtn.innerHTML = `Loading...`;
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              console.log("Current location detected:", {
                lat,
                lng,
                accuracy: pos.coords.accuracy,
              });
              map.flyTo({ center: [lng, lat], zoom: 14 });
              setMarkerLocation(lng, lat); // Don't pass generic text, let it reverse geocode
              geoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-locate-fixed"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>`;
            },
            (error) => {
              console.error("Geolocation error:", error);
              geoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-locate-fixed"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg>`;
              alert(`Location access failed: ${error.message}`);
            },
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 120000,
            }
          );
        }
      };

      map.getContainer().appendChild(geoBtn);
    },
    [setMarkerLocation]
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [initialLon, initialLat],
      zoom: 12,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl());

    if (showGeocoder) {
      addGeocoder(map);
    }

    if (showMyLocation) {
      addMyLocationButton(map);
    }

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setMarkerLocation(lng, lat);
    });

    // Initial location setup - only if selectedLat/selectedLon are not provided
    if (typeof selectedLat === "number" && typeof selectedLon === "number") {
      // Use the provided selected location
      map.flyTo({ center: [selectedLon, selectedLat], zoom: 14 });
      if (showMarker) {
        setMarkerLocation(selectedLon, selectedLat, selectedAddress);
      }
    } else if (navigator.geolocation && showMyLocation) {
      // Try to get current location if showMyLocation is enabled
      console.log("Attempting to get current location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          console.log("Auto location detected:", {
            lat,
            lng,
            accuracy: pos.coords.accuracy,
          });
          map.flyTo({ center: [lng, lat], zoom: 14 });
          if (showMarker) {
            setMarkerLocation(lng, lat); // Don't pass generic text, let it reverse geocode
          }
        },
        (error) => {
          console.warn("Auto location failed, using default:", error.message);
          // Fallback to initial location
          if (showMarker) {
            setMarkerLocation(initialLon, initialLat);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 120000,
        }
      );
    } else {
      // Use initial location as fallback
      if (showMarker) {
        setMarkerLocation(initialLon, initialLat);
      }
    }

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (
      typeof selectedLat === "number" &&
      typeof selectedLon === "number" &&
      mapRef.current
    ) {
      mapRef.current.flyTo({ center: [selectedLon, selectedLat], zoom: 14 });
      if (showMarker) {
        setMarkerLocation(selectedLon, selectedLat, selectedAddress);
      }
    }

    // Remove marker if showMarker is false
    if (!showMarker && markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [selectedLat, selectedLon, selectedAddress, showMarker]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: width, height: height, borderRadius: "8px" }}
    />
  );
}
