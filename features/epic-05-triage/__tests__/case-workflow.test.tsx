import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CoordinatorCaseRoute } from "../case-workflow";
import * as coordinatorApi from "@/lib/api/coordinatorApi";
import type { CoordinatorCase } from "@/lib/api/types";

vi.mock("@/lib/api/coordinatorApi");

const mockedClaimReport = vi.mocked(coordinatorApi.claimReport);
const mockedCloseCase = vi.mocked(coordinatorApi.closeCase);
const mockedGetCoordinatorCase = vi.mocked(coordinatorApi.getCoordinatorCase);
const mockedGetCoordinatorEvidence = vi.mocked(coordinatorApi.getCoordinatorEvidence);
const mockedRecordEvidenceAssessment = vi.mocked(coordinatorApi.recordEvidenceAssessment);
const mockedRecordCaseDecision = vi.mocked(coordinatorApi.recordCaseDecision);
const mockedRequestMoreInformation = vi.mocked(coordinatorApi.requestMoreInformation);
const mockedStartReview = vi.mocked(coordinatorApi.startReview);

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
  evidence: [{ evidenceId: 13, mediaType: "photo", uploadedAt: "2026-09-03T04:20:00Z" }],
};

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:reef-evidence") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  mockedGetCoordinatorCase.mockResolvedValue(report);
  mockedGetCoordinatorEvidence.mockResolvedValue(new Blob(["image"], { type: "image/jpeg" }));
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
  mockedStartReview.mockResolvedValue({
    reportReference: report.reportReference,
    statusCode: "under_review",
  });
  mockedRecordEvidenceAssessment.mockResolvedValue({
    reportReference: report.reportReference,
    evidenceUsable: true,
    observationCredible: true,
    status: "evidence_accepted",
    assessedAt: "2026-09-04T01:15:00Z",
    assessedBy: report.owner.id,
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
  it("loads and displays protected evidence automatically with the case", async () => {
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    expect(await screen.findByRole("img", { name: "Submitted evidence 13" })).toHaveAttribute("src", "blob:reef-evidence");
    expect(mockedGetCoordinatorEvidence).toHaveBeenCalledWith(report.reportReference, 13);
    expect(screen.queryByRole("button", { name: /open evidence/i })).not.toBeInTheDocument();
  });

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
    expect(screen.getByText("photo")).toBeInTheDocument();
    expect(screen.getByText("2.790200, 104.169800")).toBeInTheDocument();
    expect(screen.getByText(/You can now begin reviewing its evidence/)).toBeInTheDocument();
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
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Review reef observation" })).toBeInTheDocument();
    expect(mockedClaimReport).toHaveBeenCalledTimes(1);
    expect(mockedGetCoordinatorCase).toHaveBeenCalledTimes(2);
  });

  it("moves a claimed case to under review before opening the assessment", async () => {
    const user = userEvent.setup();
    mockedGetCoordinatorCase.mockResolvedValueOnce({
      ...report,
      statusCode: "claimed",
      statusLabel: "Claimed",
    });

    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    const startButton = await screen.findByRole("button", { name: "Start evidence assessment" });
    expect(startButton).toBeEnabled();
    await user.click(startButton);
    expect(screen.getByRole("heading", { name: "Assess the submitted evidence" })).toBeInTheDocument();
    expect(mockedStartReview).toHaveBeenCalledWith(report.reportReference);
  });

  it("records a Not Substantiated evidence outcome through the backend", async () => {
    const user = userEvent.setup();
    mockedRecordEvidenceAssessment.mockResolvedValueOnce({
      reportReference: report.reportReference,
      evidenceUsable: true,
      observationCredible: false,
      status: "closed_not_substantiated",
      assessedAt: "2026-09-04T01:15:00Z",
      assessedBy: report.owner.id,
    });
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    await user.click(await screen.findByRole("button", { name: "Start evidence assessment" }));
    await user.click(screen.getByLabelText("Yes — the evidence can be assessed"));
    await user.click(screen.getByLabelText("No — prepare a Not Substantiated closure"));
    await user.click(screen.getByLabelText("No matching report found"));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByRole("heading", { name: "Case outcome recorded" })).toBeInTheDocument();
    expect(mockedRecordEvidenceAssessment).toHaveBeenCalledWith(
      report.reportReference,
      expect.objectContaining({ evidenceUsable: true, observationCredible: false }),
    );
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

  it("records unusable evidence before showing the information-needed result", async () => {
    const user = userEvent.setup();
    mockedRecordEvidenceAssessment.mockResolvedValueOnce({
      reportReference: report.reportReference,
      evidenceUsable: false,
      observationCredible: null,
      status: "needs_more_info",
      assessedAt: "2026-09-04T01:15:00Z",
      assessedBy: report.owner.id,
    });
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    await user.click(await screen.findByRole("button", { name: "Start evidence assessment" }));
    await user.click(screen.getByLabelText("No — more information is required"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Send request" }));

    expect(await screen.findByRole("heading", { name: "Information request sent" })).toBeInTheDocument();
    expect(mockedRecordEvidenceAssessment).toHaveBeenCalledWith(
      report.reportReference,
      expect.objectContaining({ evidenceUsable: false }),
    );
    expect(mockedRequestMoreInformation).not.toHaveBeenCalled();
  });

  it("records a monitoring decision and closure through the backend", async () => {
    const user = userEvent.setup();
    render(<CoordinatorCaseRoute reportReference={report.reportReference} />);

    await user.click(await screen.findByRole("button", { name: "Start evidence assessment" }));
    await user.click(screen.getByLabelText("Yes — the evidence can be assessed"));
    await user.click(screen.getByLabelText("Yes — continue to a response decision"));
    await user.click(screen.getByLabelText("No matching report found"));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(mockedRecordEvidenceAssessment).toHaveBeenCalledWith(
      report.reportReference,
      expect.objectContaining({ evidenceUsable: true, observationCredible: true }),
    );
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

    expect(await screen.findByText("The case could not be loaded.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("heading", { name: "Review reef observation" })).toBeInTheDocument();
    expect(mockedGetCoordinatorCase).toHaveBeenCalledTimes(2);
  });
});
