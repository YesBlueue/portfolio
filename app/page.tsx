import { Fragment, type CSSProperties } from "react";
import { CopyEmail } from "@/components/CopyEmail";
import { Ps1Head } from "@/components/Ps1Head";
import { ReplayIntro } from "@/components/ReplayIntro";
import { Stages } from "@/components/Stages";
import { TitleScreen } from "@/components/TitleScreen";
import { projects, site } from "@/lib/content";
import styles from "./page.module.css";

export default function Home() {
  return (
    <>
      <TitleScreen />

      <nav className={styles.nav} aria-label="Main">
        <div className={`inner ${styles.navInner}`}>
          <a className={styles.mark} href="#top" aria-label={`${site.name}, back to top`}>
            {site.initials}
          </a>
          <ul>
            <li>
              <a className="sel" href="#work">
                Levels
              </a>
            </li>
            <li>
              <a className="sel" href="#about">
                Profile
              </a>
            </li>
            <li>
              <a className="sel" href="#contact">
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <header className={styles.hero} id="top">
          <div className={`inner ${styles.heroInner}`}>
            <div>
              <p className={styles.kicker}>
                {site.role} · Portfolio {site.year}
              </p>
              <h1 className={styles.name}>
                {site.name
                  .toUpperCase()
                  .split(" ")
                  .map((word, i) => (
                    <Fragment key={i}>
                      {i > 0 && " "}
                      <span>{word}</span>
                    </Fragment>
                  ))}
              </h1>
              <p className={styles.lede}>{site.intro}</p>
              <a className={styles.start} href="#work">
                PRESS START
              </a>
            </div>
            <figure className={styles.head}>
              <Ps1Head label={`Low-poly 3D portrait of ${site.name}`} />
            </figure>
          </div>
        </header>

        <section className={styles.block} id="work" aria-labelledby="work-h">
          <div className="inner">
            <div className={styles.secHead}>
              <h2 id="work-h">SELECT STAGE</h2>
              <span>{projects.length} projects</span>
            </div>
            <Stages projects={projects} />
          </div>
        </section>

        <section className={styles.block} id="about" aria-labelledby="about-h">
          <div className="inner">
            <div className={styles.secHead}>
              <h2 id="about-h">PROFILE</h2>
              <span>Player 1</span>
            </div>
            <div className={`${styles.about} ${site.skills.length ? "" : styles.aboutSolo}`}>
              <div>
                <p className={styles.lead}>{site.about.lead}</p>
                <p>{site.about.body}</p>
              </div>
              {site.skills.length > 0 && (
                <dl className={styles.stats}>
                  {site.skills.map((s) => (
                    <div key={s.label} className={styles.stat}>
                      <dt>{s.label}</dt>
                      <dd>
                        <span className={styles.bar} style={{ "--v": s.value } as CSSProperties} />
                        <span className="visually-hidden">{Math.round(s.value * 100)} out of 100</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </section>

        <section className={`${styles.block} ${styles.contact}`} id="contact" aria-labelledby="contact-h">
          <div className="inner">
            <h2 id="contact-h">CONTINUE?</h2>
            <p className={styles.sub}>Want to work together, or just say hi? Send me an email.</p>
            <CopyEmail email={site.email} />
            <ul className={styles.elsewhere}>
              <li>
                <a className="sel" href={site.links.github} target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </li>
              <li>
                <a className="sel" href={site.links.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn
                </a>
              </li>
              <li>
                <a className="sel" href={site.links.resume} target="_blank" rel="noreferrer">
                  Résumé
                </a>
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`inner ${styles.footInner}`}>
          <span>
            © {site.year} {site.name}
          </span>
          <ReplayIntro className={styles.replay} />
        </div>
      </footer>
    </>
  );
}
