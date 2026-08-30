"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { DisplayDateInput } from "@/components/forms/display-date-input";
import { BackButton } from "@/components/navigation/back-button";
import type { LocationConfidenceCode } from "@/features/epic-01-access/types";
import { useMockAppState, type DiveSession, type MapPin } from "@/features/shared/mock-app-state";
import { createDiveSession, getDiveSessions } from "@/lib/api/diveSessionsApi";
import { getDiveSites } from "@/lib/api/referenceApi";
import type { DiveSiteReference } from "@/lib/api/types";
import { displayDateAndTimeToIso, displayDateToIsoDate, inputDateToDisplayValue, isFutureDisplayDate, isValidDisplayDate } from "@/lib/format/date";
import styles from "./location-flow.module.css";

const confidenceOptions: Array<{ value: LocationConfidenceCode; label: string }> = [
  { value: "exact", label: "Exact" },
  { value: "within_100m", label: "Within approximately 100 m" },
  { value: "within_1km", label: "Within approximately 1 km" },
  { value: "dive_site_only", label: "Dive-site only" },
  { value: "unsure", label: "Unsure" },
];

const malaysiaBounds = {
  west: 99.2,
  east: 119.6,
  south: 0.5,
  north: 7.7,
};

const MalaysiaMap = dynamic(
  () => import("./malaysia-map").then((module) => module.MalaysiaMap),
  {
    ssr: false,
    loading: () => <div className={styles.mapLoading}>Loading map…</div>,
  },
);

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className={styles.heading}><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1><p>{description}</p></header>;
}

function pinFromPercent(x: number, y: number): MapPin {
  return {
    x,
    y,
    latitude: malaysiaBounds.north - (y / 100) * (malaysiaBounds.north - malaysiaBounds.south),
    longitude: malaysiaBounds.west + (x / 100) * (malaysiaBounds.east - malaysiaBounds.west),
  };
}

function normalisePin(pin: MapPin | null) {
  if (!pin) return null;
  if (Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude)) return pin;
  return pinFromPercent(pin.x, pin.y);
}

function mapCoordinates(pin: MapPin | null) {
  if (!pin) return null;
  const resolved = normalisePin(pin);
  return resolved ? `${resolved.latitude.toFixed(5)}, ${resolved.longitude.toFixed(5)}` : null;
}

function MapPreview({ pin, interactive = false, onSetPin }: { pin: MapPin | null; interactive?: boolean; onSetPin?: (pin: MapPin) => void }) {
  const resolvedPin = normalisePin(pin);
  return <MalaysiaMap pin={resolvedPin} interactive={interactive} onSetPin={onSetPin} />;
}

export function LocationFlow() {
  const { locationDraft, updateLocationDraft } = useMockAppState();
  const { step, sessions, selectedSessionId, form, pin, locationSource, confidence } = locationDraft;
  const [sessionError, setSessionError] = useState("");
  const [dateError, setDateError] = useState("");
  const [confidenceError, setConfidenceError] = useState("");
  const [diveSites, setDiveSites] = useState<DiveSiteReference[]>([]);
  const [referenceError, setReferenceError] = useState("");
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [savingSession, setSavingSession] = useState(false);
  const initiallySelectedSessionId = useRef(selectedSessionId);
  const session = useMemo(() => sessions.find((item) => item.id === selectedSessionId) ?? sessions[0], [selectedSessionId, sessions]);
  const sessionTitle = session ? `${session.site}${session.label ? ` - ${session.label}` : ""}` : "No Dive Session selected";
  const confidenceLabel = confidenceOptions.find((item) => item.value === confidence)?.label ?? "Not provided";
  const coordinates = mapCoordinates(pin);
  const availableConfidenceOptions = locationSource === "map_pin"
    ? confidenceOptions.filter((item) => item.value !== "dive_site_only")
    : confidenceOptions.filter((item) => item.value === "dive_site_only");
  const setStep = (nextStep: typeof step) => updateLocationDraft({ step: nextStep });
  const updateForm = (changes: Partial<typeof form>) => updateLocationDraft({ form: { ...form, ...changes } });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDiveSites(), getDiveSessions()])
      .then(([sites, backendSessions]) => {
        if (cancelled) return;
        const nextSessions: DiveSession[] = backendSessions.map((item) => ({
          id: `backend-session-${item.diveSessionId}`,
          backendId: item.diveSessionId,
          namedDiveSiteId: item.namedDiveSite.diveSiteId,
          site: `${item.namedDiveSite.name} — ${item.namedDiveSite.publicAreaLabel}`,
          label: item.label,
          date: inputDateToDisplayValue(item.diveDate),
          start: item.approximateStartTime ? new Date(item.approximateStartTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
          end: item.approximateEndTime ? new Date(item.approximateEndTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : undefined,
        }));
        setDiveSites(sites);
        updateLocationDraft({
          sessions: nextSessions,
          selectedSessionId: nextSessions.some((item) => item.id === initiallySelectedSessionId.current)
            ? initiallySelectedSessionId.current
            : (nextSessions[0]?.id ?? ""),
        });
      })
      .catch(() => setReferenceError("Dive sites and sessions could not be loaded. Check the backend connection and try again."))
      .finally(() => {
        if (!cancelled) setLoadingReferences(false);
      });
    return () => {
      cancelled = true;
    };
  }, [updateLocationDraft]);

  const createSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.site.trim()) { setSessionError("Enter or select a named dive site."); return; }
    setSessionError("");
    if (!isValidDisplayDate(form.date)) { setDateError("Enter the date in dd/mm/yyyy format, for example 26/08/2026."); return; }
    if (isFutureDisplayDate(form.date)) { setDateError("Dive date cannot be in the future."); return; }
    if (form.start && form.end && form.end <= form.start) { setDateError("Approximate end time must be after the start time."); return; }
    const selectedSite = diveSites.find((item) => String(item.diveSiteId) === form.site);
    if (!selectedSite) { setSessionError("Select a named dive site from the list."); return; }
    setSavingSession(true);
    try {
      const created = await createDiveSession({
        namedDiveSiteId: selectedSite.diveSiteId,
        diveDate: displayDateToIsoDate(form.date),
        ...(form.label.trim() ? { label: form.label.trim() } : {}),
        ...(form.start ? { approximateStartTime: displayDateAndTimeToIso(form.date, form.start) } : {}),
        ...(form.end ? { approximateEndTime: displayDateAndTimeToIso(form.date, form.end) } : {}),
      });
      const next: DiveSession = { id: `backend-session-${created.diveSessionId}`, backendId: created.diveSessionId, namedDiveSiteId: created.namedDiveSite.diveSiteId, site: `${created.namedDiveSite.name} — ${created.namedDiveSite.publicAreaLabel}`, label: created.label, date: inputDateToDisplayValue(created.diveDate), start: form.start || undefined, end: form.end || undefined };
      updateLocationDraft({ sessions: [...sessions, next], selectedSessionId: next.id, step: "location" });
      setSessionError("");
      setDateError("");
    } catch (error) {
      setSessionError(error instanceof Error ? error.message : "The Dive Session could not be created.");
    } finally {
      setSavingSession(false);
    }
  };
  const continueFromLocation = (source: "dive_site" | "map_pin") => {
    updateLocationDraft({ locationSource: source, pin: source === "dive_site" ? null : pin, confidence: source === "dive_site" ? "dive_site_only" : "", step: "confirm" });
    setConfidenceError("");
  };
  const confirmLocation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!confidence) { setConfidenceError("Select a location-confidence option before continuing."); return; }
    setConfidenceError(""); setStep("privacy");
  };

  if (step === "create") return <section className={styles.page}>
    <PageHeading eyebrow="Report a Reef / Dive details" title="Add a Dive Session" description="Enter the dive site, then add the date, dive number or approximate times if known." />
    <form className={styles.formLayout} onSubmit={createSession} noValidate>
      <section className={styles.card}><h2>Session details</h2><div className={styles.formGrid}>
        <label className={styles.field}>Named dive site *<span>Select from ReefCare&apos;s approved site list</span><select value={form.site} disabled={loadingReferences || diveSites.length === 0} onChange={(event) => { updateForm({ site: event.target.value }); setSessionError(""); }} aria-invalid={Boolean(sessionError)} aria-describedby={sessionError ? "site-error" : undefined}><option value="">{loadingReferences ? "Loading dive sites…" : "Select a dive site"}</option>{diveSites.map((site) => <option value={site.diveSiteId} key={site.diveSiteId}>{site.name} — {site.publicAreaLabel}</option>)}</select></label>
        <label className={styles.field}>Session label / dive number <span>Optional</span><input value={form.label} onChange={(event) => updateForm({ label: event.target.value })} placeholder="Dive 2" /></label>
        <div className={styles.field}>Dive date *<span>Required by the backend — dd/mm/yyyy</span><DisplayDateInput label="Dive date" required value={form.date} onChange={(value) => { updateForm({ date: value }); setDateError(""); }} invalid={Boolean(dateError)} describedBy={dateError ? "date-error" : undefined} /></div>
        <div className={styles.timeFields}><label className={styles.field}>Approximate start <span>Optional</span><input type="time" value={form.start} onChange={(event) => updateForm({ start: event.target.value })} /></label><label className={styles.field}>Approximate end <span>Optional</span><input type="time" value={form.end} onChange={(event) => updateForm({ end: event.target.value })} /></label></div>
      </div>{referenceError && <p className={styles.errorText} role="alert">{referenceError}</p>}{sessionError && <p className={styles.errorText} id="site-error" role="alert">{sessionError}</p>}{dateError && <p className={styles.errorText} id="date-error" role="alert">{dateError}</p>}<p className={styles.supporting}>A named dive site and dive date are required by the current backend contract. The session label and approximate times are optional.</p><div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStep("session")}>Back</button><button className={styles.primaryButton} type="submit" disabled={savingSession || loadingReferences}>{savingSession ? "Saving…" : "Save session"}</button></div></section>
    </form>
  </section>;

  if (!session && step !== "session") return <section className={styles.page}><PageHeading eyebrow="Report a Reef / Dive details" title="Choose a Dive Session first" description="A backend Dive Session is required before location details can be added." /><section className={styles.card}>{referenceError && <p className={styles.errorText} role="alert">{referenceError}</p>}<button className={styles.primaryButton} type="button" onClick={() => setStep("session")}>Return to Dive Sessions</button></section></section>;

  if (step === "location") return <section className={styles.page}>
    <PageHeading eyebrow="Report a Reef / Location" title="Where on the reef did you observe it?" description="Use the Dive Session location, or add an optional map pin for a more precise position." />
    <div className={styles.choiceGrid}><section className={`${styles.card} ${styles.selectedCard}`}><h2>General location from Dive Session</h2><label className={styles.field}>Named dive site *<select value={session.site} disabled><option>{session.site}</option></select></label><div className={styles.infoBox}><strong>Baseline location</strong><p>The report can continue with the named dive site even when exact coordinates are unknown.</p></div><button className={styles.primaryButton} type="button" onClick={() => continueFromLocation("dive_site")}>Use dive-site location</button></section>
      <section className={styles.card}><h2>Optional map pin</h2><p className={styles.supporting}>Select the observed location on the map of Malaysia. The map pin records latitude and longitude for authorised views.</p><MapPreview pin={pin} interactive onSetPin={(nextPin) => updateLocationDraft({ pin: nextPin })} />{coordinates && <p className={styles.coordinateReadout}>Selected coordinates: {coordinates}</p>}<button className={styles.secondaryButton} type="button" disabled={!pin} onClick={() => continueFromLocation("map_pin")}>Confirm map pin</button></section></div>
    <aside className={styles.privacyStrip}><strong>Coordinates are optional</strong><p>Coordinates are stored only when you provide a map pin. Other users receive only the appropriate general-location view.</p></aside><button className={`${styles.secondaryButton} ${styles.backOutside}`} type="button" onClick={() => setStep("session")}>Back to Dive Session</button>
  </section>;

  if (step === "confirm") return <section className={styles.page}>
    <PageHeading eyebrow="Report a Reef / Location" title="Confirm the map location" description="Check the location and choose the option that best describes its accuracy." />
    <form className={styles.confirmGrid} onSubmit={confirmLocation}><section className={styles.card}><h2>{session.site}</h2><MapPreview pin={pin} /><p className={styles.mapCaption}>{locationSource === "map_pin" ? `Selected map pin${coordinates ? ` — ${coordinates}` : ""}` : "Named dive-site location only"}</p></section><aside className={styles.card}><fieldset className={styles.confidenceList}><legend>Location confidence</legend>{availableConfidenceOptions.map((item) => <label key={item.value}><input type="radio" name="confidence" value={item.value} checked={confidence === item.value} onChange={() => updateLocationDraft({ confidence: item.value })} />{item.label}</label>)}</fieldset><p className={styles.supporting}>{locationSource === "map_pin" ? "Choose how closely the pin represents the observed location." : "Without a map pin, the backend-compatible confidence is Dive-site only."}</p>{confidenceError && <p className={styles.errorText} role="alert">{confidenceError}</p>}<div className={styles.actions}><button className={styles.secondaryButton} type="button" onClick={() => setStep("location")}>Back</button><button className={styles.primaryButton} type="submit">Confirm location</button></div></aside></form>
  </section>;

  if (step === "privacy") return <section className={styles.page}>
    <PageHeading eyebrow="Report a Reef / Location privacy" title="Review your location privacy" description="See how ReefCare protects the precise location you submitted." />
    <div className={styles.privacyGrid}><section className={styles.card}><h2>Your submitted location</h2><MapPreview pin={pin} /><p><strong>{locationSource === "map_pin" ? `Map pin within ${session.site}` : session.site}</strong></p><p>Confidence: <strong>{confidenceLabel}</strong></p><p className={styles.supporting}>You will see this location in your own report.</p></section><section className={`${styles.card} ${styles.sidePanel}`}><h2>Who can see what?</h2><dl className={styles.accessList}><div><dt>You</dt><dd>Your submitted location</dd></div><div><dt>Claiming Case Coordinator</dt><dd>Your location and accuracy</dd></div><div><dt>Other coordinators</dt><dd>General site until they claim the case</dd></div><div><dt>System Administrator</dt><dd>General site only</dd></div><div><dt>Unauthenticated visitors</dt><dd>Report location is not displayed</dd></div></dl></section></div>
    <div className={styles.splitActions}><button className={styles.secondaryButton} type="button" onClick={() => setStep("confirm")}>Back</button><button className={styles.primaryButton} type="button" onClick={() => setStep("saved")}>Confirm privacy and continue</button></div>
  </section>;

  if (step === "saved") return <section className={styles.page}>
    <PageHeading eyebrow="Report a Reef / Location" title="Location saved to your draft" description="Review the Dive Session, map pin and location accuracy saved with this report draft." />
    <div className={styles.savedGrid}><section className={styles.card}><h2>Current report draft</h2><p className={styles.supporting}>The backend will create the report reference after final submission.</p><div className={styles.savedContent}><MapPreview pin={pin} /><dl className={styles.detailList}><div><dt>Dive Session</dt><dd>{sessionTitle}</dd></div><div><dt>Location source</dt><dd>{locationSource === "map_pin" ? "Map pin" : "Named dive site"}</dd></div><div><dt>Location confidence</dt><dd>{confidenceLabel}</dd></div>{coordinates && <div><dt>Selected coordinates</dt><dd>{coordinates}</dd></div>}</dl></div></section><aside className={styles.sidePanel}><h2>Privacy reminder</h2><p>Exact submitted coordinates are visible only to you and the Case Coordinator who claims the case.</p><div className={styles.purpleBox}><strong>General site</strong><p>{session.site} is retained as the restricted location view.</p></div></aside></div>
    <div className={styles.splitActions}><button className={styles.secondaryButton} type="button" onClick={() => setStep("privacy")}>Back</button><Link className={styles.primaryButton} href="/report-a-reef/review">Continue to review</Link></div>
  </section>;

  return <section className={styles.page}>
    <BackButton fallbackHref="/report-a-reef" label="Back to report form" />
    <PageHeading eyebrow="Report a Reef / Dive details" title="Which dive was this observation from?" description="Select a recent dive or add a new Dive Session with a named site and dive date." />
    <div className={styles.choiceGrid}><section className={`${styles.card} ${styles.selectedCard}`}><h2>Use an existing Dive Session</h2><p className={styles.supporting}>Choose a recent session connected to this report.</p>{referenceError && <p className={styles.errorText} role="alert">{referenceError}</p>}<fieldset className={styles.sessionList}><legend className="sr-only">Recent Dive Sessions</legend>{loadingReferences && <p>Loading Dive Sessions…</p>}{!loadingReferences && sessions.length === 0 && <p>No existing Dive Sessions were found. Create one to continue.</p>}{sessions.map((item) => <label className={styles.sessionOption} key={item.id}><input type="radio" name="dive-session" value={item.id} checked={selectedSessionId === item.id} onChange={() => updateLocationDraft({ selectedSessionId: item.id })} /><span><strong>{item.site}{item.label ? ` - ${item.label}` : ""}</strong><small>{[item.date, item.start && item.end ? `${item.start} to ${item.end}` : item.start].filter(Boolean).join(" - ") || "Optional details not provided"}</small></span></label>)}</fieldset><button className={styles.primaryButton} type="button" disabled={!session || loadingReferences} onClick={() => setStep("location")}>Use selected session</button></section>
      <section className={styles.card}><h2>Create a new Dive Session</h2><p className={styles.supporting}>Use this when the observation is not linked to an existing session.</p><div className={styles.requirementGroup}><h3>Required by the backend</h3><p><span aria-hidden="true">✓</span> Named dive site</p><p><span aria-hidden="true">✓</span> Dive date</p></div><div className={styles.requirementGroup}><h3>Optional details</h3><p><span aria-hidden="true">□</span> Session label or dive number</p><p><span aria-hidden="true">□</span> Approximate start and end times</p></div><button className={styles.secondaryButton} type="button" onClick={() => setStep("create")}>Create Dive Session</button></section></div>
    <aside className={styles.infoPanel}><strong>Why add a Dive Session?</strong><p>It keeps observations, photographs and location details from the same dive together.</p></aside>
  </section>;
}

export function ReviewLocationSummary() {
  const { locationDraft } = useMockAppState();
  const session = locationDraft.sessions.find((item) => item.id === locationDraft.selectedSessionId);
  const confidenceLabel = confidenceOptions.find((item) => item.value === locationDraft.confidence)?.label;
  const coordinates = mapCoordinates(locationDraft.pin);
  return <section className={styles.card} aria-labelledby="review-location-heading"><h2 id="review-location-heading">Dive Session and location</h2><dl className={styles.detailList}><div><dt>Named dive site</dt><dd>{session?.site ?? "Not yet selected"}</dd></div><div><dt>Location source</dt><dd>{locationDraft.locationSource === "map_pin" ? "Optional map pin" : "Named dive site"}</dd></div><div><dt>Location confidence</dt><dd>{confidenceLabel ?? "Not yet selected"}</dd></div>{coordinates && <div><dt>Selected coordinates</dt><dd>{coordinates}</dd></div>}</dl><Link className={styles.secondaryButton} href="/report-a-reef/location">Edit location</Link></section>;
}
