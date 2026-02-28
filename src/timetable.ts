import './style.css';
import { mockVessels, stops, StopTime } from './data/mockData';

function renderBoatTimetable(vesselId: string, containerId: string) {
    const vessel = mockVessels.find(v => v.id === vesselId);
    const container = document.querySelector(`#${containerId} .table-wrapper`);
    if (!vessel || !container || !vessel.schedule) return;

    // We want a row for each stop, and columns for each "trip"
    // For this mock tracker, trips roughly start at Temple Meads or Hotwells
    // Let's identify the unique stops in order for the rows
    const uniqueStopIds = [
        'temple-meads', 'castle-park', 'city-centre', 'wapping-wharf', 'ss-great-britain', 'mardyke', 'hotwells'
    ];

    // Group schedule into columns. 
    // Each "trip" in our dynamic schedule starts a new column when it hits an anchor stop or restarts.
    // For simplicity, we'll split based on the loop sequence in generateDynamicSchedule.
    const columns: StopTime[][] = [];
    let currentColumn: StopTime[] = [];

    vessel.schedule.forEach((item) => {
        // Simple heuristic: new column if we hit Temple Meads again or start of day
        if ((item.stopId === 'temple-meads') && currentColumn.length > 0) {
            columns.push(currentColumn);
            currentColumn = [];
        }
        currentColumn.push(item);
    });
    if (currentColumn.length > 0) columns.push(currentColumn);

    let html = `<table><thead><tr><th>Location</th>`;
    columns.forEach((_, i) => html += `<th scope="col">Trip ${i + 1}</th>`);
    html += `</tr></thead><tbody>`;

    uniqueStopIds.forEach(stopId => {
        const stopName = stops.find(s => s.id === stopId)?.name || stopId;
        html += `<tr><th scope="row">${stopName}</th>`;

        columns.forEach(col => {
            const timeEntry = col.find(s => s.stopId === stopId);
            if (timeEntry) {
                const date = new Date(timeEntry.arrivalTime);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                html += `<td data-time-ms="${date.getTime()}">${timeStr}</td>`;
            } else {
                html += `<td>-</td>`;
            }
        });
        html += `</tr>`;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
}

function updateHighlighting() {
    const now = Date.now();

    // Clear existing
    document.querySelectorAll('.next-stop-highlight').forEach(el => {
        el.classList.remove('next-stop-highlight');
    });

    mockVessels.forEach(vessel => {
        if (!vessel.schedule) return;

        // Find the next upcoming arrival
        let nextArrival = vessel.schedule.find(s => new Date(s.arrivalTime).getTime() >= now);

        // If between days or finished today, highlight the very first stop (usually first of tomorrow)
        if (!nextArrival) {
            nextArrival = vessel.schedule[0];
        }

        if (nextArrival) {
            const arrivalMs = new Date(nextArrival.arrivalTime).getTime();
            // Find the cell in this boat's table that matches this timestamp
            const containerId = vessel.name === 'Matilda' ? 'matilda-timetable' : 'brigantia-timetable';
            const cell = document.querySelector(`#${containerId} td[data-time-ms="${arrivalMs}"]`);
            if (cell) {
                cell.classList.add('next-stop-highlight');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderBoatTimetable('ferry-1', 'matilda-timetable');
    renderBoatTimetable('ferry-2', 'brigantia-timetable');
    updateHighlighting();
    setInterval(updateHighlighting, 30000);
});
