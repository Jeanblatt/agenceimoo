"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LeafletEvent } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface PropertyMapViewProps {
  latitude: number;
  longitude: number;
  title: string;
}

// Marqueur maison, en accord avec l'identité ambre du site — évite aussi le
// souci classique des icônes par défaut de Leaflet cassées par le bundler.
const markerIcon = L.divIcon({
  className: "",
  html: `
    <div style="position:relative;width:34px;height:34px;">
      <svg width="34" height="34" viewBox="0 0 34 34" style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));">
        <path d="M17 2c-8 0-13 6-13 13 0 9.5 13 17 13 17s13-7.5 13-17c0-7-5-13-13-13z" fill="#f59e0b" stroke="#1c1917" stroke-width="1"/>
        <circle cx="17" cy="15" r="5.5" fill="#1c1917"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -30],
});

// Rendu uniquement côté client (chargé via next/dynamic ssr:false par
// PropertyLocation) : Leaflet accède à window/document au chargement.
export default function PropertyMapView({ latitude, longitude, title }: PropertyMapViewProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={14}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[latitude, longitude]}
        icon={markerIcon}
        alt={title}
        eventHandlers={{
          // L.divIcon ne pose pas d'aria-label automatiquement (contrairement
          // aux icônes image) : le marqueur reste focusable sans nom
          // accessible. "add" ne se déclenche qu'une fois l'élément réellement
          // dans le DOM, contrairement au ref callback qui peut être trop tôt.
          add: (event: LeafletEvent) => {
            event.target.getElement()?.setAttribute("aria-label", title);
          },
        }}
      >
        <Popup>{title}</Popup>
      </Marker>
    </MapContainer>
  );
}
