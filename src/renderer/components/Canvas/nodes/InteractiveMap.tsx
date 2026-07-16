import { divIcon, type LatLngExpression, type LatLngTuple, type Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { Compass, MapPin, Navigation, Sparkles } from 'lucide-react';

import type { DashboardAiInsight } from '../../../../shared/types';

export type DashboardLocation = { name: string; type: string; lat?: number; lng?: number; fileName: string };

function markerIcon(index: number, ai = false) {
  const label = ai ? 'AI' : String(index + 1);
  return divIcon({
    className: 'aether-map-marker-shell',
    html: `<span class="aether-map-marker ${ai ? 'aether-map-marker--ai' : 'aether-map-marker--source'}"><i></i><b><em>${label}</em></b></span>`,
    iconSize: ai ? [30, 30] : [34, 34],
    iconAnchor: ai ? [15, 15] : [17, 28],
    popupAnchor: [0, ai ? -15 : -26],
  });
}

function FitLocations({ points }: { points: Array<{ lat: number; lng: number }> }) {
  const map = useMap();
  const fittedSignature = useRef('');
  const signature = points
    .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
    .sort()
    .join('|');
  useEffect(() => {
    if (!signature || fittedSignature.current === signature) return;
    fittedSignature.current = signature;
    if (points.length === 1) map.flyTo([points[0].lat, points[0].lng], 12, { duration: .8 });
    if (points.length > 1) map.fitBounds(points.map((point) => [point.lat, point.lng] as LatLngTuple), { padding: [38, 38], maxZoom: 13, animate: true, duration: .8 });
  }, [map, points, signature]);
  return null;
}

export default function InteractiveMap({ locations, suggestions, expanded, onLocationFocus, onOpenDirections }: { locations: DashboardLocation[]; suggestions: DashboardAiInsight[]; expanded: boolean; onLocationFocus: (location: DashboardLocation) => void; onOpenDirections: (location: string) => void }) {
  const mapRef = useRef<LeafletMap | null>(null);
  const pins = useMemo(() => locations.filter((location): location is DashboardLocation & { lat: number; lng: number } => typeof location.lat === 'number' && typeof location.lng === 'number'), [locations]);
  const aiPins = useMemo(() => suggestions.filter((item): item is DashboardAiInsight & { lat: number; lng: number } => typeof item.lat === 'number' && typeof item.lng === 'number'), [suggestions]);
  const allPoints = useMemo(() => [...pins, ...aiPins], [aiPins, pins]);
  const center: LatLngExpression = allPoints.length ? [allPoints[0].lat, allPoints[0].lng] : [20, 0];
  const focusPoint = (point: { lat: number; lng: number }) => mapRef.current?.flyTo([point.lat, point.lng], 14, { duration: .65 });

  return <div className={`aether-map nodrag nowheel relative overflow-hidden rounded-[15px] border border-[#D8D4CC] bg-[#ECE9E1] shadow-[inset_0_1px_0_rgba(255,255,255,.9),0_8px_22px_rgba(55,45,35,.10)] transition-[height] duration-300 ${expanded ? 'h-[300px]' : 'h-[116px]'}`}>
    <MapContainer center={center} className="h-full w-full saturate-[.82] contrast-[.96] sepia-[.04]" doubleClickZoom={expanded} ref={mapRef} scrollWheelZoom={expanded} zoom={allPoints.length ? 11 : 2} zoomControl={expanded}>
      <TileLayer attribution="© OpenStreetMap contributors © CARTO" url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <FitLocations points={allPoints} />
      {pins.map((location, index) => <Marker eventHandlers={{ mouseover: (event) => event.target.openPopup(), click: () => { focusPoint(location); onLocationFocus(location); } }} icon={markerIcon(index)} key={`${location.name}-${location.fileName}`} position={[location.lat, location.lng]}><Popup autoPan={false} closeButton={false}><div className="aether-map-popup"><div className="flex items-center justify-between"><span className="rounded-full bg-[#FFF0EC] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.1em] text-[#C94B38]">Source · {String(index + 1).padStart(2, '0')}</span><Navigation size={12} className="text-[#EA4335]" /></div><b className="mt-2 block text-[13px] font-semibold tracking-[-.02em] text-[#302E33]">{location.name}</b><p className="mt-1 truncate text-[9px] text-[#858188]">Found in {location.fileName}</p><button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#2F2D32] px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-[#444047]" onClick={() => onOpenDirections(location.name)} type="button"><Navigation size={11} />Get directions</button></div></Popup></Marker>)}
      {aiPins.map((item, index) => <Marker eventHandlers={{ mouseover: (event) => event.target.openPopup(), click: () => focusPoint(item) }} icon={markerIcon(index, true)} key={`ai-${item.title}`} position={[item.lat, item.lng]}><Popup autoPan={false} closeButton={false}><div className="aether-map-popup"><div className="flex items-center justify-between"><span className="rounded-full bg-[#F2ECF8] px-2 py-1 text-[8px] font-semibold uppercase tracking-[.1em] text-[#805DA7]">AI discovery</span><Sparkles size={12} className="text-[#9B72CF]" /></div><b className="mt-2 block text-[13px] font-semibold tracking-[-.02em] text-[#302E33]">{item.title}</b><p className="mt-1 text-[9px] leading-4 text-[#77737B]">{item.body}</p><button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-[8px] bg-[#8060A5] px-2.5 py-2 text-[9px] font-semibold text-white transition hover:bg-[#6F5194]" onClick={() => onOpenDirections(item.title)} type="button"><Navigation size={11} />Explore nearby</button></div></Popup></Marker>)}
    </MapContainer>

    <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-white/72 via-white/24 to-transparent px-2.5 pb-7 pt-2.5">
      <div className="flex items-center gap-2 rounded-[10px] border border-white/90 bg-white/82 px-2.5 py-2 shadow-[0_4px_12px_rgba(45,42,38,.10)] backdrop-blur-md"><span className="grid h-6 w-6 place-items-center rounded-[8px] bg-[#EA4335] text-white shadow-[0_3px_8px_rgba(234,67,53,.22)]"><Compass size={13} /></span><span><b className="block text-[9px] font-semibold tracking-[-.01em] text-[#39363C]">Aether Atlas</b><small className="mt-0.5 block text-[7px] font-medium uppercase tracking-[.1em] text-[#969097]">{pins.length} source {pins.length === 1 ? 'place' : 'places'}</small></span></div>
      {expanded && <div className="flex items-center gap-2 rounded-full border border-white/90 bg-white/82 px-2.5 py-1.5 text-[7px] font-semibold text-[#747078] shadow-[0_3px_9px_rgba(45,42,38,.08)] backdrop-blur-md"><span className="h-2 w-2 rounded-full bg-[#EA4335]" />Source{aiPins.length > 0 && <><span className="ml-1 h-2 w-2 rounded-full bg-[#9B72CF]" />AI find</>}</div>}
    </div>

    {expanded && pins.length > 1 && <div className="absolute bottom-7 left-2.5 right-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">{pins.map((location, index) => <button className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/90 bg-white/88 px-2.5 py-1.5 text-[8px] font-semibold text-[#625E65] shadow-[0_3px_9px_rgba(45,42,38,.10)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white" key={`${location.name}-chip`} onClick={() => focusPoint(location)} type="button"><span className="grid h-4 w-4 place-items-center rounded-full bg-[#EA4335] text-[7px] text-white">{index + 1}</span>{location.name}</button>)}</div>}
    <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[15px] shadow-[inset_0_0_32px_rgba(71,60,46,.08)]" />
    {!allPoints.length && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#F4F1E9]/82 px-7 text-center backdrop-blur-[2px]"><div><span className="mx-auto grid h-9 w-9 place-items-center rounded-[11px] border border-white bg-white/90 text-[#EA4335] shadow-[0_5px_15px_rgba(55,45,35,.09)]"><MapPin size={16} /></span><p className="mt-2 text-[9px] font-medium leading-4 text-[#77777D]">Location coordinates appear when Aether can identify them confidently.</p></div></div>}
  </div>;
}
