import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReportQueue } from "../report-queue";
import * as coordinatorApi from "@/lib/api/coordinatorApi";
import type { CoordinatorQueueResult } from "@/lib/api/types";

vi.mock("@/lib/api/coordinatorApi");
const mockedGetCoordinatorQueue = vi.mocked(coordinatorApi.getCoordinatorQueue);

beforeEach(() => {
  mockedGetCoordinatorQueue.mockReset();
  window.localStorage.clear();
});

function resultOf(
  items: CoordinatorQueueResult["items"],
  page = 1,
  total = items.length,
): CoordinatorQueueResult {
  return { items, page, pageSize: 20, total };
}

const report = {
  reportReference: "RC-1001",
  threat: "Ghost fishing gear",
  area: "Tioman Island",
  statusLabel: "Received",
  submittedAt: "2026-09-04T02:00:00Z",
  hoursInQueue: 3,
};

describe("Coordinator report queue", () => {
  it("renders the reports returned by the backend queue endpoint", async () => {
    mockedGetCoordinatorQueue.mockResolvedValue(resultOf([report]));

    render(<ReportQueue />);

    expect(
      await screen.findByRole("link", { name: "Review and claim RC-1001" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ghost fishing gear")).toBeInTheDocument();
    expect(screen.getAllByText("Tioman Island")).toHaveLength(2);
    expect(mockedGetCoordinatorQueue).toHaveBeenCalledWith(1, 20);
  });

  it("loads the next backend page when the coordinator selects Next", async () => {
    const user = userEvent.setup();
    mockedGetCoordinatorQueue
      .mockResolvedValueOnce(resultOf([report], 1, 21))
      .mockResolvedValueOnce(
        resultOf(
          [{ ...report, reportReference: "RC-1021", area: "Redang Island" }],
          2,
          21,
        ),
      );

    render(<ReportQueue />);
    expect(
      await screen.findByRole("link", { name: "Review and claim RC-1001" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByRole("link", { name: "Review and claim RC-1021" }),
    ).toBeInTheDocument();
    expect(mockedGetCoordinatorQueue).toHaveBeenLastCalledWith(2, 20);
  });

  it("shows the backend error and allows the request to be retried", async () => {
    const user = userEvent.setup();
    mockedGetCoordinatorQueue
      .mockRejectedValueOnce(new Error("Unable to reach the coordinator API."))
      .mockResolvedValueOnce(resultOf([]));

    render(<ReportQueue />);

    expect(await screen.findByText("Unable to reach the coordinator API.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByText("No reports were returned")).toBeInTheDocument();
    expect(mockedGetCoordinatorQueue).toHaveBeenCalledTimes(2);
  });

  it("renders claimed reports and lets the current owner reopen their case", async () => {
    window.localStorage.setItem("reefcare.auth", JSON.stringify({
      accessToken: "coordinator-token",
      user: { id: 8, displayName: "Current Coordinator", role: "case_coordinator" },
    }));
    mockedGetCoordinatorQueue.mockResolvedValue(resultOf([
      {
        ...report,
        statusCode: "claimed",
        statusLabel: "Claimed",
        owner: { id: 8, displayName: "Current Coordinator" },
        claimedAt: "2026-09-04T03:00:00Z",
      },
      {
        ...report,
        reportReference: "RC-1002",
        statusCode: "under_review",
        statusLabel: "Under Review",
        owner: { id: 9, displayName: "Another Coordinator" },
        claimedAt: "2026-09-04T03:10:00Z",
      },
    ]));

    render(<ReportQueue />);

    expect(await screen.findByRole("link", { name: "View claimed case RC-1001" })).toHaveAttribute(
      "href",
      "/coordinator/reports/RC-1001",
    );
    expect(screen.getByText("Another Coordinator")).toBeInTheDocument();
    expect(screen.getByText("Under Review")).toBeInTheDocument();
  });

  it("explains when the backend still returns the unclaimed-only response shape", async () => {
    mockedGetCoordinatorQueue.mockResolvedValue(resultOf([report]));

    render(<ReportQueue />);

    expect(await screen.findByText("The backend is still returning the old unclaimed-only queue shape")).toBeInTheDocument();
    expect(screen.getByText(/Claimed reports cannot appear until this endpoint returns/)).toBeInTheDocument();
  });
});
