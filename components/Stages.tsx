"use client";

import { useState } from "react";
import type { Project } from "@/lib/content";
import styles from "./Stages.module.css";

/** Projects as stages. Each one opens in place to show details and links. */
export function Stages({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ul className={styles.list}>
      {projects.map((p, i) => {
        const isOpen = open === p.slug;
        const panelId = `stage-${p.slug}`;
        return (
          <li key={p.slug} id={p.slug} className={`${styles.item} ${isOpen ? styles.open : ""}`}>
            <button
              type="button"
              className={styles.row}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : p.slug)}
            >
              <span className={styles.stage}>STAGE {i + 1}</span>
              <span className={styles.name}>
                {p.name}
                <span className={styles.pitch}>{p.pitch}</span>
              </span>
              <span className={styles.toggle} aria-hidden="true">
                {isOpen ? "Close ▾" : "Open ▸"}
              </span>
            </button>
            <div className={styles.detail} id={panelId} role="region" aria-label={p.name} inert={!isOpen}>
              <div className={styles.clip}>
                <div className={styles.body}>
                  <div>
                    <p className={styles.desc}>{p.description}</p>
                    {(p.demo || p.source) && (
                      <div className={styles.links}>
                        {p.demo && (
                          <a className="sel" href={p.demo} target="_blank" rel="noreferrer">
                            Play demo
                          </a>
                        )}
                        {p.source && (
                          <a className="sel" href={p.source} target="_blank" rel="noreferrer">
                            View source
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <dl className={styles.meta}>
                    <div>
                      <dt>Role</dt>
                      <dd>{p.role}</dd>
                    </div>
                    <div>
                      <dt>Built with</dt>
                      <dd className={styles.chips}>
                        {p.stack.map((s, k) => (
                          <span key={k}>{s}</span>
                        ))}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
