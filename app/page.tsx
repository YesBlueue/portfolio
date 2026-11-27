import Image from "next/image";
import type { CSSProperties } from "react";
import { Buckle } from "@/components/Buckle";
import { CardFit } from "@/components/CardFit";
import { CopyEmail } from "@/components/CopyEmail";
import { Intro } from "@/components/Intro";
import { NavSpy } from "@/components/NavSpy";
import { Ordinals } from "@/components/Ordinals";
import { Journey } from "@/components/Journey";
import { Portrait } from "@/components/Portrait";
import { ReKnit } from "@/components/ReKnit";
import { Spool } from "@/components/Spool";
import { Zipper } from "@/components/Zipper";
import { journey, projects, site } from "@/lib/content";
import styles from "./page.module.css";

// Each project card gets its own cloth (the pocket) and thread color (the button, the
// chips and the links), in order. `x` is the thread sewing the button on.
const CLOTHS = [
  { fabric: "flannel", thread: "var(--rust)", x: "var(--cream)" },
  { fabric: "corduroy", thread: "var(--moss)", x: "var(--cream)" },
  { fabric: "tweed", thread: "var(--camel)", x: "var(--cream)" },
  { fabric: "twill", thread: "var(--wool-navy)", x: "var(--cream)" },
  { fabric: "gingham", thread: "var(--mustard)", x: "var(--cocoa)" },
  { fabric: "herringbone", thread: "var(--cocoa-soft)", x: "var(--cream)" },
];

/** The card's links: the first is the main one (filled), the rest are stitched outlines. */
type LinkIconName = "play" | "site" | "code";

function cardLinks(p: { kind: string; demo?: string; source?: string }) {
  // Games get played; everything else gets tried.
  const game = p.kind === "Game";
  return [
    p.demo && { href: p.demo, label: game ? "Play it" : "Try it", icon: (game ? "play" : "site") as LinkIconName },
    p.source && { href: p.source, label: "Source", icon: "code" as LinkIconName },
  ].filter((l): l is { href: string; label: string; icon: LinkIconName } => !!l);
}

function LinkIcon({ icon }: { icon: LinkIconName }) {
  if (icon === "site")
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect x="2" y="3" width="12" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M2 6.2h12" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="4.3" cy="4.6" r=".7" fill="currentColor" />
      </svg>
    );
  return icon === "play" ? (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5 3.5v9l7.5-4.5z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <Intro />
      <Zipper />
      <Spool />
      {/* The nav is a belt; its buckle is the logo and takes you back to the top. */}
      <nav className={styles.nav} aria-label="Main" data-nav="">
        <div className={`inner ${styles.navInner}`}>
          <a className={styles.mark} href="#top" aria-label={`${site.name}, back to top`}>
            <Buckle className={styles.buckle} />
          </a>
          <ul>
            {[
              ["projects", "Projects"],
              ["about", "About"],
              ["journey", "Journey"],
              ["contact", "Contact"],
            ].map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`}>
                  <span className={styles.hole} aria-hidden="true" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <NavSpy nav="[data-nav]" />
      </nav>

      <main>
        <header className={`${styles.hero} flannel`} id="top">
          <div className={`inner ${styles.heroInner}`}>
            <Portrait
              src={site.portrait.src}
              alt={`Portrait of ${site.name}`}
              caption={site.portrait.caption}
              note="psst, tug the tie"
            />
            <div className={styles.label}>
              <p className={styles.kicker}>{site.kicker}</p>
              <h1 className={styles.name}>{site.name}</h1>
              <p className={styles.lede}>{site.intro}</p>
              <div className={styles.actions}>
                <a className={`${styles.btn} ${styles.primary}`} href="#projects">
                  See my work
                </a>
                <a className={`${styles.btn} ${styles.ghost}`} href="#contact">
                  Say hi
                </a>
                <span className={styles.note} aria-hidden="true">
                  psst, tug the tie
                </span>
              </div>
            </div>
          </div>
        </header>

        <section className={`${styles.block} wool`} id="projects" aria-labelledby="projects-h">
          <div className="inner">
            <div className={styles.secHead}>
              <h2 id="projects-h">Projects</h2>
              <span>Things I&apos;ve built</span>
            </div>
            <div className={styles.cards} data-cards="">
              {projects.map((p, i) => {
                const cloth = CLOTHS[i % CLOTHS.length];
                return (
                <article
                  key={p.slug}
                  className={`${styles.card} ${p.placeholder ? styles.saved : ""}`}
                  id={p.slug}
                  style={{ "--thread": cloth.thread, "--x": cloth.x } as CSSProperties}
                >
                  {/* A faint running stitch around the card, passing under the pocket. */}
                  <svg className={styles.stitch} aria-hidden="true">
                    <rect />
                  </svg>
                  {/* A print tucked into a pocket of the card's cloth; it slides out a little on hover. */}
                  <div className={styles.pocket}>
                    <figure className={styles.print}>
                      {p.image ? (
                        <Image
                          src={p.image.src}
                          alt={p.image.alt}
                          width={p.image.width}
                          height={p.image.height}
                          sizes="(max-width: 860px) 90vw, (max-width: 1100px) 45vw, 340px"
                        />
                      ) : (
                        <span className={styles.blank}>{p.placeholder ? "On the loom" : "Photo coming soon"}</span>
                      )}
                    </figure>
                    <div className={styles.swatch} aria-hidden="true">
                      <div data-fabric={cloth.fabric} />
                    </div>
                  </div>
                  <div className={styles.cardTop}>
                    <span className={styles.button} aria-hidden="true" />
                    <span className={styles.kind}>
                      <span className={styles.no}>No. {String(i + 1).padStart(2, "0")}</span>
                      {p.kind}
                    </span>
                  </div>
                  <h3>{p.name}</h3>
                  <p className={styles.pitch}>{p.pitch}</p>
                  <p>{p.description}</p>
                  {p.role && <span className={styles.role}>{p.role}</span>}
                  {p.stack && p.stack.length > 0 && (
                    <div className={styles.chips}>
                      {p.stack.map((s) => (
                        <span key={s}>{s}</span>
                      ))}
                    </div>
                  )}
                  {cardLinks(p).length > 0 && (
                    <div className={styles.cardLinks}>
                      {cardLinks(p).map((l, n) => (
                        <a
                          key={l.label}
                          className={`${styles.linkPatch} ${n === 0 ? styles.mainLink : ""}`}
                          href={l.href}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <LinkIcon icon={l.icon} />
                          {l.label}
                          <svg className={styles.out} viewBox="0 0 12 12" aria-hidden="true">
                            <path d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ))}
                    </div>
                  )}
                </article>
                );
              })}
            </div>
            <CardFit target="[data-cards]" />
          </div>
        </section>

        <section className={`${styles.block} ${styles.aboutBlock} wool`} id="about" aria-labelledby="about-h">
          <div className="inner">
            <div className={styles.secHead}>
              <h2 id="about-h">About</h2>
              <span>Beyond the internet kid</span>
            </div>
            <div className={styles.about}>
              <div className={styles.aboutText}>
                <p className={styles.big}>{site.about.lead}</p>
                <p>{site.about.body}</p>

                <h3 className={styles.mini}>Experience</h3>
                <ul className={styles.list}>
                  {site.experience.map((e) => (
                    <li key={e.title}>
                      <b>{e.title}</b>
                      <span>{e.meta}</span>
                      {e.note && <span className={styles.note2}>{e.note}</span>}
                    </li>
                  ))}
                </ul>

                <h3 className={styles.mini}>Achievements</h3>
                <ul className={styles.list}>
                  {site.awards.map((a) => (
                    <li key={a.title}>
                      <b>
                        <Ordinals text={a.title} />
                      </b>
                      <span>{a.meta}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* One patch: the photo tucked into a flannel pocket, the skills below. */}
              <aside className={`${styles.patch} ${styles.skills} tweed`}>
                <div className={styles.aboutPocket}>
                  <figure className={styles.snap}>
                    {site.about.photo ? (
                      <Image
                        src={site.about.photo.src}
                        alt={site.about.photo.alt}
                        width={site.about.photo.width}
                        height={site.about.photo.height}
                        sizes="(max-width: 860px) 70vw, 340px"
                      />
                    ) : (
                      <span className={styles.snapBlank}>Photo coming soon</span>
                    )}
                    {site.about.photo?.caption && <figcaption>{site.about.photo.caption}</figcaption>}
                  </figure>
                  <div className={styles.swatch} aria-hidden="true">
                    <div data-fabric="flannel" />
                  </div>
                </div>
                <h3>Skills</h3>
                <dl>
                  {site.skills.map((g) => (
                    <div key={g.label}>
                      <dt>{g.label}</dt>
                      <dd>
                        {g.items.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </aside>
            </div>
          </div>
        </section>

        <Journey
          milestones={journey}
          head={
            <div className={styles.secHead}>
              <h2 id="journey-h">Journey</h2>
              <span>How I got here, one stitch at a time</span>
            </div>
          }
        />

        <section className={`${styles.contact} tweed`} id="contact" aria-labelledby="contact-h">
          <div className={`inner ${styles.contactInner}`}>
            <h2 id="contact-h">Let&apos;s talk</h2>
            <p>Want to work together, or just say hi? Pull up a chair.</p>
            <CopyEmail email={site.email} />
            <div className={styles.links}>
              <a href={site.links.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <a href={site.links.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
              {site.links.resume && (
                <a href={site.links.resume} target="_blank" rel="noreferrer">
                  Résumé
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`inner ${styles.footInner}`}>
          <span>
            © {site.year} {site.name}
          </span>
          <span>
            Made in Yangon · <ReKnit />
          </span>
        </div>
      </footer>
    </>
  );
}
