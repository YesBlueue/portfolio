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
    photo: {
      src: "/about.webp",
      alt: "Thaw Thaw Tun speaking into a microphone on stage at UIT, beside a lectern and a row of UIT flags.",
      width: 780,
      height: 1170,
      caption: "UIT Impromptu Talk Competition 2026",
    } as { src: string; alt: string; width: number; height: number; caption?: string } | undefined,
    lead: "I lead team projects from design to deployment, and I run a 180+ member study community that teaches programming, computer science and math.",
    body: "I'm a third-year Computer Science student at the University of Information Technology, Yangon, with an outstanding GPA of 3.99. Besides full-stack web work, I've made games in Godot, and since June 2026 I've been an IT intern at Grand Royal Group International, through to December. Now I'm expanding my learning towards machine learning and AI engineering.",
  },
  experience: [
    {
      title: "IT Intern, Grand Royal Group International",
      meta: "Jun 2026 – present",
      note: "Built a full-stack application with senior developers and evaluated computer vision models.",
    },
    {
      title: "Founder & Peer Tutor, Learnabyte",
      meta: "Jul 2026 – present · Telegram study group",
      note: "Runs a 180+ member community of UIT students and makes lecture-style videos on programming, CS and math.",
    },
  ] satisfies Entry[],
  awards: [
    // Ordinals like "3rd" are shown with a superscript suffix (components/Ordinals.tsx).
    { title: "3rd Place, UIT Innovative Hackathon", meta: "University of Information Technology · 2026" },
    { title: "National Finalist, ASEAN Digital Awards", meta: "Myanmar Computer Federation · 2025" },
    { title: "2nd Highest Scorer, Batch 12", meta: "University of Information Technology · First Year" },
    { title: "Champion, Impromptu Talk Competition", meta: "University of Information Technology · 2026" },
    { title: "National Finalist, ASEAN-China-India Youth Leadership Summit", meta: "OSG Youth Alliance · 2024" },
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

// The journey timeline, oldest first. TODO: photos for the stops that don't have one yet.
export const journey: Milestone[] = [
  { when: "Jun 2024", title: "Six-distinction student, Matriculation Exam", note: "Grade 12, the national university entrance exam.", image: { src: "/journey/six-distinctions.webp", alt: "Thaw Thaw Tun with dozens of other top students, each holding an award, at a ceremony for outstanding matriculation results.", width: 800, height: 600 } },
  { when: "Jun 2024", title: "National finalist, ASEAN-China-India Youth Leadership Summit", note: "Organised by OSG Youth Alliance.", image: { src: "/journey/aciyls.webp", alt: "Thaw Thaw Tun holding a microphone on stage with four teammates at the ASEAN-China-India Youth Leadership Summit 2024.", width: 800, height: 600 } },
  { when: "Nov 2024", title: "Computer Science student, UIT", note: "University of Information Technology, Yangon.", image: { src: "/journey/uit-first-day.webp", alt: "The UIT campus atrium under its steel-and-glass roof, with students walking past.", width: 800, height: 600 } },
  { when: "Jul 2025", title: "Frontend developer, MaMa WaWa", note: "My first team project: a learning platform for kids.", image: { src: "/journey/mama-wawa.webp", alt: "Thaw Thaw Tun presenting MaMa WaWa from a laptop, with its home page projected on the screen.", width: 800, height: 600 } },
  { when: "Oct 2025", title: "National finalist, ASEAN Digital Awards", note: "Myanmar Computer Federation.", image: { src: "/journey/asean-digital-awards.webp", alt: "The Myanmar Computer Federation letter announcing the teams selected for the ASEAN Digital Awards 2026.", width: 800, height: 600 } },
  { when: "Jun 2026", title: "IT intern, Grand Royal Group", note: "Full-stack work and computer vision models, through December.", image: { src: "/journey/grgi.webp", alt: "The Grand Royal Group reception, with its logo above a curved wooden desk.", width: 800, height: 600 } },
  { when: "Jul 2026", title: "Participant, Let's Tech Hackathon", note: "My first hackathon. No win this time, but a first step.", image: { src: "/journey/lets-tech.webp", alt: "Thaw Thaw Tun taking a selfie in a lift with hackathon teammates.", width: 800, height: 600 } },
  { when: "Jul 2026", title: "3rd place, UIT Innovative Hackathon", note: "My second hackathon, the same month.", image: { src: "/journey/uit-hackathon.webp", alt: "Thaw Thaw Tun and teammates in front of the UIT Innovative Hackathon 2026 banner, holding their prize sign.", width: 800, height: 600 } },
  { when: "Jul 2026", title: "Founder and peer tutor, Learnabyte", note: "A study community that's grown past 180 members." },
  { when: "Aug 2026", title: "Champion, Impromptu Talk Competition", note: "Public speaking on stage at UIT.", image: { src: "/journey/impromptu.webp", alt: "Thaw Thaw Tun holding a first prize certificate with other contestants at the UIT Impromptu Talk Competition.", width: 800, height: 600 } },
  { when: "Sep 2026", title: "2nd highest scorer, Batch 12", note: "Prize for the first-year exams at UIT.", image: { src: "/journey/second-highest-marks.webp", alt: "Thaw Thaw Tun receiving a trophy on stage at a UIT prize-giving ceremony.", width: 800, height: 600 } },
  { when: "Nov 2026", title: "Participant, NASA Space Apps Challenge", note: "NASA's global hackathon for space and science." },
  { when: "Dec 2026", title: "Presenter, Project Show", note: "Coming soon.", image: { src: "/journey/project-show.webp", alt: "Stairs and walkways inside the UIT building.", width: 800, height: 600 }, next: true },
  { when: "Next", title: "Machine learning & AI", note: "Where the thread goes next.", next: true },
];

export const projects: Project[] = [
  {
    slug: "uit-virtual-campus",
    name: "UIT Virtual Campus",
    kind: "Web",
    pitch: "A campus platform for UIT with a 3D map, timetables and bookings.",
    description:
      "An interactive 3D campus map with room search and shortest-path routing, plus timetables, room bookings, clubs, events and messaging. I led the team and worked on the Next.js frontend and Spring Boot API.",
    role: "Team lead · Full-stack developer",
    stack: ["Next.js", "Spring Boot", "Supabase", "Three.js"],
    demo: "https://uit-virtual-campus.vercel.app",
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
    stack: ["Arduino", "Raspberry Pi", "Python", "Electronics"],
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
    role: "Full-stack developer",
    stack: ["Next.js", "Supabase", "Vapi"],
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
