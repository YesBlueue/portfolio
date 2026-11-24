import { CopyEmail } from "@/components/CopyEmail";
import { Intro } from "@/components/Intro";
import { Portrait } from "@/components/Portrait";
import { ReKnit } from "@/components/ReKnit";
import { Zipper } from "@/components/Zipper";
import { projects, site } from "@/lib/content";
import styles from "./page.module.css";

// Badge colors for the project numbers, in order.
const BADGES = ["var(--rust)", "var(--moss)", "var(--camel)", "var(--wool-navy)"];

export default function Home() {
  return (
    <>
      <Intro />
      <Zipper />
      <nav className={styles.nav} aria-label="Main">
        <div className={`inner ${styles.navInner}`}>
          <a className={styles.mark} href="#top" aria-label={`${site.name}, back to top`}>
            {site.initials}
          </a>
          <ul>
            <li>
              <a href="#projects">
                <span className={styles.dot} style={{ background: "var(--rust)" }} />
                Projects
              </a>
            </li>
            <li>
              <a href="#about">
                <span className={styles.dot} style={{ background: "var(--mustard)" }} />
                About
              </a>
            </li>
            <li>
              <a href="#contact">
                <span className={styles.dot} style={{ background: "var(--moss)" }} />
                Contact
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <main>
        <header className={`${styles.hero} flannel`} id="top">
          <div className={`inner ${styles.heroInner}`}>
            <Portrait src={site.portrait.src} alt={`Portrait of ${site.name}`} caption={site.portrait.caption} />
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
            <div className={styles.cards}>
              {projects.map((p, i) => (
                <article key={p.slug} className={styles.card} id={p.slug}>
                  <div className={styles.cardTop}>
                    <span className={styles.num} style={{ background: BADGES[i % BADGES.length] }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className={styles.kind}>{p.kind}</span>
                  </div>
                  <h3>{p.name}</h3>
                  <p className={styles.pitch}>{p.pitch}</p>
                  <p>{p.description}</p>
                  <span className={styles.role}>{p.role}</span>
                  <div className={styles.chips}>
                    {p.stack.map((s) => (
                      <span key={s}>{s}</span>
                    ))}
                  </div>
                  {(p.demo || p.source) && (
                    <div className={styles.links}>
                      {p.demo && (
                        <a href={p.demo} target="_blank" rel="noreferrer">
                          Play it
                        </a>
                      )}
                      {p.source && (
                        <a href={p.source} target="_blank" rel="noreferrer">
                          Source
                        </a>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.block} ${styles.aboutBlock} wool`} id="about" aria-labelledby="about-h">
          <div className="inner">
            <div className={styles.secHead}>
              <h2 id="about-h">About</h2>
              <span>The short version</span>
            </div>
            <div className={styles.about}>
              <div>
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
                      <b>{a.title}</b>
                      <span>{a.meta}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <aside className={`${styles.patch} tweed`}>
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
