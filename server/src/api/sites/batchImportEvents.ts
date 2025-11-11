import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { getUserHasAdminAccessToSite } from "../../lib/auth-utils.js";
import { clickhouse } from "../../db/clickhouse/clickhouse.js";
import { updateImportProgress, updateImportStatus, getImportById } from "../../services/import/importStatusManager.js";
import { UmamiImportMapper, type UmamiEvent } from "../../services/import/mappings/umami.js";
import { ImportQuotaTracker } from "../../services/import/importQuotaChecker.js";
import { db } from "../../db/postgres/postgres.js";
import { sites, importStatus } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";

const batchImportRequestSchema = z
  .object({
    params: z.object({
      site: z.string().min(1),
      importId: z.string().uuid(),
    }),
    body: z.object({
      events: z.array(UmamiImportMapper.umamiEventKeyOnlySchema).min(1).max(10000),
      isLastBatch: z.boolean().optional(),
    }),
  })
  .strict();

type BatchImportRequest = {
  Params: z.infer<typeof batchImportRequestSchema.shape.params>;
  Body: z.infer<typeof batchImportRequestSchema.shape.body>;
};

export async function batchImportEvents(request: FastifyRequest<BatchImportRequest>, reply: FastifyReply) {
  try {
    const parsed = batchImportRequestSchema.safeParse({
      params: request.params,
      body: request.body,
    });

    if (!parsed.success) {
      return reply.status(400).send({ error: "Validation error" });
    }

    const { site, importId } = parsed.data.params;
    const { events, isLastBatch } = parsed.data.body;
    const siteId = Number(site);

    const userHasAccess = await getUserHasAdminAccessToSite(request, site);
    if (!userHasAccess) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Verify import exists and is in valid state
    const importRecord = await getImportById(importId);
    if (!importRecord) {
      return reply.status(404).send({ error: "Import not found" });
    }

    if (importRecord.siteId !== siteId) {
      return reply.status(400).send({ error: "Import does not belong to this site" });
    }

    if (importRecord.status === "completed") {
      return reply.status(400).send({ error: "Import already completed" });
    }

    if (importRecord.status === "failed") {
      return reply.status(400).send({ error: "Import has failed" });
    }

    if (importRecord.status === "pending") {
      await updateImportStatus(importId, "processing");
    }

    // Auto-detect platform if not set (first batch)
    let detectedPlatform = importRecord.platform;
    if (!detectedPlatform) {
      const firstEvent = events[0];

      if (UmamiImportMapper.umamiEventKeyOnlySchema.safeParse(firstEvent).success) {
        detectedPlatform = "umami";
      } else {
        return reply.status(400).send({ error: "Unable to detect platform from event structure" });
      }

      await db.update(importStatus).set({ platform: detectedPlatform }).where(eq(importStatus.importId, importId));
    }

    const [siteRecord] = await db
      .select({ organizationId: sites.organizationId })
      .from(sites)
      .where(eq(sites.siteId, siteId))
      .limit(1);

    if (!siteRecord) {
      return reply.status(404).send({ error: "Site not found" });
    }

    try {
      const quotaTracker = await ImportQuotaTracker.create(siteRecord.organizationId);

      const eventsWithinQuota: UmamiEvent[] = [];
      let skippedDueToQuota = 0;

      for (const event of events) {
        if (!event.created_at) {
          continue;
        }

        if (quotaTracker.canImportEvent(event.created_at)) {
          eventsWithinQuota.push(event);
        } else {
          skippedDueToQuota++;
        }
      }

      if (eventsWithinQuota.length === 0) {
        const quotaSummary = quotaTracker.getSummary();
        const quotaMessage =
          `All ${events.length} events exceeded monthly quotas or fell outside the ${quotaSummary.totalMonthsInWindow}-month historical window. ` +
          `${quotaSummary.monthsAtCapacity} of ${quotaSummary.totalMonthsInWindow} months are at full capacity.`;

        if (isLastBatch) {
          await updateImportStatus(importId, "completed", quotaMessage);
        }

        return reply.send({
          success: true,
          importedCount: 0,
          quotaExceeded: true,
          message: quotaMessage,
        });
      }

      const transformedEvents = UmamiImportMapper.transform(eventsWithinQuota, site, importId);

      if (transformedEvents.length === 0) {
        if (isLastBatch) {
          await updateImportStatus(importId, "completed", "No valid events found in the final batch");
        }

        return reply.send({
          success: true,
          importedCount: 0,
          message: "No valid events in batch",
        });
      }

      await clickhouse.insert({
        table: "events",
        values: transformedEvents,
        format: "JSONEachRow",
      });

      await updateImportProgress(importId, transformedEvents.length);

      if (isLastBatch) {
        const finalMessage =
          skippedDueToQuota > 0
            ? `Import completed. ${skippedDueToQuota} events were skipped due to quota limits.`
            : undefined;
        await updateImportStatus(importId, "completed", finalMessage);
      }

      return reply.send({
        success: true,
        importedCount: transformedEvents.length,
        message: `Imported ${transformedEvents.length} events${skippedDueToQuota > 0 ? ` (${skippedDueToQuota} skipped due to quota)` : ""}`,
      });
    } catch (insertError) {
      const errorMessage = insertError instanceof Error ? insertError.message : "Unknown error";
      await updateImportStatus(importId, "failed", `Failed to insert events: ${errorMessage}`);

      return reply.status(500).send({
        success: false,
        error: "Failed to insert events",
        message: errorMessage,
      });
    }
  } catch (error) {
    console.error("Error importing events", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
