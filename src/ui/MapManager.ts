import * as L from 'leaflet';
import { Vessel, Route, Stop, stops } from '../data/mockData';
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

            // Add tooltip & accessibility tags
            // Use permanent tooltips for visible labels
            marker.bindTooltip(stop.name, {
                permanent: true,
                direction: 'top',
                className: 'stop-label',
                offset: [0, -10]
            });

            // Interaction logic: on click, show "time, direction, next stop"
            // For a static mock, we'll demonstrate the concept.
            marker.on('click', () => {
                const nextArrival = this.calculateNextArrival(stop.id);
                marker.bindPopup(`
                    <strong>${stop.name}</strong><br/>
                    Next ferry: ${nextArrival.time}<br/>
                    Direction: ${nextArrival.direction}<br/>
                    Next stop: ${nextArrival.nextStop}
                `).openPopup();
            });

            // WCAG Non-Text Content
            const pathPath = marker.getElement();
            if (pathPath) {
                pathPath.setAttribute('role', 'button');
                pathPath.setAttribute('aria-label', `Stop: ${stop.name}. Click for details.`);
                pathPath.setAttribute('tabindex', '0');

                // Keyboard interaction
                pathPath.addEventListener('keydown', (e: Event) => {
                    const keyboardEvent = e as KeyboardEvent;
                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                        marker.fire('click');
                    }
                });
            }
        });
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

    private calculateNextArrival(stopId: string): { time: string, direction: string, nextStop: string } {
        // Look up the next vessel arriving from the mock vessels schedule based on current time.
        // For simplicity and to demonstrate the UI requirement immediately:
        // Assume the default 'next' mock data derived from global state.
        // A robust solution would pass the `vessels` down or query the TrackerEngine.
        return {
            time: 'Coming Up',
            direction: stopId === 'temple-meads' ? 'Towards Hotwells' : 'Towards City Centre',
            nextStop: 'Unknown'
        };
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
                // Update tooltip
                existingMarker.setTooltipContent(`${vessel.name} - ${vessel.status || 'Unknown'}`);

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
                    title: vessel.name,
                    zIndexOffset: 1000
                }).addTo(this.map);

                newMarker.bindPopup(popupContent, { closeButton: false, offset: [0, -10] });
                newMarker.bindTooltip(`${vessel.name} - ${vessel.status || 'Unknown'}`);

                // Accessible role
                const iconElem = newMarker.getElement();
                if (iconElem) {
                    iconElem.setAttribute('role', 'button');
                    iconElem.setAttribute('tabindex', '0');
                }

                this.vesselMarkers.set(vessel.id, newMarker);
            }
        });

        // Optional: Handle vessel removal if missing from array
        // In a real system, you'd find markers not in 'vessels' and remove them.
    }
}
