// All site copy lives here. Sourced from Thaw Thaw Tun's CV and GitHub repos.

export type Project = {
  slug: string;
  name: string;
  kind: string;
  pitch: string;
  description: string;
  role?: string;
  stack?: string[];
  demo?: string;
  source?: string;
  /** Cover image, tucked into the card's pocket. Without one the card shows an empty print. */
  image?: { src: string; alt: string; width: number; height: number };
  /** A saved spot for a future project. */
  placeholder?: boolean;
};

export type Entry = { title: string; meta: string; note?: string };

/** A stop on the journey timeline. Add `image` once there's a photo for it. */
export type Milestone = {
  when: string;
  title: string;
  note: string;
  image?: { src: string; alt: string; width: number; height: number };
  /** The last stop: where things are heading. */
  next?: boolean;
};

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
    // TODO: add the About photo, e.g. { src: "/about.webp", alt: "...", width: 1200, height: 1500 }.
    photo: undefined as { src: string; alt: string; width: number; height: number } | undefined,
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

// The journey timeline, oldest first.
// TODO: confirm the dates (the ones here are placeholders) and add photos.
export const journey: Milestone[] = [
  { when: "2023", title: "Started Computer Science at UIT", note: "University of Information Technology, Yangon." },
  { when: "Early 2024", title: "Prize for 2nd highest marks", note: "Batch 12, first year at UIT." },
  { when: "2024", title: "Built MaMa WaWa", note: "My first team project: a learning platform for kids." },
  { when: "2024", title: "Founded Learnabyte", note: "A study community that's grown past 180 members." },
  { when: "2024", title: "Youth Leadership Summit semi-finalist", note: "ASEAN-China-India, OSG Youth Alliance." },
  { when: "2025", title: "ASEAN Digital Awards national finalist", note: "Myanmar Computer Federation." },
  { when: "Early 2026", title: "3rd place, UIT Innovative Hackathon", note: "And champion of the impromptu talk contest." },
  { when: "Jun – Oct 2026", title: "IT intern, Grand Royal Group", note: "Full-stack work and computer vision models." },
  { when: "Next", title: "Machine learning & AI", note: "Where the thread goes next.", next: true },
];

export const projects: Project[] = [
  {
    slug: "uit-virtual-campus",
    name: "UIT Virtual Campus",
    kind: "Web",
    pitch: "A campus platform for UIT with a 3D map, timetables and bookings.",
    description:
      "An interactive 3D campus map with room search and shortest-path routing, plus timetables, room bookings, clubs, events and messaging. I lead the team and work on the Next.js frontend and Spring Boot API.",
    role: "Team lead · Full-stack developer",
    stack: ["Next.js", "shadcn/ui", "Spring Boot", "Supabase", "Three.js"],
    // Public backend repo. The frontend repo (YesBlueue/uit_virtual_campus_frontend) is private.
    source: "https://github.com/KaungSet178/UIT_Virtual_Campus",
    image: {
      src: "/projects/uit-virtual-campus.webp",
      alt: "UIT Virtual Campus poster: the headline “Find your way around campus in 3D” with feature tags for Campus Map, Timetable, Reservations, Clubs and Events, above a 3D model of the campus buildings with Room 311 pinned.",
      width: 1260,
      height: 1000,
    },
  },
  {
    slug: "mama-wawa",
    name: "MaMa WaWa",
    kind: "Web",
    pitch: "A learning platform for kids with games, minigames and story lessons.",
    description:
      "A web platform that makes learning fun for children with brain and math games, minigames, story-driven lessons and rich visuals. It was a first-year team project, and I worked on the frontend and UI/UX.",
    role: "Frontend developer",
    stack: ["HTML5", "CSS", "JavaScript", "UI/UX"],
    source: "https://github.com/YesBlueue/mama-wawa-for-kids",
    image: {
      src: "/projects/mama-wawa.webp",
      alt: "MaMa WaWa poster: a smiling cartoon girl beside the title, with buttons for Stories, Brain Games, MiniGames and Sing-Alongs, and screenshots of a farm scene and an arithmetic quiz.",
      width: 1260,
      height: 1000,
    },
  },
  {
    slug: "assistive-gloves",
    name: "Smart Communication Gloves",
    kind: "Hardware",
    pitch: "Two gloves that turn sign gestures into speech and speech into captions.",
    description:
      "An assistive prototype for deaf and mute users that speaks gestures and finger-spelled words aloud, and shows live captions on the wrist. I prototyped the hardware and software, including our own 5-bit finger alphabet.",
    role: "Hardware & software prototyping",
    stack: ["Arduino", "Raspberry Pi", "Python", "eSpeak", "Electronics"],
    image: {
      src: "/projects/assistive-gloves.png",
      alt: "Smart Communication Gloves poster: the title and feature tags beside a close-up photo of a black glove wired with finger sensors, and a code card mapping the gesture 11001 to the letter V.",
      width: 1260,
      height: 1000,
    },
  },
  {
    slug: "eaindray-go",
    name: "Eaindray Go",
    kind: "Game",
    pitch: "An endless 2D runner, and the first real video game I made.",
    description:
      "A game inspired by classic endless runners where you tap to jump over obstacles and incoming animals and see how far you get. I built it on my own in Godot, with object-oriented design, as a birthday gift.",
    role: "Solo developer",
    stack: ["Godot", "GDScript", "GDShader"],
    demo: "https://yesblueue.itch.io/eaindray-go",
    source: "https://github.com/YesBlueue/eaindray-go",
    image: {
      src: "/projects/eaindray-go.png",
      alt: "Eaindray Go cover art: a pixel-art girl running on a grassy ledge past a fox and a fence, under the title in a pixel font.",
      width: 630,
      height: 500,
    },
  },
  {
    slug: "sat-thwal",
    name: "Sat Thwal",
    kind: "App",
    pitch: "A student-support app with tutors, hostels, food and transport in one place.",
    description:
      "A mobile app for Myanmar university students that brings tutoring, housing, meals and campus transport together, with SmartMatch AI to search them. Ask it one question and it suggests school-approved options for you.",
    // TODO: role and stack still to come.
    demo: "https://sat-thwal.vercel.app",
    // Hosted on a teammate's account; Thaw Thaw Tun is a collaborator.
    source: "https://github.com/theYE-8266-viren-Nai/sat-thwal",
    image: {
      src: "/projects/sat-thwal.png",
      alt: "Sat Thwal poster: the app logo and tagline beside a phone showing the home screen, with tiles for Academic Support, Student Housing, Meal Support and Campus Transport.",
      width: 1260,
      height: 1000,
    },
  },
  {
    slug: "next-project",
    name: "Next project",
    kind: "Coming soon",
    pitch: "Something new is on the loom, and it will land right here soon.",
    description:
      "A spot saved for whatever I finish next, since there is always something new in progress on my desk. Check back soon, or ask me what I am working on right now.",
    placeholder: true,
  },
];
