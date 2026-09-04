import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoordinatorCaseRoute } from "../case-workflow";
import * as coordinatorApi from "@/lib/api/coordinatorApi";
import type { CoordinatorCase } from "@/lib/api/types";
import { readRememberedClaims } from "@/lib/api/claimed-case-store";

vi.mock("@/lib/api/coordinatorApi");

const mockedClaimReport = vi.mocked(coordinatorApi.claimReport);
const mockedCloseCase = vi.mocked(coordinatorApi.closeCase);
const mockedGetCoordinatorCase = vi.mocked(coordinatorApi.getCoordinatorCase);
const mockedRecordCaseDecision = vi.mocked(coordinatorApi.recordCaseDecision);
const mockedRequestMoreInformation = vi.mocked(coordinatorApi.requestMoreInformation);

const report: CoordinatorCase = {
  reportReference: "RC-2001",
  observerId: 14,
  threat: "Ghost fishing gear",
  description: "A net is caught across the reef.",
  observedAt: "2026-09-03T04:15:00Z",
  estimatedDepthMetres: 12,
  area: "Tioman Island",
  preciseLocation: {
    latitude: 2.7902,
    longitude: 104.1698,
    uncertaintyMetres: 25,
  },
  statusCode: "under_review",
  statusLabel: "Under Review",
  submittedAt: "2026-09-03T05:00:00Z",
  owner: { id: 8, displayName: "Case Coordinator" },
  evidence: [{ fileName: "reef-net.jpg", contentType: "image/jpeg" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  mockedGetCoordinatorCase.mockResolvedValue(report);
  mockedClaimReport.mockResolvedValue({
    reportReference: report.reportReference,
    owner: report.owner,
    statusCode: "claimed",
    statusLabel: "Claimed",
    claimedAt: "2026-09-04T01:00:00Z",
  });
  mockedRequestMoreInformation.mockResolvedValue({
    reportReference: report.reportReference,
    status: "needs_more_info",
    reason: "Please add more detail.",
    requestedAt: "2026-09-04T01:10:00Z",
  });
  mockedRecordCaseDecision.mockResolvedValue({
    reportReference: report.reportReference,
    responseType: "monitoring_only",
    decidedAt: "2026-09-04T01:20:00Z",
    decidedBy: report.owner.id,
  });
  mockedCloseCase.mockResolvedValue({
    reportReference: report.reportReference,
    status: "closed_no_action",
    closureReasonCode: "monitored_no_action",
    closedAt: "2026-09-04T01:30:00Z",
  });
});

describe("Coordinator case workflow", () => {
  it("claims a queue report through the backend before loading protected details", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("reefcare.auth", JSON.stringify({
      accessToken: "coordinator-token",
      user: { id: report.owner.id, displayName: report.owner.displayName, role: "case_coordinator" },
    }));
    render(<CoordinatorCaseRoute reportReference={report.reportReference} startWithClaim />);

    expect(mockedGetCoordinatorCase).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Claim and open report" }));

    expect(await screen.findByRole("heading", { name: "Review reef observation" })).toBeInTheDocument();
    expect(mockedClaimReport).toHaveBeenCalledWith(report.reportReference);
    expect(mockedGetCoordinatorCase).toHaveBeenCalledWith(report.reportReference);
    expect(screen.getByText("reef-net.jpg")).toBeInTheDocument();
    expect(screen.getByText("2.790200, 104.169800")).toBeInTheDocument();
    expect(screen.getByText(/The all-reports queue will retain it/)).toBeInTheDocument();
    expect(readRememberedClaims()).toEqual([{
      reportReference: report.reportReference,
      claimedAt: "2026-09-04T01:00:00Z",
    }]);
  });

  it("keeps a successful claim accessible when the first detail request fails", async () => {
    const user = userEvent.setup();
    window.localStorage.setItem("reefcare.auth", JSON.stringify({
      accessToken: "coordinator-token",
      user: { id: report.owner.id, displayName: report.owner.displayName, role: "case_coordinator" },
    }));
    mockedGetCoordinatorCase
      .mockRejectedValueOnce(new Error("Temporary read failure."))
      .mockResolvedValueOnce(report);

    render(<CoordinatorCaseRoute reportReference={report.reportReference} startWithClaim />);
    await user.click(screen.getByRole("button", { name: "Claim and open report" }));

    expect(await screen.findByText(/The report was claimed successfully/)).toBeInTheDocument();
    expect(readRememberedClaims()).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Review reef observation" })).toBeInTheDocument();
    expect(mockedClaimReport).toHaveBeenCalledTimes(1);
    expect(mockedGetCoordinatorCase).toHaveBeenCalledTimes(2);
  });

  it("does not offer decision controls while the backend still reports Claimed", async () => {
    mockedGetCoordinatorCase.mockResolvedValueOnce({
      ...report,
      statusCode: "claimed",
      statusLabel: "Claimed",
    });

    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    expect(await screen.findByText("Waiting for Under Review status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start evidence assessment" })).toBeDisabled();
  });

  it("does not fake a Not Substantiated closure without a backend assessment endpoint", async () => {
    const user = userEvent.setup();
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    await user.click(await screen.findByRole("button", { name: "Start evidence assessment" }));
    await user.click(screen.getByLabelText("Yes — the evidence can be assessed"));
    await user.click(screen.getByLabelText("No — prepare a Not Substantiated closure"));
    await user.click(screen.getByLabelText("No matching report found"));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText(/cannot be saved yet because the backend does not expose/)).toBeInTheDocument();
    expect(mockedCloseCase).not.toHaveBeenCalled();
  });

  it("sends an observer information request through the backend", async () => {
    const user = userEvent.setup();
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    await user.click(await screen.findByRole("button", { name: "Request more information" }));
    await user.click(screen.getByRole("button", { name: "Send request" }));

    expect(await screen.findByRole("heading", { name: "Information request sent" })).toBeInTheDocument();
    expect(mockedRequestMoreInformation).toHaveBeenCalledWith(
      report.reportReference,
      expect.stringContaining("A clearer photograph showing the issue"),
    );
  });

  it("records a monitoring decision and closure through the backend", async () => {
    const user = userEvent.setup();
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    await user.click(await screen.findByRole("button", { name: "Start evidence assessment" }));
    await user.click(screen.getByLabelText("Yes — the evidence can be assessed"));
    await user.click(screen.getByLabelText("Yes — continue to a response decision"));
    await user.click(screen.getByLabelText("No matching report found"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByLabelText(/Monitoring Only/));
    await user.click(screen.getByRole("button", { name: "Record response" }));

    expect(await screen.findByRole("heading", { name: "Response decision recorded" })).toBeInTheDocument();
    expect(mockedRecordCaseDecision).toHaveBeenCalledWith(
      report.reportReference,
      expect.objectContaining({ responseType: "monitoring_only" }),
    );

    await user.click(screen.getByRole("button", { name: "Record a closure outcome" }));
    await user.click(screen.getByLabelText(/Monitored, no action required/));
    await user.type(screen.getByLabelText("Public closure note *"), "Reviewed and retained for monitoring.");
    await user.click(screen.getByRole("button", { name: "Close case" }));

    expect(await screen.findByRole("heading", { name: "Case outcome recorded" })).toBeInTheDocument();
    expect(mockedCloseCase).toHaveBeenCalledWith(report.reportReference, {
      closureReasonCode: "monitored_no_action",
      publicClosureNote: "Reviewed and retained for monitoring.",
    });
  });

  it("shows backend load errors and retries the owned-case request", async () => {
    const user = userEvent.setup();
    mockedGetCoordinatorCase
      .mockRejectedValueOnce(new Error("You do not own this report."))
      .mockResolvedValueOnce(report);

    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    expect(await screen.findByText("You do not own this report.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Review reef observation" })).toBeInTheDocument();
    expect(mockedGetCoordinatorCase).toHaveBeenCalledTimes(2);
  });
});
