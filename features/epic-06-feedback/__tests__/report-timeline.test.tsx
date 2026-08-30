import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportTimeline } from "../report-timeline";
import * as reportsApi from "@/lib/api/reportsApi";

vi.mock("@/lib/api/reportsApi");
const mockedGetReportTimeline = vi.mocked(reportsApi.getReportTimeline);

beforeEach(() => {
  mockedGetReportTimeline.mockReset();
});

describe("US6.2 AC2 — plain-language status timeline", () => {
  it("renders each status change as an observer-facing label, in order", async () => {
    mockedGetReportTimeline.mockResolvedValue({
      reportReference: "RC-0241",
      timeline: [
        { statusLabel: "Report received", occurredAt: "2026-08-25T04:40:00Z" },
        { statusLabel: "A case coordinator has your report", occurredAt: "2026-08-25T05:10:00Z" },
        { statusLabel: "Being reviewed", occurredAt: "2026-08-25T06:00:00Z" },
      ],
    });

    render(<ReportTimeline reportReference="RC-0241" />);

    const steps = await screen.findAllByRole("listitem");
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringContaining("Report received"),
      expect.stringContaining("A case coordinator has your report"),
      expect.stringContaining("Being reviewed"),
    ]);
  });
});
