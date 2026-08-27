import styles from "./page-template.module.css";

type PageTemplateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function PageTemplate({
  eyebrow,
  title,
  description,
  children,
}: PageTemplateProps) {
  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <section className={styles.workspace} aria-label={`${title} content area`}>
        {children ?? (
          <p>
            Replace this workspace with the approved wireframe content for this
            route.
          </p>
        )}
      </section>
    </div>
  );
}
