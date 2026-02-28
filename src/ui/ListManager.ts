import { Vessel, stops } from '../data/mockData';

export class ListManager {
    private container: HTMLElement;

    constructor(containerId: string) {
        const el = document.getElementById(containerId);
        if (!el) throw new Error(`Container #${containerId} not found`);
        this.container = el;
    }

    public update(vessels: Vessel[]): void {
        this.container.innerHTML = '';

        vessels.forEach(vessel => {
            const card = document.createElement('div');
            card.className = 'status-card';
            // aria-live here can be annoying if updated every second,
            // but the spec asks for aria-live polite for status messages.
            // A better strategy is to only update the inner text when status physically changes,
            // or put aria-live on a separate visually hidden element.
            // For simplicity mapping direct to spec here:

            let color = vessel.color || '#ccc';
            let textColor = '#000'; // fallback dark text

            if (vessel.name === 'Matilda') {
                color = '#fada5e';
                textColor = '#005b96';
            } else if (vessel.name === 'Brigantia') {
                color = '#005b96';
                textColor = '#fada5e';
            }

            let statusText = vessel.status || 'Unknown';
            if (vessel.status === 'Estimated' || vessel.status === 'Scheduled') {
                statusText = `${vessel.status} (timetable based)`;
            }

            // Compute next stop and ETA if available
            let nextInfo = '';
            if (vessel.nextStopId && vessel.nextArrivalTime) {
                const nextStopName = stops.find(s => s.id === vessel.nextStopId)?.name || 'Unknown';
                const arrivalDate = new Date(vessel.nextArrivalTime);
                const diffMs = arrivalDate.getTime() - new Date().getTime();
                const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
                nextInfo = `<div class="next-info"><strong>Next:</strong> ${nextStopName} &middot; ${diffMins} min${diffMins !== 1 ? 's' : ''}</div>`;
            }

            card.innerHTML = `
                <header>
                    <div class="vessel-badge" style="background-color: ${color}; color: ${textColor};" aria-hidden="true">
                        ${vessel.textInitial}
                    </div>
                    <h3>${vessel.name}</h3>
                </header>
                <div class="status-details">
                    Status: <span aria-live="polite">${statusText}</span>
                </div>
                ${nextInfo}
            `;

            this.container.appendChild(card);
        });
    }
}
