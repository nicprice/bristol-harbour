import * as L from 'leaflet';
import { Vessel, Route, Stop, stops, mockVessels, generateDynamicSchedule } from '../data/mockData';
import { TrackerEngine } from '../core/TrackerEngine';

export class MapManager {
    private map: L.Map;
    private vesselMarkers: Map<string, L.Marker> = new Map();
    private trackerEngine?: TrackerEngine;

    constructor(containerId: string, trackerEngine?: TrackerEngine) {
        this.trackerEngine = trackerEngine; // Will be used for simulation & next arrival logic
        console.log('MapManager initialized with trackerEngine:', !!this.trackerEngine);
        this.map = L.map(containerId, {
            zoomControl: false // Custom controls can be added if needed
        }).setView([51.4500, -2.6000], 15); // Center on Bristol Harbour

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);
    }

    public drawRoute(route: Route): void {
        const latLngs = route.path.map(c => [c.lat, c.lon] as [number, number]);
        L.polyline(latLngs, { color: '#1d70b8', weight: 4 }).addTo(this.map);
    }

    public drawStops(stops: Stop[]): void {
        stops.forEach(stop => {
            const coords = stop.landCoords ? stop.landCoords : stop.coords;
            const marker = L.circleMarker([coords.lat, coords.lon], {
                radius: 6,
                fillColor: '#ffffff',
                color: '#0b0c0c',
                weight: 2,
                opacity: 1,
                fillOpacity: 1
            }).addTo(this.map);

            const popupContent = `
                <div style="margin-bottom: 10px;"><strong>${stop.name}</strong></div>
                ${this.calculateNextArrivals(stop.id)}
            `;
            marker.bindPopup(popupContent);

            marker.on('popupopen', () => {
                const nextTime = this.getNextArrivalTime(stop.id);
                const label = nextTime ? `${stop.name} (Next: ${nextTime})` : stop.name;
                marker.setTooltipContent(label);
                marker.setStyle({ weight: 4 });
            });

            marker.on('popupclose', () => {
                marker.setTooltipContent(stop.name);
                marker.setStyle({ weight: 2 });
            });

            const bindTooltipClick = () => {
                const tooltip = marker.getTooltip();
                if (tooltip) {
                    const tooltipElement = tooltip.getElement();
                    if (tooltipElement) {
                        tooltipElement.style.cursor = 'pointer';
                        L.DomEvent.on(tooltipElement, 'click', (e) => {
                            L.DomEvent.stopPropagation(e);
                            marker.openPopup();
                        });
                    }
                }
            };

            // Listen for tooltipopen (will fire for both permanent and on-demand tooltips)
            marker.on('tooltipopen', bindTooltipClick);

            // Add tooltip & accessibility tags
            marker.bindTooltip(stop.name, {
                permanent: true,
                direction: 'top',
                className: 'stop-label',
                offset: [0, -10]
            });

            // Initial manual bind for permanent tooltips which might already be open
            bindTooltipClick();

            // WCAG Non-Text Content & Interaction
            const pathPath = marker.getElement();
            if (pathPath) {
                pathPath.setAttribute('role', 'button');
                pathPath.setAttribute('aria-label', `Stop: ${stop.name}. Click for details.`);
                pathPath.setAttribute('tabindex', '0');

                // Keyboard interaction
                pathPath.addEventListener('keydown', (e: Event) => {
                    const keyboardEvent = e as KeyboardEvent;
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                        marker.openPopup();
                    }
                });
            }
        });
    }

    private getNextArrivalTime(stopId: string): string | null {
        const now = this.trackerEngine ? this.trackerEngine.getCurrentTime() : new Date();
        const nowMs = now.getTime();
        let earliestArrivalMs = Infinity;
        let timeStr: string | null = null;

        mockVessels.forEach(vessel => {
            if (!vessel.schedule) return;
            // Find next today
            let next = vessel.schedule.find(s => s.stopId === stopId && new Date(s.arrivalTime).getTime() > nowMs);

            if (!next) {
                // Try tomorrow
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                let tomorrowSched;
                if (vessel.name === 'Matilda') {
                    tomorrowSched = generateDynamicSchedule(0, 11, 20, 15, 37, 'mooring-1', tomorrow);
                } else {
                    tomorrowSched = generateDynamicSchedule(-40, 11, 20, 15, 35, 'mooring-2', tomorrow);
                }
                next = tomorrowSched.find(s => s.stopId === stopId && new Date(s.arrivalTime).getTime() > new Date(tomorrow).setUTCHours(0, 0, 0, 0));
            }

            if (next) {
                const arrivalMs = new Date(next.arrivalTime).getTime();
                if (arrivalMs < earliestArrivalMs) {
                    earliestArrivalMs = arrivalMs;
                    timeStr = new Date(next.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                }
            }
        });

        return timeStr;
    }

    private getVesselPopupContent(vessel: Vessel, currentTime: Date): string {
        let content = `<div style="text-align: center; font-size: 14px; min-width: 140px;">`;
        content += `<strong>${vessel.name}</strong><br/>`;

        if (vessel.nextStopId && vessel.nextArrivalTime) {
            const nextStopName = stops.find(s => s.id === vessel.nextStopId)?.name || 'Unknown';
            const arrivalDate = new Date(vessel.nextArrivalTime);
            const diffMs = arrivalDate.getTime() - currentTime.getTime();
            const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
            content += `<hr style="margin: 5px 0; border: 0; border-top: 1px solid #ccc;" />`;
            content += `Next stop: <strong>${nextStopName}</strong><br/>`;
            content += `Arriving in: <strong>${diffMins} min${diffMins !== 1 ? 's' : ''}</strong>`;
        } else {
            content += `<br/>${vessel.status || 'Unknown'}`;
        }

        content += `</div>`;
        return content;
    }

    private calculateNextArrivals(stopId: string): string {
        const now = this.trackerEngine ? this.trackerEngine.getCurrentTime() : new Date();
        const nowMs = now.getTime();

        interface ArrivalInfo {
            time: string;
            boat: string;
            direction: string;
            isTomorrow: boolean;
        }

        const findNext = (schedule: any[], boatName: string): ArrivalInfo | null => {
            const next = schedule.find(s => s.stopId === stopId && new Date(s.arrivalTime).getTime() > nowMs);
            if (!next) return null;

            const arrDate = new Date(next.arrivalTime);
            const timeStr = arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

            // Determine direction based on future schedule sequence
            const arrivalIndex = schedule.indexOf(next);
            let direction = 'Towards Mooring';
            // Start from i = arrivalIndex + 1 to find where it's going AFTER this stop
            for (let i = arrivalIndex + 1; i < schedule.length; i++) {
                if (schedule[i].stopId === 'hotwells') { direction = 'Towards Hotwells'; break; }
                if (schedule[i].stopId === 'temple-meads') { direction = 'Towards Temple Meads'; break; }
            }

            return {
                time: timeStr,
                boat: boatName,
                direction,
                isTomorrow: false
            };
        };

        let arrivals: ArrivalInfo[] = [];

        mockVessels.forEach(vessel => {
            if (!vessel.schedule) return;
            let info = findNext(vessel.schedule, vessel.name);

            if (!info) {
                // Try tomorrow
                const tomorrow = new Date(now);
                tomorrow.setDate(tomorrow.getDate() + 1);
                let tomorrowSched;
                if (vessel.name === 'Matilda') {
                    tomorrowSched = generateDynamicSchedule(0, 11, 20, 15, 37, 'mooring-1', tomorrow);
                } else {
                    tomorrowSched = generateDynamicSchedule(-40, 11, 20, 15, 35, 'mooring-2', tomorrow);
                }
                const tomorrowInfo = findNext(tomorrowSched, vessel.name);
                if (tomorrowInfo) {
                    tomorrowInfo.isTomorrow = true;
                    arrivals.push(tomorrowInfo);
                }
            } else {
                arrivals.push(info);
            }
        });

        // Group by direction
        const directions = ['Towards Temple Meads', 'Towards Hotwells'];
        let html = '<div style="min-width: 160px; font-family: Arial, sans-serif;">';

        directions.forEach(dir => {
            // Filter: If out of hours at terminal stops, only show the other end
            if (stopId === 'temple-meads' && dir === 'Towards Temple Meads') return;
            if (stopId === 'hotwells' && dir === 'Towards Hotwells') return;

            const best = arrivals
                .filter(a => a.direction === dir)
                .sort((a, b) => {
                    if (a.isTomorrow !== b.isTomorrow) return a.isTomorrow ? 1 : -1;
                    return a.time.localeCompare(b.time);
                })[0];

            // If it's a terminal stop and we are in off-hours (next is tomorrow), 
            // the above returns will already have filtered the redundant direction.
            // But we also want to ensure we don't show "No service" for the redundant direction.
            if (!best && (stopId === 'temple-meads' || stopId === 'hotwells')) {
                // Check if this direction is the one we want to hide
                if (stopId === 'temple-meads' && dir === 'Towards Temple Meads') return;
                if (stopId === 'hotwells' && dir === 'Towards Hotwells') return;
            }

            html += `<div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 4px;">`;
            html += `<span style="font-size: 0.75rem; color: #666; text-transform: uppercase;">${dir}</span><br/>`;
            if (best) {
                html += `<strong>${best.time}</strong> <span style="font-size: 0.85rem;">(${best.boat})</span>`;
                if (best.isTomorrow) html += ` <span style="color: #d4351c; font-size: 0.7rem; font-weight: bold;">TOMORROW</span>`;
            } else {
                html += `<span style="color: #999; font-size: 0.85rem;">No service</span>`;
            }
            html += `</div>`;
        });

        html += '</div>';
        return html;
    }

    public updateVessels(vessels: Vessel[]): void {
        const currentTime = this.trackerEngine ? this.trackerEngine.getCurrentTime() : new Date();

        vessels.forEach(vessel => {
            if (!vessel.currentCoords) return;

            const existingMarker = this.vesselMarkers.get(vessel.id);
            const popupContent = this.getVesselPopupContent(vessel, currentTime);

            if (existingMarker) {
                // Update position smoothly
                existingMarker.setLatLng([vessel.currentCoords.lat, vessel.currentCoords.lon]);

                // Update Popup
                const popup = existingMarker.getPopup();
                if (popup && popup.isOpen()) {
                    popup.setContent(popupContent);
                } else {
                    existingMarker.bindPopup(popupContent, { closeButton: false, offset: [0, -10] });
                }
            } else {
                // Create new marker
                const iconHtml = vessel.avatarUrl
                    ? `
                        <div class="vessel-marker image-marker" style="background-color: transparent; border: none; box-shadow: none; overflow: visible; width: 48px; height: 48px;" aria-label="Ferry ${vessel.name}">
                            <img src="${vessel.avatarUrl}" alt="Ferry ${vessel.name}" style="width: 100%; height: 100%; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3)); border-radius: 50%;" />
                        </div>
                    `
                    : `
                        <div class="vessel-marker" style="background-color: ${vessel.color || '#ccc'}; color: #000;" aria-label="Ferry ${vessel.name}">
                            ${vessel.textInitial}
                        </div>
                    `;

                const customIcon = L.divIcon({
                    html: iconHtml,
                    className: '', // disable default leaflet styles
                    iconSize: vessel.avatarUrl ? [48, 48] : [32, 32],
                    iconAnchor: vessel.avatarUrl ? [24, 24] : [16, 16] // Center the marker over the coordinate
                });

                const newMarker = L.marker([vessel.currentCoords.lat, vessel.currentCoords.lon], {
                    icon: customIcon,
                    alt: `Vessel ${vessel.name}`,
                    zIndexOffset: 1000
                }).addTo(this.map);

                newMarker.bindPopup(popupContent, { closeButton: false, offset: [0, -10] });

                // Accessible role
                const iconElem = newMarker.getElement();
                if (iconElem) {
                    iconElem.setAttribute('role', 'button');
                    iconElem.setAttribute('tabindex', '0');
                }

                this.vesselMarkers.set(vessel.id, newMarker);
            }
        });
    }

    public focusVessel(vesselId: string): void {
        const marker = this.vesselMarkers.get(vesselId);
        if (marker) {
            this.map.setView(marker.getLatLng(), 16);
            marker.openPopup();
        }
    }
}
