import './style.css';
import { mockVessels, stops, Stop } from './data/mockData';

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}

document.addEventListener('DOMContentLoaded', () => {
    const loadingEl = document.getElementById('loading')!;
    const errorEl = document.getElementById('error')!;
    const resultEl = document.getElementById('result')!;
    const stopNameEl = document.getElementById('stop-name')!;
    const distanceEl = document.getElementById('stop-distance')!;
    const arrivalsEl = document.getElementById('arrivals')!;

    if (!('geolocation' in navigator)) {
        loadingEl.style.display = 'none';
        errorEl.textContent = 'Geolocation is not supported by your browser.';
        errorEl.style.display = 'block';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLat = position.coords.latitude;
            const userLon = position.coords.longitude;

            // Filter out mooring stops since passengers can't board there
            const validStops = stops.filter(s => !s.id.startsWith('mooring'));

            let closestStop: Stop | null = null;
            let closestDist = Infinity;

            for (const stop of validStops) {
                // Use landCoords if available, fallback to water coords
                const targetCoord = stop.landCoords || stop.coords;
                const dist = haversineDist(userLat, userLon, targetCoord.lat, targetCoord.lon);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestStop = stop;
                }
            }

            if (!closestStop) {
                loadingEl.style.display = 'none';
                errorEl.textContent = 'Could not find any nearby ferry stops.';
                errorEl.style.display = 'block';
                return;
            }

            const now = new Date().getTime();
            let arrivalsHtml = '';

            for (const vessel of mockVessels) {
                if (!vessel.schedule) continue;

                // Find next arrival for this stop
                const nextArrival = vessel.schedule.find(s =>
                    s.stopId === closestStop!.id && new Date(s.arrivalTime).getTime() >= now
                );

                let color = vessel.color || '#ccc';
                let textColor = '#000';
                if (vessel.name === 'Matilda') { color = '#fada5e'; textColor = '#005b96'; }
                else if (vessel.name === 'Brigantia') { color = '#005b96'; textColor = '#fada5e'; }

                if (nextArrival) {
                    const arrivalDate = new Date(nextArrival.arrivalTime);
                    const diffMins = Math.max(0, Math.ceil((arrivalDate.getTime() - now) / 60000));
                    const timeString = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    arrivalsHtml += `
                        <div class="arrival-card">
                            <div class="vessel-badge" style="background-color: ${color}; color: ${textColor};" aria-hidden="true">${vessel.textInitial}</div>
                            <div class="arrival-info">
                                <h3>${vessel.name}</h3>
                                <div class="arrival-time">Arriving in ${diffMins} min<br><small>(${timeString})</small></div>
                            </div>
                        </div>
                    `;
                } else {
                    arrivalsHtml += `
                        <div class="arrival-card">
                            <div class="vessel-badge" style="background-color: ${color}; color: ${textColor};" aria-hidden="true">${vessel.textInitial}</div>
                            <div class="arrival-info">
                                <h3>${vessel.name}</h3>
                                <div class="arrival-time">No more arrivals today</div>
                            </div>
                        </div>
                    `;
                }
            }

            // Update UI
            loadingEl.style.display = 'none';
            stopNameEl.textContent = closestStop.name;
            distanceEl.textContent = `Distance: ${closestDist} meters`;
            arrivalsEl.innerHTML = arrivalsHtml;
            resultEl.style.display = 'block';

        },
        (error) => {
            loadingEl.style.display = 'none';
            errorEl.style.display = 'block';
            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorEl.textContent = "Location access denied. Please enable it in your browser.";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorEl.textContent = "Location information is unavailable.";
                    break;
                case error.TIMEOUT:
                    errorEl.textContent = "The request to get user location timed out.";
                    break;
                default:
                    errorEl.textContent = "An unknown error occurred getting your location.";
                    break;
            }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
});
