// Types below mirror the deployed API's schemas one-for-one (checked
// against https://reefcare-backend.vercel.app/openapi.json on 2026-08-30).
// There is no field-mapping layer anymore — these ARE the wire shapes.

export type UserRole = "observer" | "case_coordinator" | "system_administrator";

export type AuthUser = {
  id: number;
  displayName: string;
  role: UserRole;
};

// Matches AuthResponse — flat, accessToken/tokenType/expiresIn sit
// alongside `user`, not nested inside a "session" object.
export type AuthResult = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  displayName: string;
  password: string;
};

// Matches RegistrationResponse. No token — registering does not sign in.
export type RegisteredUser = {
  id: number;
  email: string;
  displayName: string;
  role: UserRole;
};

// case_status.code values (Iteration 1 set). Matches the CaseStatus enum.
export type ReportStatusCode =
  | "draft"
  | "submitted"
  | "received"
  | "claimed"
  | "under_review"
  | "needs_more_info"
  | "evidence_accepted"
  | "monitoring"
  | "referred"
  | "closed_no_action"
  | "closed_not_substantiated"
  | "closed_no_partner"
  | "closed_logged";

// Matches ObserverReportSummary (GET /reports/mine item shape).
export type ReportSummary = {
  reportReference: string;
  threatCategory: string;
  generalLocation: string;
  status: ReportStatusCode;
  statusLabel: string;
  outcome: string | null;
  submittedAt: string;
};

export type MyReportsFilters = {
  status?: ReportStatusCode;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
};

// Matches ObserverReportListResponse.
export type MyReportsResult = {
  items: ReportSummary[];
  page: number;
  pageSize: number;
  total: number;
};

// Matches ObserverLocationResponse.
export type ReportPreciseLocation = {
  latitude: number | null;
  longitude: number | null;
  uncertaintyMetres: number | null;
  confidenceLabel: string | null;
  sourceLabel: string | null;
  relocationNotes: string | null;
};

// Matches ObserverClosureSummary.
export type ReportClosureSummary = {
  status: ReportStatusCode;
  closureLabel: string;
  publicNote: string | null;
};

// Matches ObserverReportDetailResponse (GET /reports/{reportReference}).
export type ReportDetail = {
  reportReference: string;
  threatCategory: string;
  description: string;
  observedAt: string;
  estimatedDepthMetres: number | null;
  generalLocation: string;
  diveSite: string | null;
  preciseLocation: ReportPreciseLocation | null;
  status: ReportStatusCode;
  statusLabel: string;
  outcome: string | null;
  informationRequestReason: string | null;
  closure: ReportClosureSummary | null;
  submittedAt: string;
};

// Matches ObserverTimelineEvent / ObserverTimelineResponse.
export type ReportTimelineEvent = {
  statusLabel: string;
  occurredAt: string;
};

export type ReportTimeline = {
  reportReference: string;
  timeline: ReportTimelineEvent[];
};

// Matches ReportSubmittedResponse (POST /reports). Notably has no
// threatCategory or statusLabel — the caller already has the former from
// its own form state, and the latter isn't part of this particular
// response.
export type ReportSubmittedResult = {
  reportReference: string;
  status: string;
  submittedAt: string;
  generalLocation: string;
};
