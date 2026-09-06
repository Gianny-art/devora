import { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Business } from '@/types';
import { getMarkerColor } from '@/lib/mock-data';
import 'leaflet/dist/leaflet.css';

interface BusinessMapProps {
  businesses: Business[];
  center: { lat: number; lng: number };
  onBusinessClick?: (business: Business) => void;
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useMemo(() => {
    map.setView([center.lat, center.lng], 14);
  }, [center, map]);
  return null;
}

export function BusinessMap({ businesses, center, onBusinessClick }: BusinessMapProps) {
  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ width: '100%', height: '100%', minHeight: 400 }}
        zoomControl={false}
      >
        <MapUpdater center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {businesses.map((biz) => (
          <CircleMarker
            key={biz.id}
            center={[biz.lat, biz.lng]}
            radius={8}
            pathOptions={{
              color: getMarkerColor(biz),
              fillColor: getMarkerColor(biz),
              fillOpacity: 0.7,
              weight: 2,
            }}
            eventHandlers={{
              click: () => onBusinessClick?.(biz),
            }}
          >
            <Popup>
              <div className="text-xs">
                <strong>{biz.name}</strong>
                <br />
                {biz.category}
                {!biz.hasWebsite && <><br /><strong>No Website!</strong></>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
