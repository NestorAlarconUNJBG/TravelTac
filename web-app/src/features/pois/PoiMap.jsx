import React, { useEffect } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TACNA_CENTER = [-18.0066, -70.2463];

const markerIcon = L.divIcon({
  className: 'poi-map-marker',
  html: '<span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const MapClickHandler = ({ onPositionChange }) => {
  useMapEvents({
    click(event) {
      onPositionChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
};

const MapPosition = ({ position }) => {
  const map = useMap();

  useEffect(() => {
    if (position) map.setView(position, Math.max(map.getZoom(), 15));
  }, [map, position]);

  return null;
};

export const PoiMap = ({
  latitude,
  longitude,
  radius,
  onPositionChange,
}) => {
  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);
  const position = hasPosition ? [latitude, longitude] : null;

  return (
    <div className="poi-map-wrap">
      <MapContainer
        center={position || TACNA_CENTER}
        zoom={position ? 15 : 12}
        scrollWheelZoom
        className="poi-map"
        aria-label="Mapa para asignar la ubicación del punto de interés"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPositionChange={onPositionChange} />
        {position && (
          <>
            <MapPosition position={position} />
            <Circle
              center={position}
              radius={Number.isFinite(radius) ? radius : 50}
              pathOptions={{
                color: '#a94f32',
                fillColor: '#c18a35',
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
            <Marker
              position={position}
              icon={markerIcon}
              draggable
              eventHandlers={{
                dragend(event) {
                  const markerPosition = event.target.getLatLng();
                  onPositionChange(markerPosition.lat, markerPosition.lng);
                },
              }}
            />
          </>
        )}
      </MapContainer>
      <p className="poi-map-hint">
        {position
          ? 'Haz clic en el mapa o arrastra el marcador para ajustar la ubicación.'
          : 'Haz clic en el mapa para asignar una ubicación inicial.'}
      </p>
    </div>
  );
};
