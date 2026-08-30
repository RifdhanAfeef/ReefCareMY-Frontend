"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { cases as initialCases, currentCoordinatorName } from "@/features/epic-01-access/mock-data";
import type {
  CaseActivity,
  CaseRecord,
  LocationConfidenceCode,
} from "@/features/epic-01-access/types";
import type { ReportDraft, SubmissionSummary } from "@/features/epic-02-reporting/types";
import { getThreatCategory } from "@/features/epic-02-reporting/threat-data";
import { formatDateTime } from "@/lib/format/date";

export type LocationFlowStep =
  | "session"
  | "create"
  | "location"
  | "confirm"
  | "privacy"
  | "saved";

export type DiveSession = {
  id: string;
  backendId: number | null;
  namedDiveSiteId: number;
  site: string;
  label?: string;
  date?: string;
  start?: string;
  end?: string;
  notes?: string;
};

export type MapPin = {
  x: number;
  y: number;
  latitude: number;
  longitude: number;
};

export type LocationDraft = {
  step: LocationFlowStep;
  sessions: DiveSession[];
  selectedSessionId: string;
  form: {
    site: string;
    label: string;
    date: string;
    start: string;
    end: string;
    notes: string;
  };
  pin: MapPin | null;
  locationSource: "dive_site" | "map_pin";
  confidence: LocationConfidenceCode | "";
};

const seedSessions: DiveSession[] = [
  {
    id: "tiger-reef-dive-2",
    backendId: 1,
    namedDiveSiteId: 1,
    site: "Tiger Reef, Tioman",
    label: "Dive 2",
    date: "26/08/2026",
    start: "2:35 PM",
    end: "3:25 PM",
  },
  {
    id: "renggis-dive-1",
    backendId: 2,
    namedDiveSiteId: 2,
    site: "Renggis Island, Tioman",
    label: "Dive 1",
    date: "26/08/2026",
    start: "9:10 AM",
    end: "10:00 AM",
  },
];

export const initialLocationDraft: LocationDraft = {
  step: "session",
  sessions: seedSessions,
  selectedSessionId: seedSessions[0].id,
  form: { site: "", label: "", date: "", start: "", end: "", notes: "" },
  pin: null,
  locationSource: "dive_site",
  confidence: "",
};

export const initialReportDraft: ReportDraft = {
  threatCategoryCode: "",
  observationDate: "",
  observationTime: "",
  estimatedDepthMetres: "",
  description: "",
  photos: [],
  lastSavedAt: null,
};

type AppStateContextValue = {
  cases: CaseRecord[];
  currentCoordinator: string;
  isObserverAuthenticated: boolean;
  locationDraft: LocationDraft;
  reportDraft: ReportDraft;
  lastSubmission: SubmissionSummary | null;
  findCase: (reportReference: string) => CaseRecord | undefined;
  claimCase: (reportReference: string) => boolean;
  updateCase: (
    reportReference: string,
    changes: Partial<CaseRecord>,
    activity?: Omit<CaseActivity, "id">,
  ) => void;
  updateLocationDraft: (changes: Partial<LocationDraft>) => void;
  updateReportDraft: (changes: Partial<ReportDraft>) => void;
  saveReportDraft: () => void;
  resetReportDraft: () => void;
  submitReport: () => SubmissionSummary | null;
  resetPrototypeData: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);
const storageKey = "reefcare-my-iteration-1-mock-state-v4";

export function MockAppStateProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<CaseRecord[]>(initialCases);
  const [locationDraft, setLocationDraft] = useState<LocationDraft>(initialLocationDraft);
  const [reportDraft, setReportDraft] = useState<ReportDraft>(initialReportDraft);
  const [lastSubmission, setLastSubmission] = useState<SubmissionSummary | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let storedCases: CaseRecord[] | undefined;
    let storedLocationDraft: LocationDraft | undefined;
    let storedReportDraft: ReportDraft | undefined;
    let storedLastSubmission: SubmissionSummary | null | undefined;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          cases?: CaseRecord[];
          locationDraft?: LocationDraft;
          reportDraft?: ReportDraft;
          lastSubmission?: SubmissionSummary | null;
        };
        if (Array.isArray(parsed.cases)) storedCases = parsed.cases;
        if (parsed.locationDraft) storedLocationDraft = parsed.locationDraft;
        if (parsed.reportDraft) storedReportDraft = parsed.reportDraft;
        if (parsed.lastSubmission !== undefined) storedLastSubmission = parsed.lastSubmission;
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
    const restoreTimer = window.setTimeout(() => {
      if (storedCases) setCases(storedCases);
      if (storedLocationDraft) setLocationDraft(storedLocationDraft);
      if (storedReportDraft) setReportDraft(storedReportDraft);
      if (storedLastSubmission !== undefined) setLastSubmission(storedLastSubmission);
      setRestored(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!restored) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ cases, locationDraft, reportDraft, lastSubmission }));
  }, [cases, locationDraft, reportDraft, lastSubmission, restored]);

  const findCase = useCallback(
    (reportReference: string) =>
      cases.find(
        (item) =>
          item.reportReference.toLowerCase() === reportReference.toLowerCase(),
      ),
    [cases],
  );

  const updateCase = useCallback<AppStateContextValue["updateCase"]>(
    (reportReference, changes, activity) => {
      setCases((current) =>
        current.map((item) => {
          if (item.reportReference !== reportReference) return item;
          return {
            ...item,
            ...changes,
            activity: activity
              ? [
                  ...item.activity,
                  {
                    ...activity,
                    id: `ACT-${reportReference}-${Date.now()}`,
                  },
                ]
              : item.activity,
          };
        }),
      );
    },
    [],
  );

  const claimCase = useCallback(
    (reportReference: string) => {
      const record = cases.find((item) => item.reportReference === reportReference);
      if (!record || record.owner) return false;
      const claimedAt = formatDateTime();
      updateCase(
        reportReference,
        {
          owner: currentCoordinatorName,
          claimedAt,
          statusCode: "claimed",
          statusLabel: "Claimed",
        },
        { action: "Case claimed", actor: currentCoordinatorName, timestamp: claimedAt },
      );
      return true;
    },
    [cases, updateCase],
  );

  const updateLocationDraft = useCallback((changes: Partial<LocationDraft>) => {
    setLocationDraft((current) => ({ ...current, ...changes }));
  }, []);

  const updateReportDraft = useCallback((changes: Partial<ReportDraft>) => {
    setReportDraft((current) => ({ ...current, ...changes }));
  }, []);

  const saveReportDraft = useCallback(() => {
    setReportDraft((current) => ({ ...current, lastSavedAt: formatDateTime() }));
  }, []);

  const resetReportDraft = useCallback(() => {
    setReportDraft(initialReportDraft);
    setLocationDraft(initialLocationDraft);
    setLastSubmission(null);
  }, []);

  const submitReport = useCallback(() => {
    const threat = getThreatCategory(reportDraft.threatCategoryCode);
    const session = locationDraft.sessions.find((item) => item.id === locationDraft.selectedSessionId);
    if (!threat || !session || !reportDraft.observationDate || !reportDraft.observationTime || !reportDraft.description.trim() || reportDraft.photos.length === 0 || !locationDraft.confidence) return null;

    const nextNumber = Math.max(0, ...cases.map((item) => Number(item.reportReference.replace(/\D/g, "")) || 0)) + 1;
    const reportReference = `RC-${String(nextNumber).padStart(4, "0")}`;
    const submittedAt = formatDateTime();
    const exactLocation = locationDraft.pin
      ? `${locationDraft.pin.latitude.toFixed(5)}, ${locationDraft.pin.longitude.toFixed(5)}`
      : null;
    const summary: SubmissionSummary = {
      reportReference,
      threatLabel: threat.label,
      generalLocation: session.site,
      submittedAt,
      statusCode: "received",
      statusLabel: "Received",
    };
    const record: CaseRecord = {
      reportReference,
      threat: threat.label,
      generalLocation: session.site,
      exactLocation,
      locationConfidenceCode: locationDraft.confidence,
      statusCode: "received",
      statusLabel: "Received",
      submittedAt,
      submittedBy: "Aisha Rahman",
      observedAt: `${reportDraft.observationDate}, ${reportDraft.observationTime}`,
      estimatedDepth: reportDraft.estimatedDepthMetres ? `${reportDraft.estimatedDepthMetres} m` : "Not provided",
      description: reportDraft.description.trim(),
      owner: null,
      claimedAt: null,
      activity: [{ id: `ACT-${reportReference}-RECEIVED`, action: "Report received", actor: "Aisha Rahman", timestamp: submittedAt }],
    };
    setCases((current) => [...current, record]);
    setLastSubmission(summary);
    setReportDraft(initialReportDraft);
    setLocationDraft(initialLocationDraft);
    return summary;
  }, [cases, locationDraft, reportDraft]);

  const resetPrototypeData = useCallback(() => {
    setCases(initialCases);
    setLocationDraft(initialLocationDraft);
    setReportDraft(initialReportDraft);
    setLastSubmission(null);
    window.localStorage.removeItem(storageKey);
  }, []);

  const value = useMemo<AppStateContextValue>(
    () => ({
      cases,
      currentCoordinator: currentCoordinatorName,
      isObserverAuthenticated: true,
      locationDraft,
      reportDraft,
      lastSubmission,
      findCase,
      claimCase,
      updateCase,
      updateLocationDraft,
      updateReportDraft,
      saveReportDraft,
      resetReportDraft,
      submitReport,
      resetPrototypeData,
    }),
    [cases, locationDraft, reportDraft, lastSubmission, findCase, claimCase, updateCase, updateLocationDraft, updateReportDraft, saveReportDraft, resetReportDraft, submitReport, resetPrototypeData],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useMockAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useMockAppState must be used within MockAppStateProvider");
  }
  return context;
}
