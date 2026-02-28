import { mockVessels } from './data/mockData';

function highlightNextStops() {
    const now = Date.now();
    const nextTimes = mockVessels.map(vessel => {
        const schedule = vessel.schedule;
        const nextStop = schedule?.find(s => new Date(s.arrivalTime).getTime() > now);
        if (nextStop) {
            const d = new Date(nextStop.arrivalTime);
            // The timetable strings correspond to the UTC hours/minutes we anchored
            const hh = String(d.getUTCHours()).padStart(2, '0');
            const mm = String(d.getUTCMinutes()).padStart(2, '0');
            return { timeStr: `${hh}:${mm}`, vessel };
        }
        return null;
    }).filter(Boolean);

    // Clear existing highlights
    document.querySelectorAll('td.highlight').forEach(el => {
        const td = el as HTMLElement;
        td.classList.remove('highlight');
        td.style.backgroundColor = '';
        td.style.color = '';
        td.style.fontWeight = '';
        td.title = '';
    });

    // Apply new highlights using yellow background
    const cells = document.querySelectorAll('td');
    cells.forEach(el => {
        const td = el as HTMLElement;
        const text = td.textContent?.trim();
        if (!text) return;

        nextTimes.forEach(info => {
            // For timetable, highlight specific matches
            if (info?.timeStr === text) {
                td.classList.add('highlight');
                // The user requested a yellow highlight background
                td.style.backgroundColor = '#fada5e'; // Brand yellow
                td.style.color = '#005b96'; // Brand blue text for contrast
                td.style.fontWeight = 'bold';
                td.title = `${info.vessel.name} Next Stop`;
            }
        });
    });
}

// Run immediately and set refresh interval (every 30 seconds)
highlightNextStops();
setInterval(highlightNextStops, 30000);
