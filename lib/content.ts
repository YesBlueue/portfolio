// All site copy lives here. Sourced from Thaw Thaw Tun's CV and GitHub repos.

export type Project = {
  slug: string;
  name: string;
  kind: string;
  pitch: string;
  description: string;
  role: string;
  stack: string[];
  demo?: string;
  source?: string;
};

export type Entry = { title: string; meta: string; note?: string };

export const site = {
  name: "Thaw Thaw Tun",
  initials: "TTT",
  kicker: "CS student · Yangon",
  year: 2026,
  intro:
    "I build full-stack web apps, hardware prototypes and games, and I'm heading into machine learning and AI engineering.",
  // Stand-in portrait until the final photo is taken (ideally without the tie; see lib/tie.ts).
  portrait: { src: "/portrait.webp", caption: "Yangon, 2026" },
  email: "thawtunthaw252@gmail.com",
  links: {
    github: "https://github.com/YesBlueue",
    linkedin: "https://www.linkedin.com/in/thaw-thaw-tun/",
    // Served from /public. Set to undefined to hide the Résumé link.
    resume: "/Thaw_Thaw_Tun_CV.pdf" as string | undefined,
  },
  about: {
    lead: "I lead team projects from design to deployment, and I run a 180+ member study community that teaches programming, computer science and math.",
    body: "I study Computer Science at the University of Information Technology, Yangon (GPA 3.98, Outstanding Student). Besides full-stack web work, I've built hardware accessibility prototypes, and in 2026 I spent five months as an IT intern at Grand Royal Group International. Right now I'm learning machine learning, AI engineering and Java.",
  },
  experience: [
    {
      title: "IT Intern, Grand Royal Group International",
      meta: "Jun – Oct 2026",
      note: "Built a full-stack application with senior developers and evaluated computer vision models.",
    },
    {
      title: "Founder & Peer Tutor, Learnabyte",
      meta: "Telegram study group",
      note: "Runs a 180+ member community of UIT students and makes lecture-style videos on programming, CS and math.",
    },
  ] satisfies Entry[],
  awards: [
    { title: "3rd Place, UIT Innovative Hackathon", meta: "UIT · 2026" },
    { title: "National Finalist, ASEAN Digital Awards", meta: "Myanmar Computer Federation · 2025" },
    { title: "Prize for 2nd Highest Marks, Batch 12", meta: "UIT · First Year" },
    { title: "Champion, Impromptu Talk Competition", meta: "UIT · 2026" },
    { title: "Semi-finalist, ASEAN-China-India Youth Leadership Summit", meta: "OSG Youth Alliance · 2024" },
  ] satisfies Entry[],
  skills: [
    { label: "Languages", items: ["JavaScript", "Python", "SQL", "GDScript", "HTML/CSS"] },
    {
      label: "Frameworks & tools",
      items: ["Next.js", "Spring / J2EE", "shadcn/ui", "Three.js", "Godot", "Supabase", "MySQL", "Vercel"],
    },
    { label: "Hardware", items: ["Arduino", "Raspberry Pi", "Electronics"] },
    { label: "Design", items: ["UI/UX"] },
    { label: "Currently learning", items: ["Machine Learning", "AI Engineering", "Java"] },
  ],
};

export const projects: Project[] = [
  {
    slug: "uit-virtual-campus",
    name: "UIT Virtual Campus",
    kind: "Web",
    pitch: "A campus platform for UIT: a 3D campus map, timetables, room bookings, clubs and events in one place.",
    description:
      "I'm leading the team building this platform for the University of Information Technology. It has an interactive 3D campus map with room search, availability and shortest-path routing. Students get their timetable by academic group and can book rooms and the hall, which admins approve. Clubs manage members and events, and students can message each other. I work across the stack, on the Next.js frontend and the Spring Boot API.",
    role: "Team lead · Full-stack developer",
    stack: ["Next.js", "shadcn/ui", "Spring Boot", "Supabase", "Three.js"],
    // Public backend repo. The frontend repo (YesBlueue/uit_virtual_campus_frontend) is private.
    source: "https://github.com/KaungSet178/UIT_Virtual_Campus",
  },
  {
    slug: "mama-wawa",
    name: "MaMa WaWa",
    kind: "Web",
    pitch: "A learning platform for kids, with games, minigames and story-driven lessons.",
    description:
      "Our first-year team project: a web platform that makes learning fun for children with brain and math games, minigames, story-driven lessons and rich visuals. I worked on the frontend and the UI/UX.",
    role: "Frontend developer",
    stack: ["HTML5", "CSS", "JavaScript", "UI/UX"],
    source: "https://github.com/YesBlueue/mama-wawa-for-kids",
  },
  {
    slug: "assistive-gloves",
    name: "Smart Communication Gloves",
    kind: "Hardware",
    pitch: "Two gloves that turn sign gestures into speech, and speech into live captions.",
    description:
      "An assistive prototype for deaf and mute users. Gesture shortcuts and gesture-alphabet typing (using a custom UIT Schema for Alphabet Interchange) are spoken aloud, and live speech-to-text captions show up on a screen on the wrist.",
    role: "Hardware & software prototyping",
    stack: ["Arduino", "Raspberry Pi", "Python", "eSpeak", "Electronics"],
  },
  {
    slug: "eaindray-go",
    name: "Eaindray Go",
    kind: "Game",
    pitch: "My first real video game: an endless 2D runner.",
    description:
      "Inspired by classic endless runners. Tap to jump over obstacles and incoming animals, and see how far you can get. Built in Godot with object-oriented design, as a birthday gift.",
    role: "Solo developer",
    stack: ["Godot", "GDScript", "GDShader"],
    demo: "https://yesblueue.itch.io/eaindray-go",
    source: "https://github.com/YesBlueue/eaindray-go",
  },
];
