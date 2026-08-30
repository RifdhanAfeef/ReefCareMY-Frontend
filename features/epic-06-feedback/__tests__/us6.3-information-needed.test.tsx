import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyReportsList } from "../my-reports-list";
import * as reportsApi from "@/lib/api/reportsApi";

vi.mock("@/lib/api/reportsApi");
const mockedGetMyReports = vi.mocked(reportsApi.getMyReports);

beforeEach(() => {
  mockedGetMyReports.mockReset();
});

// US6.3 AC1 — Given a report's status is "Needs More Information", when the
// observer views the report, then the system shall display "More
// information needed". No dedicated needs_more_info logic is required —
// this is just the status label rendering faithfully, like any other.
describe('US6.3 AC1 — "More information needed" is visible', () => {
  it("shows the label when the report status is needs_more_info", async () => {
    mockedGetMyReports.mockResolvedValue({
      items: [
        {
          reportReference: "RC-0198",
          threatCategory: "Coral bleaching",
          generalLocation: "Reef E",
          status: "needs_more_info",
          statusLabel: "More information needed",
          outcome: null,
          submittedAt: "2026-08-20T09:15:00Z",
        },
      ],
      page: 1,
      pageSize: 20,
      total: 1,
    });

    render(<MyReportsList />);

    expect(await screen.findByText("More information needed")).toBeInTheDocument();
  });
});
