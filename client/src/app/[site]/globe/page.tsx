"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useRef } from "react";
import "./globe.css";

import { VisuallyHidden } from "radix-ui";
import { DisabledOverlay } from "../../../components/DisabledOverlay";
import { NothingFound } from "../../../components/NothingFound";
import { SessionCard } from "../../../components/Sessions/SessionCard";
import { Dialog, DialogContent, DialogTitle } from "../../../components/ui/dialog";
import { useSetPageTitle } from "../../../hooks/useSetPageTitle";
import { SubHeader } from "../components/SubHeader/SubHeader";
import { GlobeSessions } from "./components/GlobeSessions";
import MapViewSelector from "./components/ModeSelector";
import { TimelineScrubber } from "./components/TimelineScrubber";
import { useGlobeStore } from "./globeStore";
import { useTimelineLayer } from "./hooks/timelineLayer/useTimelineLayer";
import { useCoordinatesLayer } from "./hooks/useCoordinatesLayer";
import { useCountriesLayer } from "./hooks/useCountriesLayer";
import { useLayerVisibility } from "./hooks/useLayerVisibility";
import { useMapbox } from "./hooks/useMapbox";
import { useSubdivisionsLayer } from "./hooks/useSubdivisionsLayer";
import { useTimelineStore } from "./timelineStore";
import { useTimelineSessions } from "./hooks/timelineLayer/useTimelineSessions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { WINDOW_SIZE_OPTIONS } from "./timelineUtils";

export default function GlobePage() {
  useSetPageTitle("Rybbit · Globe");
  const mapContainer = useRef<HTMLDivElement>(null);
  const { windowSize, setManualWindowSize } = useTimelineStore();

  // Fetch timeline sessions and update store
  useTimelineSessions();

  // Handle window size change
  const handleWindowSizeChange = (value: string) => {
    const newSize = parseInt(value, 10);
    setManualWindowSize(newSize);
  };

  const mapView = useGlobeStore(state => state.mapView);

  const { map, mapLoaded } = useMapbox(mapContainer);

  useCountriesLayer({
    map,
    mapLoaded,
    mapView,
  });

  useSubdivisionsLayer({
    map,
    mapLoaded,
    mapView,
  });

  useCoordinatesLayer({
    map,
    mapLoaded,
    minutes: 30,
    mapView,
  });

  const { selectedSession, setSelectedSession } = useTimelineLayer({
    map,
    mapLoaded,
    mapView,
  });

  useLayerVisibility(map, mapView, mapLoaded);

  return (
    <DisabledOverlay message="Globe" featurePath="globe">
      <div className="relative w-full h-dvh overflow-hidden">
        <div className="p-2 md:p-4 relative z-50">
          <SubHeader />
        </div>
        <div className="absolute top-0 left-0 right-0 bottom-0 z-10">
          {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
            <div
              ref={mapContainer}
              className="w-full h-full [&_.mapboxgl-ctrl-bottom-left]:!hidden [&_.mapboxgl-ctrl-logo]:!hidden"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <NothingFound
                title="Mapbox access token not found"
                description={
                  <p className="text-sm max-w-[600px] text-center">
                    Please set the <code>MAPBOX_TOKEN</code> environment variable and rebuild all containers. To get a
                    Mapbox token, please visit{" "}
                    <a
                      href="https://docs.mapbox.com/help/dive-deeper/access-tokens/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Mapbox
                    </a>{" "}
                    and create an account.
                  </p>
                }
              />
            </div>
          )}
          <div className="absolute bottom-2 left-4 z-99999 right-4 flex flex-col gap-2 pointer-events-none">
            <div className="flex items-end gap-2 justify-between">
              <div className="pointer-events-auto">
                <MapViewSelector />
              </div>
              {mapView === "timeline" ? (
                <div className="pointer-events-auto">
                  <Select value={windowSize.toString()} onValueChange={handleWindowSizeChange}>
                    <SelectTrigger className="w-[100px]" size="sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WINDOW_SIZE_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="pointer-events-auto">
                  <GlobeSessions />
                </div>
              )}
            </div>
            {mapView === "timeline" && (
              <div className="pointer-events-auto">
                <TimelineScrubber />
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={!!selectedSession} onOpenChange={open => !open && setSelectedSession(null)}>
        <VisuallyHidden.Root>
          <DialogTitle>Session Details</DialogTitle>
        </VisuallyHidden.Root>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-transparent border-0 p-0 shadow-none [&>button]:hidden">
          {selectedSession && <SessionCard session={selectedSession} expandedByDefault />}
        </DialogContent>
      </Dialog>
    </DisabledOverlay>
  );
}
