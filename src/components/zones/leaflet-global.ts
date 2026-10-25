import L from "leaflet";

// Geoman's bundle reads the global `L`, which Leaflet's ES module build doesn't set. Import this before Geoman.
(globalThis as { L?: typeof L }).L = L;
