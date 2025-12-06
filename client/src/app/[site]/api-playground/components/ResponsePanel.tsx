"use client";

import { Button } from "@/components/ui/button";
import { CodeSnippet } from "@/components/CodeSnippet";
import { usePlaygroundStore } from "../hooks/usePlaygroundStore";
import { CodeExamples } from "./CodeExamples";
import { CodeGenConfig } from "../utils/codeGenerators";
import { Copy, Loader2, Play, CheckCircle, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { BACKEND_URL } from "@/lib/const";
import { authedFetch } from "@/api/utils";

export function ResponsePanel() {
  const params = useParams();
  const siteId = params.site as string;
  const [copied, setCopied] = useState(false);

  const {
    selectedEndpoint,
    startDate,
    endDate,
    timeZone,
    getApiFilters,
    endpointParams,
    pathParams,
    requestBody,
    response,
    responseError,
    isLoading,
    responseTime,
    setResponse,
    setResponseError,
    setIsLoading,
  } = usePlaygroundStore();

  // Build the full URL
  const { fullUrl, queryParams, parsedBody } = useMemo(() => {
    if (!selectedEndpoint) {
      return { fullUrl: "", queryParams: {}, parsedBody: undefined };
    }

    // Replace path params and :site
    let path = selectedEndpoint.path.replace(":site", siteId);
    if (selectedEndpoint.pathParams) {
      for (const param of selectedEndpoint.pathParams) {
        path = path.replace(`:${param}`, pathParams[param] || `:${param}`);
      }
    }

    // Build query params
    const qp: Record<string, any> = {};

    if (selectedEndpoint.hasCommonParams) {
      qp.start_date = startDate;
      qp.end_date = endDate;
      qp.time_zone = timeZone;

      const apiFilters = getApiFilters();
      if (apiFilters.length > 0) {
        qp.filters = JSON.stringify(apiFilters);
      }
    }

    // Add endpoint-specific params
    if (selectedEndpoint.specificParams) {
      for (const param of selectedEndpoint.specificParams) {
        if (endpointParams[param]) {
          qp[param] = endpointParams[param];
        }
      }
    }

    // Parse request body
    let body: any;
    if (selectedEndpoint.hasRequestBody && requestBody) {
      try {
        body = JSON.parse(requestBody);
      } catch {
        // Invalid JSON, will be handled during request
      }
    }

    // Build query string
    const queryString = Object.entries(qp)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");

    const url = `${BACKEND_URL}${path}${queryString ? `?${queryString}` : ""}`;

    return { fullUrl: url, queryParams: qp, parsedBody: body };
  }, [
    selectedEndpoint,
    siteId,
    startDate,
    endDate,
    timeZone,
    getApiFilters,
    endpointParams,
    pathParams,
    requestBody,
  ]);

  // Code generation config
  const codeConfig: CodeGenConfig = useMemo(() => {
    if (!selectedEndpoint) {
      return {
        method: "GET",
        url: "",
        queryParams: {},
      };
    }

    let path = selectedEndpoint.path.replace(":site", siteId);
    if (selectedEndpoint.pathParams) {
      for (const param of selectedEndpoint.pathParams) {
        path = path.replace(`:${param}`, pathParams[param] || `{${param}}`);
      }
    }

    return {
      method: selectedEndpoint.method,
      url: `https://api.rybbit.io${path}`,
      queryParams,
      body: parsedBody,
    };
  }, [selectedEndpoint, siteId, pathParams, queryParams, parsedBody]);

  // Handle execute
  const handleExecute = async () => {
    if (!selectedEndpoint) return;

    // Validate path params
    if (selectedEndpoint.pathParams) {
      for (const param of selectedEndpoint.pathParams) {
        if (!pathParams[param]) {
          setResponseError(`Missing required path parameter: ${param}`);
          return;
        }
      }
    }

    // Validate required query params
    if (selectedEndpoint.requiredParams) {
      for (const param of selectedEndpoint.requiredParams) {
        if (!endpointParams[param]) {
          setResponseError(`Missing required parameter: ${param}`);
          return;
        }
      }
    }

    // Validate request body for POST/PUT
    if (selectedEndpoint.hasRequestBody && requestBody) {
      try {
        JSON.parse(requestBody);
      } catch {
        setResponseError("Invalid JSON in request body");
        return;
      }
    }

    setIsLoading(true);
    const startTime = performance.now();

    try {
      // Build the path
      let path = selectedEndpoint.path.replace(":site", siteId);
      if (selectedEndpoint.pathParams) {
        for (const param of selectedEndpoint.pathParams) {
          path = path.replace(`:${param}`, pathParams[param]);
        }
      }

      // Make the request
      const result = await authedFetch<any>(
        path,
        queryParams,
        selectedEndpoint.method !== "GET"
          ? {
              method: selectedEndpoint.method,
              data: parsedBody,
            }
          : undefined
      );

      const endTime = performance.now();
      setResponse(result, Math.round(endTime - startTime));
    } catch (err: any) {
      setResponseError(err.message || "Request failed");
    }
  };

  // Copy URL
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!selectedEndpoint) {
    return (
      <div className="h-full flex items-center justify-center text-neutral-500 dark:text-neutral-400 p-4">
        <p className="text-sm text-center">
          Select an endpoint to see the request URL and code examples
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-4 space-y-4 min-w-0">
      {/* Request URL */}
      <div className="space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Request URL
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyUrl}
            className="h-6 px-2 text-xs shrink-0"
          >
            {copied ? (
              <CheckCircle className="h-3 w-3 mr-1" />
            ) : (
              <Copy className="h-3 w-3 mr-1" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded text-xs font-mono break-all overflow-x-auto max-w-full">
          <span className="break-all">{fullUrl}</span>
        </div>
      </div>

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Executing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Execute Request
          </>
        )}
      </Button>

      {/* Code Examples */}
      <div className="space-y-2">
        <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
          Code Examples
        </h3>
        <CodeExamples config={codeConfig} />
      </div>

      {/* Response */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Response
          </h3>
          {responseTime !== null && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {responseTime}ms
            </span>
          )}
        </div>

        {responseError ? (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
            <div className="flex items-start gap-2">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {responseError}
              </p>
            </div>
          </div>
        ) : response ? (
          <div className="max-h-[400px] overflow-auto rounded-lg">
            <CodeSnippet
              code={JSON.stringify(response, null, 2)}
              language="json"
            />
          </div>
        ) : (
          <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-xs text-neutral-500 dark:text-neutral-400">
            Click &quot;Execute Request&quot; to see the response
          </div>
        )}
      </div>
    </div>
  );
}
