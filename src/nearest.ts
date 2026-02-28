import './style.css';
import { mockVessels, stops, Stop, generateDynamicSchedule } from './data/mockData';

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

                // Find next arrival for this stop today
                let nextArrival = vessel.schedule.find(s =>
                    s.stopId === closestStop!.id && new Date(s.arrivalTime).getTime() >= now
                );

                let isTomorrow = false;
                if (!nextArrival) {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    let tomorrowSchedule;
                    if (vessel.name === 'Matilda') {
                        tomorrowSchedule = generateDynamicSchedule(0, 11, 20, 15, 37, 'mooring-1', tomorrow);
                    } else if (vessel.name === 'Brigantia') {
                        tomorrowSchedule = generateDynamicSchedule(-40, 11, 20, 15, 35, 'mooring-2', tomorrow);
                    }
                    if (tomorrowSchedule) {
                        nextArrival = tomorrowSchedule.find(s => s.stopId === closestStop!.id);
                        isTomorrow = !!nextArrival;
                    }
                }

                let color = vessel.color || '#ccc';
                let textColor = '#000';
                if (vessel.name === 'Matilda') { color = '#fada5e'; textColor = '#005b96'; }
                else if (vessel.name === 'Brigantia') { color = '#005b96'; textColor = '#fada5e'; }

                let direction = '';
                if (nextArrival) {
                    const arrivalIndex = vessel.schedule.indexOf(nextArrival);
                    let destStopId = '';
                    for (let i = arrivalIndex; i < vessel.schedule.length; i++) {
                        if (vessel.schedule[i].stopId === 'hotwells') {
                            destStopId = 'hotwells';
                            break;
                        }
                        if (vessel.schedule[i].stopId === 'temple-meads') {
                            destStopId = 'temple-meads';
                            break;
                        }
                    }
                    if (destStopId === 'hotwells') {
                        direction = 'Towards Hotwells';
                    } else if (destStopId === 'temple-meads') {
                        direction = 'Towards Temple Meads';
                    } else {
                        direction = 'Towards Mooring';
                    }

                    const arrivalDate = new Date(nextArrival.arrivalTime);
                    const diffMins = Math.max(0, Math.ceil((arrivalDate.getTime() - now) / 60000));
                    const timeString = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    let displayTime = '';
                    if (isTomorrow) {
                        displayTime = `Tomorrow at ${timeString}`;
                    } else if (diffMins > 60) {
                        displayTime = `Today at ${timeString}`;
                    } else {
                        displayTime = `Arriving in ${diffMins} min<br><small>(${timeString})</small>`;
                    }

                    arrivalsHtml += `
                        <div class="arrival-card">
                            <div class="vessel-badge" style="background-color: ${color}; color: ${textColor};" aria-hidden="true">${vessel.textInitial}</div>
                            <div class="arrival-info">
                                <h3>${vessel.name} <small style="font-weight: normal; font-size: 0.9em; color: #555;">(${direction})</small></h3>
                                <div class="arrival-time">${displayTime}</div>
                            </div>
                        </div>
                    `;
                } else {
                    arrivalsHtml += `
                        <div class="arrival-card">
                            <div class="vessel-badge" style="background-color: ${color}; color: ${textColor};" aria-hidden="true">${vessel.textInitial}</div>
                            <div class="arrival-info">
                                <h3>${vessel.name}</h3>
                                <div class="arrival-time">No active schedule</div>
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
            console.error('Geolocation error:', error);
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
                    errorEl.textContent = "The request to get user location timed out. Try refreshing or check your signal.";
                    break;
                default:
                    errorEl.textContent = "An unknown error occurred getting your location.";
                    break;
            }
        },
        { enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }
    );
});
