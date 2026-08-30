import { apiRequest } from "./client";
import type {
  MyReportsFilters,
  MyReportsResult,
  ReportDetail,
  ReportSubmittedResult,
  ReportTimeline,
} from "./types";

// GET /api/v1/reports/mine
export async function getMyReports(filters: MyReportsFilters = {}): Promise<MyReportsResult> {
  const query = new URLSearchParams();
  if (filters.status) query.set("status", filters.status);
  if (filters.fromDate) query.set("fromDate", filters.fromDate);
  if (filters.toDate) query.set("toDate", filters.toDate);
  if (filters.page) query.set("page", String(filters.page));
  if (filters.pageSize) query.set("pageSize", String(filters.pageSize));

  const queryString = query.toString();
  return apiRequest<MyReportsResult>({
    path: `/api/v1/reports/mine${queryString ? `?${queryString}` : ""}`,
  });
}

// GET /api/v1/reports/{report_reference}
export async function getReportDetail(reportReference: string): Promise<ReportDetail> {
  return apiRequest<ReportDetail>({
    path: `/api/v1/reports/${encodeURIComponent(reportReference)}`,
  });
}

// GET /api/v1/reports/{report_reference}/timeline
export async function getReportTimeline(reportReference: string): Promise<ReportTimeline> {
  return apiRequest<ReportTimeline>({
    path: `/api/v1/reports/${encodeURIComponent(reportReference)}/timeline`,
  });
}

// POST /api/v1/reports — multipart/form-data with a JSON `payload` field and
// one or more `photos` files. Not called from any page yet: the multi-step
// report form (Epic 2) that would collect `payload`'s contents is still a
// placeholder, and this must never fire from just loading a page — it's a
// real, mutating request against the live backend. Kept here, typed and
// ready, for whoever wires that form up.
export async function submitReport(
  payload: Record<string, unknown>,
  photos: File[],
): Promise<ReportSubmittedResult> {
  const formData = new FormData();
  formData.set("payload", JSON.stringify(payload));
  for (const photo of photos) {
    formData.append("photos", photo);
  }

  return apiRequest<ReportSubmittedResult>({
    path: "/api/v1/reports",
    method: "POST",
    body: formData,
  });
}
