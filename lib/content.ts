// All site copy lives here. Anything in [brackets] is a placeholder to fill in.

export type Project = {
  slug: string;
  name: string;
  pitch: string;
  description: string;
  role: string;
  stack: string[];
  demo?: string;
  source?: string;
};

export type Skill = { label: string; value: number };

export const site = {
  name: "Thaw Thaw Tun",
  initials: "TTT",
  role: "Developer",
  year: 2026,
  intro:
    "I build things for the web. [One more line about what you do and what you care about.]",
  email: "[your@email.com]",
  links: {
    github: "#", // [https://github.com/your-handle]
    linkedin: "#", // [https://www.linkedin.com/in/your-name]
    resume: "#", // [link to your résumé PDF, e.g. /resume.pdf]
  },
  about: {
    lead: "[One sentence about who you are and what drives your work.]",
    body: "[Two or three sentences of background: where you study or work, what you've built, and what you're looking for next.]",
  },
  // Set to an empty array to hide the skill bars.
  skills: [
    { label: "Frontend", value: 0.85 },
    { label: "Backend", value: 0.6 },
    { label: "3D / Graphics", value: 0.7 },
    { label: "Teamwork", value: 0.9 },
  ] satisfies Skill[],
};

export const projects: Project[] = [
  {
    slug: "uit-virtual-campus",
    name: "UIT Virtual Campus",
    pitch: "[One-line pitch for the project.]",
    description:
      "[Two or three sentences: what it is, the problem it solves, and what you built.]",
    role: "[Your role]",
    stack: ["[tech]", "[tech]", "[tech]"],
    demo: "#",
    source: "#",
  },
  {
    slug: "mama-wawa",
    name: "MaMa WaWa",
    pitch: "[One-line pitch for the project.]",
    description:
      "[Two or three sentences: what it is, the problem it solves, and what you built.]",
    role: "[Your role]",
    stack: ["[tech]", "[tech]", "[tech]"],
    demo: "#",
    source: "#",
  },
  {
    slug: "eaindray-go",
    name: "Eaindray Go",
    pitch: "[One-line pitch for the project.]",
    description:
      "[Two or three sentences: what it is, the problem it solves, and what you built.]",
    role: "[Your role]",
    stack: ["[tech]", "[tech]", "[tech]"],
    demo: "#",
    source: "#",
  },
];
