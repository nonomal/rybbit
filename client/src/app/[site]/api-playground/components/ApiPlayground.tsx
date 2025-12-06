"use client";

import { EndpointList } from "./EndpointList";
import { ParameterControls } from "./ParameterControls";
import { ResponsePanel } from "./ResponsePanel";

export function ApiPlayground() {
  return (
    <div className="h-[calc(100vh-120px)] flex border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
      {/* Left Column - Endpoint List */}
      <div className="w-64 shrink-0">
        <EndpointList />
      </div>

      {/* Center Column - Parameter Controls */}
      <div className="w-80 shrink-0 border-l border-neutral-200 dark:border-neutral-800">
        <ParameterControls />
      </div>

      {/* Right Column - Response Panel */}
      <div className="flex-1 min-w-0 border-l border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <ResponsePanel />
      </div>
    </div>
  );
}
