import './style.css';
import { mockVessels, stops, bristolFerriesRoute } from './data/mockData';
import { TrackerEngine } from './core/TrackerEngine';
import { MapManager } from './ui/MapManager';
import { ListManager } from './ui/ListManager';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize core engine
  const trackerEngine = new TrackerEngine(mockVessels, stops, bristolFerriesRoute.path);

  // Initialize UI components
  const mapManager = new MapManager('map', trackerEngine);
  const listManager = new ListManager('live-list');

  // Draw static map features
  mapManager.drawRoute(bristolFerriesRoute);
  mapManager.drawStops(stops);

  // Bind data updates to UI
  trackerEngine.onUpdate((vessels) => {
    mapManager.updateVessels(vessels);
    listManager.update(vessels);
  });



  // Start tracking
  trackerEngine.start();

  // Expose API for real-time geospatial data injection
  (window as any).bristolTracker = trackerEngine;
});
