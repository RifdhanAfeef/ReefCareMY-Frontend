"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/features/epic-01-access/auth-context";
import styles from "./landing-page.module.css";

const threats = [
  { name: "Ghost fishing gear", code: "ghost_gear", icon: "/images/threats/ghost-fishing-gear-icon.png", text: "Lost nets, lines, traps or ropes affecting reef life." },
  { name: "Coral bleaching", code: "coral_bleaching", icon: "/images/threats/coral-bleaching-icon-v2.png", text: "Unusually pale or white coral across a colony or reef area." },
  { name: "Marine debris", code: "marine_debris", icon: "/images/threats/marine-debris-icon.png", text: "Human-made waste resting on or interacting with the reef." },
  { name: "Physical reef damage", code: "physical_reef_damage", icon: "/images/threats/physical-reef-damage-icon-v2.png", text: "Recently broken, crushed or scraped coral." },
] as const;

function ThreatIcon({ src }: { src: (typeof threats)[number]["icon"] }) {
  return (
    <span className={styles.threatIcon} aria-hidden="true">
      <Image src={src} alt="" width={40} height={40} />
    </span>
  );
}

export function LandingPage() {
  const { status, user } = useAuth();
  const signedIn = status === "authenticated";
  const signedInDestination = user?.role === "case_coordinator"
    ? { href: "/coordinator/report-queue", label: "Open report intake" }
    : user?.role === "system_administrator"
      ? { href: "/admin/users", label: "Manage users and access" }
      : { href: "/report-a-reef", label: "Start a reef report" };
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Community reef observation for Malaysia</p>
          <h1>Turn what you saw underwater into a useful reef report.</h1>
          <p className={styles.lead}>ReefCare MY helps divers and reef observers document potential threats, protect sensitive locations and follow what happens after submission without needing scientific expertise.</p>
          <div className={styles.heroControls}>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href="/learn">Learn what to report</Link>
              {signedIn ? (
                <Link className={styles.secondaryButton} href={signedInDestination.href}>{signedInDestination.label}</Link>
              ) : (
                <Link className={styles.secondaryButton} href="/register">Create observer account</Link>
              )}
            </div>
            {!signedIn && status !== "loading" && (
              <p className={styles.signInPrompt}>Already registered? <Link href="/login">Log in to start or continue a report</Link>.</p>
            )}
          </div>
        </div>
        <div className={styles.visualPanel}>
          <Image
            className={styles.reefPhoto}
            src="/images/reef-photo-2.jpg"
            alt="A comparison of bleached coral and a healthy colourful coral reef"
            width={1168}
            height={784}
            priority
            sizes="(max-width: 1060px) 90vw, 45vw"
          />
        </div>
      </section>

      <section className={styles.processSection} aria-labelledby="process-heading">
        <div className={styles.processIntro}><p className={styles.eyebrow}>A clear reporting journey</p><h2 id="process-heading">From observation to a traceable report</h2><p>You can learn without an account. Sign in as a Registered Observer to create, submit and track a report.</p></div>
        <ol className={styles.steps}>
          <li><span>1</span><div><h3>Check the guidance</h3><p>Choose the closest threat and observe without touching or disturbing the reef.</p></div></li>
          <li><span>2</span><div><h3>Record what you saw</h3><p>Add photographs, date and time, a short description and safe location details.</p></div></li>
          <li><span>3</span><div><h3>Submit and keep the reference</h3><p>Your report receives a traceable ID and enters the Case Coordinator queue.</p></div></li>
          <li><span>4</span><div><h3>Follow honest updates</h3><p>My Reports shows the status and recorded outcome without promising external action.</p></div></li>
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="threat-heading">
        <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Supported observations</p><h2 id="threat-heading">Four reef threats you can document</h2></div><Link className={styles.textLink} href="/learn">View responsible-reporting guidance <span aria-hidden="true">→</span></Link></div>
        <div className={styles.threatGrid}>{threats.map((threat) => <Link className={styles.threatCard} href={`/learn?threat=${threat.code}`} key={threat.name} aria-label={`View guidance for ${threat.name}`}><div className={styles.threatTitle}><ThreatIcon src={threat.icon} /><h3>{threat.name}</h3></div><p>{threat.text}</p><span className={styles.cardLink}>View guidance <span aria-hidden="true">→</span></span></Link>)}</div>
      </section>

    </div>
  );
}
