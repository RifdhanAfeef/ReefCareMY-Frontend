import { describe, expect, it } from "vitest";
import { initialLocationDraft, initialReportDraft } from "@/features/shared/mock-app-state";
import { buildReportSubmissionPayload } from "../report-payload";

describe("report submission boundary", () => {
  it("converts display values to the documented camelCase API payload", () => {
    const report = {
      ...initialReportDraft,
      threatCategoryCode: "ghost_gear" as const,
      threatCategoryId: 1,
      observationDate: "27/08/2026",
      observationTime: "09:10",
      estimatedDepthMetres: "12.5",
      description: "  Net tangled around coral.  ",
    };
    const location = {
      ...initialLocationDraft,
      confidence: "within_100m" as const,
      selectedSessionId: "session-4",
      sessions: [
        {
          id: "session-4",
          backendId: 4,
          namedDiveSiteId: 13,
          site: "Temple of the Sea",
        },
      ],
      pin: { x: 50, y: 50, latitude: 5.123456, longitude: 103.123456 },
    };

    const result = buildReportSubmissionPayload(report, location);
    expect(result).toMatchObject({
      threatCategoryId: 1,
      estimatedDepthMetres: 12.5,
      description: "Net tangled around coral.",
      diveSessionId: 4,
      location: {
        namedDiveSiteId: 13,
        locationConfidence: "within_100m",
        mapPin: { latitude: 5.123456, longitude: 103.123456 },
      },
    });
    expect(result.observedAt).toMatch(/^2026-08-27T/);
  });
});
