# Bristol Harbour Ferry Tracker – Antigravity Specification

## 1. Overview
**App Name:** Bristol Harbour Ferry Tracker  
**Primary Goal:** A WCAG 2.2 compliant digital service to visualize ferry locations on Bristol Harbour.
**Initial Scope:** Bristol Ferries timetable data (interpolated).
**Future Proofing:** Architecture must support real-time GPS feeds for other vessels (e.g., Harbour Master).
**Target Devices:** Mobile phones, standard desktops, and large information screens (M Shed / Watershed).

---

## 2. Adherence to UK Government Design Principles
1. **Start with user needs:** Prioritize "Where is my boat?" and "When is the next arrival?"
2. **Do the hard work to make it simple:** Abstract the complexity of timetable interpolation so the user sees a smooth, intuitive interface.
3. **This is for everyone:** Accessibility is the foundation. The app must be usable by everyone, regardless of ability or device.
4. **Understand context:** Design for high-glare outdoor environments (quaysides) and large-format indoor reception screens.
5. **Be consistent, not uniform:** Use familiar transport iconography and map patterns.

---

## 3. Hybrid Data Architecture (Source Agnostic)

The application must treat "Vessels" as a unified class, regardless of how their position is derived:

### 3.1 Source A: Timetable-Based (Initial: Bristol Ferries)
- **Logic:** Uses `current_time` + `StopTimes` to interpolate position between two stops.
- **Status:** Labeled as "Scheduled" or "Estimated" in the UI.

### 3.2 Source B: GPS-Based (Future: Harbour Master / Others)
- **Logic:** Accepts live Lat/Lon coordinates via API/WebSocket.
- **Status:** Labeled as "Live" or "Actual Position" in the UI.
- **Vessel Types:** Support distinct icons for Passenger Ferries vs. Workboats (Harbour Master).

---

## 4. Multi-Surface Responsive Design

The UI must adapt to the screen size while remaining interactive on all devices:

- **Mobile (Small):** Map-centric with a "Bottom Sheet" for details. Large tap targets (min 24x24px).
- **Desktop (Medium):** Split-screen view with a persistent sidebar for the "Live Arrival List."
- **Large Display (Large):** High-legibility mode. Increase font sizes (min 20pt for key data) and icon scale so information is readable from a distance in a reception environment.

---

## 5. Functional Requirements

### 5.1 Map Interface
- **Route Layer:** A persistent polyline showing the Bristol Ferries route (Temple Meads to Hotwells).
- **Vessel Markers:** Must move smoothly. Use unique shapes or text initials (e.g., "C" for Cross-Harbour) so color is not the only identifier.
- **Stop Markers:** Tappable pins showing the stop name and the next 3 arrivals.

### 5.2 Accessible List View (Alternative)
- **Requirement:** A text-based "Live Status" view that stays in sync with the map.
- **Content:** Vessel Name -> Current Status (e.g., "Approaching Marina") -> ETA.

---

## 6. Position Estimation Logic (Timetable)

For vessels where `position_source == TIMETABLE`:
1. **Refresh:** Recalculate every 30 seconds.
2. **Interpolation:** 
   - `progress = (current_time - last_departure) / (next_arrival - last_departure)`.
   - `current_lat/lon = StartCoords + (EndCoords - StartCoords) * progress`.
3. **Stationary State:** If the current time is between arrival and departure at a single stop, the marker remains at that stop's coordinates.

---

## 7. WCAG 2.2 Compliance (Level AA)

- **Contrast (1.4.3):** Minimum 4.5:1 for all text and UI components.
- **Target Size (2.5.8):** All interactive elements (markers/buttons) must be at least **24x24 CSS pixels**.
- **Focus Appearance (2.4.11):** Highly visible 2px focus outlines for keyboard/switch users.
- **Non-Text Content (1.1.1):** All icons and markers must have descriptive `aria-label` text.
- **Redundant Entry (3.3.7):** Remember user preferences (e.g., "Home Stop") within the session.
- **Status Messages (4.1.3):** Use `aria-live="polite"` to announce arrivals to screen-reader users.

---

## 8. Technical Standards
- **Typography:** Sans-serif (e.g., GDS Transport or Arial). 16px minimum for mobile/desktop; 20px+ for large displays.
- **Performance:** Smooth map panning/zooming; lightweight data polling.
- **Error Handling:** Clear "Service Unavailable" messaging if data fails to load.

---

## 9. Acceptance Criteria
1. **Accuracy:** Bristol Ferries markers move correctly based on the timetable and system clock.
2. **Responsiveness:** UI is fully functional and legible on a phone, a laptop, and a 50-inch wall monitor.
3. **Accessibility:** Passes a WCAG 2.2 AA audit and adheres to GDS "This is for everyone" principle.
4. **Extensibility:** The system can accept a new GPS-based vessel (like the Harbour Master) without a code refactor.