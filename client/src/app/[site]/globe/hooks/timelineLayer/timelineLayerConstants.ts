// Mapbox layer and source IDs
export const SOURCE_ID = "timeline-sessions";
export const CLUSTER_LAYER_ID = "timeline-clusters";
export const CLUSTER_COUNT_LAYER_ID = "timeline-cluster-count";
export const UNCLUSTERED_LAYER_ID = "timeline-unclustered-point";

// Clustering configuration
// Maximum zoom level where clustering is applied. Beyond this zoom, all points are shown individually
export const CLUSTER_MAX_ZOOM = 11;
// Radius in pixels within which points are grouped into clusters
export const CLUSTER_RADIUS = 25;
// Minimum number of points required to form a visible cluster
export const MIN_CLUSTER_SIZE = 10;
// Only enable clustering when total session count exceeds this threshold (performance optimization)
export const CLUSTERING_THRESHOLD = 500;

export const PAGE_SIZE = 10000;
export const MAX_PAGES = 10;
