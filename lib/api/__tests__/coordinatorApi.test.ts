import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "../client";
import {
  claimReport,
  closeCase,
  getCoordinatorCase,
  getCoordinatorQueue,
  recordCaseDecision,
  requestMoreInformation,
} from "../coordinatorApi";

vi.mock("../client");
const mockedApiRequest = vi.mocked(client.apiRequest);

beforeEach(() => {
  mockedApiRequest.mockReset();
  mockedApiRequest.mockResolvedValue({} as never);
});

describe("coordinator API contract", () => {
  it("uses public report references for queue, claim and case detail", async () => {
    await getCoordinatorQueue();
    await claimReport("RC-0241");
    await getCoordinatorCase("RC-0241");
    expect(mockedApiRequest.mock.calls.map(([request]) => request.path)).toEqual([
      "/api/v1/coordinator/queue?page=1&pageSize=20",
      "/api/v1/coordinator/reports/RC-0241/claim",
      "/api/v1/coordinator/reports/RC-0241",
    ]);
  });

  it("uses the documented information, decision and closure bodies", async () => {
    await requestMoreInformation("RC-0002", "Please confirm the approximate size.");
    await recordCaseDecision("RC-0002", {
      responseType: "refer_or_share",
      referredTo: "Marine Park Department",
    });
    await closeCase("RC-0002", {
      closureReasonCode: "referred_other_org",
      publicClosureNote: "Shared for consideration.",
      referredTo: "Marine Park Department",
    });

    expect(mockedApiRequest.mock.calls.map(([request]) => request.body)).toEqual([
      { reason: "Please confirm the approximate size." },
      { responseType: "refer_or_share", referredTo: "Marine Park Department" },
      {
        closureReasonCode: "referred_other_org",
        publicClosureNote: "Shared for consideration.",
        referredTo: "Marine Park Department",
      },
    ]);
  });
});
