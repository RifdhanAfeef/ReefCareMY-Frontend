import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApiError } from "@/lib/api/client";
import { readRememberedClaims, rememberClaimedCase } from "@/lib/api/claimed-case-store";
import * as coordinatorApi from "@/lib/api/coordinatorApi";
import type { CoordinatorCase } from "@/lib/api/types";
import { MyCasesWorkspace } from "../my-cases-workspace";

vi.mock("@/lib/api/coordinatorApi");
const mockedGetCoordinatorCase = vi.mocked(coordinatorApi.getCoordinatorCase);

const owner = { id: 8, displayName: "Current Coordinator" };
const report: CoordinatorCase = {
  reportReference: "RC-3001",
  observerId: 14,
  threat: "Marine debris",
  description: "Discarded material is resting on the reef.",
  observedAt: "2026-09-03T04:15:00Z",
  estimatedDepthMetres: 8,
  area: "Redang Island",
  preciseLocation: null,
  statusCode: "claimed",
  statusLabel: "Claimed",
  submittedAt: "2026-09-03T05:00:00Z",
  owner,
  evidence: [],
};

function signIn() {
  window.localStorage.setItem("reefcare.auth", JSON.stringify({
    accessToken: "coordinator-token",
    user: { ...owner, role: "case_coordinator" },
  }));
}

function rememberReport() {
  rememberClaimedCase({
    reportReference: report.reportReference,
    owner,
    statusCode: "claimed",
    statusLabel: "Claimed",
    claimedAt: "2026-09-04T01:00:00Z",
  });
}

beforeEach(() => {
  window.localStorage.clear();
  mockedGetCoordinatorCase.mockReset();
  signIn();
});

describe("Coordinator My Cases workspace", () => {
  it("loads remembered claims through the current owned-case endpoint", async () => {
    rememberReport();
    mockedGetCoordinatorCase.mockResolvedValue(report);

    render(<MyCasesWorkspace />);

    expect(await screen.findByText("RC-3001")).toBeInTheDocument();
    expect(screen.getByText("Marine debris")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open case" })).toHaveAttribute(
      "href",
      "/coordinator/reports/RC-3001",
    );
    expect(mockedGetCoordinatorCase).toHaveBeenCalledWith("RC-3001");
  });

  it("removes a saved reference when the backend says it is no longer accessible", async () => {
    rememberReport();
    mockedGetCoordinatorCase.mockRejectedValue(new ApiError("You do not own this report.", 403));

    render(<MyCasesWorkspace />);

    expect(await screen.findByText("No accessible claimed cases")).toBeInTheDocument();
    expect(readRememberedClaims()).toEqual([]);
  });

  it("keeps saved references when the backend is temporarily unavailable", async () => {
    rememberReport();
    mockedGetCoordinatorCase.mockRejectedValue(new ApiError("Service unavailable.", 503));

    render(<MyCasesWorkspace />);

    expect(await screen.findByText("Some cases could not be checked")).toBeInTheDocument();
    expect(readRememberedClaims()).toHaveLength(1);
  });
});
