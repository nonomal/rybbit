// Worker manager for coordinating CSV import process
// Manages worker lifecycle and sequential batch uploads
// Server handles transformation and quota checking

import type { WorkerMessageToWorker, WorkerMessageToMain, ImportProgress, UmamiEvent } from "./types";

type ProgressCallback = (progress: ImportProgress) => void;
type CompleteCallback = (success: boolean, message: string) => void;

export class CSVWorkerManager {
  private worker: Worker | null = null;
  private progress: ImportProgress = {
    status: "idle",
    parsedRows: 0,
    skippedRows: 0,
    importedEvents: 0,
    errors: 0,
  };
  private onProgress: ProgressCallback | null = null;
  private onComplete: CompleteCallback | null = null;
  private uploadInProgress = false;
  private parsingComplete = false;
  private siteId: number = 0;
  private importId: string = "";

  constructor(onProgress?: ProgressCallback, onComplete?: CompleteCallback) {
    this.onProgress = onProgress || null;
    this.onComplete = onComplete || null;
  }

  startImport(
    file: File,
    siteId: number,
    importId: string,
    earliestAllowedDate: string,
    latestAllowedDate: string
  ): void {
    this.siteId = siteId;
    this.importId = importId;
    this.parsingComplete = false;
    this.uploadInProgress = false;

    this.progress = {
      status: "parsing",
      parsedRows: 0,
      skippedRows: 0,
      importedEvents: 0,
      errors: 0,
    };

    // Create worker
    this.worker = new Worker(new URL("@/workers/csv-import.worker.ts", import.meta.url), {
      type: "module",
    });

    // Set up message handler
    this.worker.onmessage = (event: MessageEvent<WorkerMessageToMain>) => {
      this.handleWorkerMessage(event.data);
    };

    // Set up error handler
    this.worker.onerror = error => {
      this.progress.status = "failed";
      this.progress.errors++;
      this.notifyProgress();
      if (this.onComplete) {
        this.onComplete(false, `Worker error: ${error.message}`);
      }
    };

    // Start parsing with quota-based date range for client-side filtering
    const message: WorkerMessageToWorker = {
      type: "PARSE_START",
      file,
      earliestAllowedDate,
      latestAllowedDate,
    };

    this.worker.postMessage(message);
    this.notifyProgress();
  }

  private handleWorkerMessage(message: WorkerMessageToMain): void {
    switch (message.type) {
      case "CHUNK_READY":
        // Update progress from chunk stats
        this.progress.parsedRows = message.parsed;
        this.progress.skippedRows = message.skipped;
        this.progress.errors = message.errors;

        // Upload batch immediately (sequential)
        this.progress.status = "uploading";
        this.notifyProgress();
        this.uploadBatch(message.events);
        break;

      case "COMPLETE":
        this.parsingComplete = true;
        this.progress.parsedRows = message.parsed;
        this.progress.skippedRows = message.skipped;
        this.progress.errors = message.errors;

        this.notifyProgress();

        // Check if upload is complete
        this.checkCompletion();
        break;

      case "ERROR":
        this.progress.status = "failed";
        this.progress.errors++;
        this.notifyProgress();
        if (this.onComplete) {
          this.onComplete(false, message.message);
        }
        break;

      default:
        console.warn("Unknown worker message type:", message);
    }
  }

  private async uploadBatch(events: UmamiEvent[]): Promise<void> {
    this.uploadInProgress = true;

    try {
      const response = await fetch(`/api/batch-import-events/${this.siteId}/${this.importId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          events,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      this.progress.importedEvents += data.importedCount ?? events.length;
      this.notifyProgress();
    } catch (error) {
      // Fail fast - no retries
      this.progress.status = "failed";
      this.progress.errors++;
      this.notifyProgress();

      if (this.onComplete) {
        this.onComplete(false, `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      this.terminate();
      return;
    } finally {
      this.uploadInProgress = false;
    }

    // Check if we're done
    this.checkCompletion();
  }

  private checkCompletion(): void {
    if (this.parsingComplete && !this.uploadInProgress) {
      this.progress.status = "completed";
      this.notifyProgress();
      if (this.onComplete) {
        this.onComplete(true, `Import completed successfully: ${this.progress.importedEvents} events imported`);
      }

      // Clean up worker
      this.terminate();
    }
  }

  private notifyProgress(): void {
    if (this.onProgress) {
      this.onProgress({ ...this.progress });
    }
  }

  getProgress(): ImportProgress {
    return { ...this.progress };
  }

  terminate(): void {
    if (this.worker) {
      const message: WorkerMessageToWorker = {
        type: "CANCEL",
      };
      this.worker.postMessage(message);
      this.worker.terminate();
      this.worker = null;
    }
  }
}
