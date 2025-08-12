"use client";

import { useRef, useEffect, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";

type MapPickerProps = {
  initialLat?: number;
  initialLon?: number;
  selectedLat?: number;
  selectedLon?: number;
  selectedAddress?: string;
  onLocationSelect: (lat: number, lon: number, address: string) => void;
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
}: MapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const setMarkerLocation = useCallback(
    async (lng: number, lat: number, givenAddress?: string) => {
      if (!mapRef.current) return;

      if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
      } else {
        markerRef.current = new mapboxgl.Marker({ color: "red" })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);
      }

      if (givenAddress) {
        onLocationSelect(lat, lng, givenAddress);
      } else {
        try {
          const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
          );
          const data = await res.json();
          const address =
            data?.features?.[0]?.place_name || "Address not found";
          onLocationSelect(lat, lng, address);
        } catch {
          onLocationSelect(lat, lng, "");
        }
      }
    },
    [onLocationSelect]
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

      geoBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-locate-fixed"><line x1="2" x2="5" y1="12" y2="12"/><line x1="19" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="5"/><line x1="12" x2="12" y1="19" y2="22"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/></svg> My Location`;

      geoBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            map.flyTo({ center: [lng, lat], zoom: 14 });
            setMarkerLocation(lng, lat, "Your current location");
          });
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
    addGeocoder(map);
    addMyLocationButton(map);

    map.on("click", (e) => {
      const { lng, lat } = e.lngLat;
      setMarkerLocation(lng, lat);
    });

    // Initial location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          map.flyTo({ center: [lng, lat], zoom: 14 });
          setMarkerLocation(lng, lat, "Your current location");
        },
        () => {
          setMarkerLocation(initialLon, initialLat);
        }
      );
    } else {
      setMarkerLocation(initialLon, initialLat);
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
      setMarkerLocation(selectedLon, selectedLat, selectedAddress);
    }
  }, [selectedLat, selectedLon, selectedAddress, setMarkerLocation]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "300px", borderRadius: "8px" }}
    />
  );
}
