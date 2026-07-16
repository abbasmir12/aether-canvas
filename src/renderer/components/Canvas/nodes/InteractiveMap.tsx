import { divIcon, type LatLngExpression, type LatLngTuple } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect } from 'react';

import type { DashboardAiInsight } from '../../../../shared/types';

export type DashboardLocation = { name: string; type: string; lat?: number; lng?: number; fileName: string };

const sourceIcon = divIcon({ className: '', html: '<span style="display:block;width:17px;height:17px;border-radius:50% 50% 50% 0;background:#EA6335;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25);transform:rotate(-45deg)"></span>', iconSize: [20, 20], iconAnchor: [10, 19] });
const aiIcon = divIcon({ className: '', html: '<span style="display:block;width:16px;height:16px;border-radius:50%;background:#9B72CF;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25)"></span>', iconSize: [18, 18], iconAnchor: [9, 9] });

function FitLocations({ points }: { points: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 12);
    if (points.length > 1) map.fitBounds(points.map((point) => [point.lat, point.lng] as LatLngTuple), { padding: [20, 20], maxZoom: 13 });
  }, [map, points]);
  return null;
}

export default function InteractiveMap({ locations, suggestions, expanded, onLocationFocus, onOpenDirections }: { locations: DashboardLocation[]; suggestions: DashboardAiInsight[]; expanded: boolean; onLocationFocus: (location: DashboardLocation) => void; onOpenDirections: (location: string) => void }) {
  const pins = locations.filter((location): location is DashboardLocation & { lat: number; lng: number } => typeof location.lat === 'number' && typeof location.lng === 'number');
  const aiPins = suggestions.filter((item): item is DashboardAiInsight & { lat: number; lng: number } => typeof item.lat === 'number' && typeof item.lng === 'number');
  const allPoints = [...pins, ...aiPins];
  const center: LatLngExpression = allPoints.length ? [allPoints[0].lat, allPoints[0].lng] : [20, 0];
  return <div className={`nodrag nowheel relative overflow-hidden rounded-[8px] border border-[#E5E2D9] ${expanded ? 'h-[260px]' : 'h-[104px]'}`}><MapContainer center={center} className="h-full w-full" doubleClickZoom={expanded} scrollWheelZoom={expanded} zoom={allPoints.length ? 11 : 2} zoomControl={expanded}><TileLayer attribution="© OpenStreetMap contributors © CARTO" url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" /><FitLocations points={allPoints} />{pins.map((location) => <Marker eventHandlers={{ click: () => onLocationFocus(location) }} icon={sourceIcon} key={`${location.name}-${location.fileName}`} position={[location.lat, location.lng]}><Popup><div className="min-w-[150px] text-[12px]"><b>{location.name}</b><p className="mt-1 text-[#777]">From {location.fileName}</p><button className="mt-2 text-[#4A90D9]" onClick={() => onOpenDirections(location.name)} type="button">Get directions</button></div></Popup></Marker>)}{aiPins.map((item) => <Marker icon={aiIcon} key={`ai-${item.title}`} position={[item.lat, item.lng]}><Popup><div className="min-w-[150px] text-[12px]"><b>AI suggested · {item.title}</b><p className="mt-1 text-[#777]">{item.body}</p><button className="mt-2 text-[#4A90D9]" onClick={() => onOpenDirections(item.title)} type="button">Get directions</button></div></Popup></Marker>)}</MapContainer>{!allPoints.length && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#F4F1E9]/70 text-center text-[10px] text-[#77777D]">Location coordinates will appear when Aether can confidently identify them.</div>}</div>;
}
