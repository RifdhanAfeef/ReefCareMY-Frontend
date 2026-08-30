import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ReportDetail } from "../report-detail";
import * as reportsApi from "@/lib/api/reportsApi";
import type { ReportDetail as ReportDetailData } from "@/lib/api/types";

vi.mock("@/lib/api/reportsApi");
const mockedGetReportDetail = vi.mocked(reportsApi.getReportDetail);

beforeEach(() => {
  mockedGetReportDetail.mockReset();
});

function baseReport(overrides: Partial<ReportDetailData> = {}): ReportDetailData {
  return {
    reportReference: "RC-0241",
    threatCategory: "Ghost fishing gear",
    description: "Large fishing net tangled around coral",
    observedAt: "2026-08-24T12:30:00Z",
    estimatedDepthMetres: 12.5,
    generalLocation: "Tiger Reef, Tioman Island",
    diveSite: "Tiger Reef",
    preciseLocation: null,
    status: "under_review",
    statusLabel: "Being reviewed",
    outcome: null,
    informationRequestReason: null,
    closure: null,
    submittedAt: "2026-08-25T04:40:00Z",
    ...overrides,
  };
}

describe("Report detail — shows what was observed", () => {
  it("renders threat type, description and location", async () => {
    mockedGetReportDetail.mockResolvedValue(baseReport());

    render(<ReportDetail reportReference="RC-0241" />);

    expect(await screen.findByText("Ghost fishing gear")).toBeInTheDocument();
    expect(screen.getByText("Large fishing net tangled around coral")).toBeInTheDocument();
    expect(screen.getByText("Tiger Reef")).toBeInTheDocument();
  });
});

// US6.3 AC1 — the coordinator's reason for requesting more information is
// shown when present; no needs_more_info special-casing, just this field.
describe("US6.3 — information request reason is visible", () => {
  it("shows the reason when the backend sends one", async () => {
    mockedGetReportDetail.mockResolvedValue(
      baseReport({
        status: "needs_more_info",
        statusLabel: "More information needed",
        informationRequestReason: "Please confirm the approximate size of the net.",
      }),
    );

    render(<ReportDetail reportReference="RC-0241" />);

    expect(
      await screen.findByText(/Please confirm the approximate size of the net\./),
    ).toBeInTheDocument();
  });

  it("shows nothing extra when there is no information request", async () => {
    mockedGetReportDetail.mockResolvedValue(baseReport());

    render(<ReportDetail reportReference="RC-0241" />);

    await screen.findByText("Ghost fishing gear");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

// US6.2 AC3 — the closure label (and public note, if any) is shown for a
// closed report, using exactly the text the backend sends.
describe("US6.2 AC3 — closure reason is visible", () => {
  it("shows the closure label and public note for a closed report", async () => {
    mockedGetReportDetail.mockResolvedValue(
      baseReport({
        status: "closed_no_partner",
        statusLabel: "Closed",
        closure: {
          status: "closed_no_partner",
          closureLabel: "Recorded, no active response programme currently covers this site",
          publicNote: "We'll revisit if a partner becomes available.",
        },
      }),
    );

    render(<ReportDetail reportReference="RC-0241" />);

    expect(
      await screen.findByText(
        /Recorded, no active response programme currently covers this site/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/We'll revisit if a partner becomes available\./),
    ).toBeInTheDocument();
  });
});
