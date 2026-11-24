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
  email: "thawtunthaw252@gmail.com",
  links: {
    github: "https://github.com/YesBlueue",
    linkedin: "https://www.linkedin.com/in/thaw-thaw-tun/",
    // Add a résumé link (e.g. "/resume.pdf" with the file in /public) to show it on the page.
    resume: undefined as string | undefined,
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
    pitch: "A campus platform for UIT: timetables, room bookings, clubs and events in one place.",
    description:
      "A web platform for the University of Information Technology. Students sign up into their academic group and get their timetable, can search every building, floor and room, and can request rooms, which admins approve. Clubs manage members and events, including bookings for the multipurpose hall. Each role (student, club leader, admin) gets its own dashboard, and a Three.js campus map is in progress. I worked across the stack, on the Next.js frontend and the Spring Boot API.",
    role: "Full-stack developer",
    stack: ["Next.js", "TypeScript", "Spring Boot", "Java", "Supabase", "PostgreSQL"],
    // Public backend repo. The frontend repo (YesBlueue/uit_virtual_campus_frontend) is private.
    source: "https://github.com/KaungSet178/UIT_Virtual_Campus",
  },
  {
    slug: "mama-wawa",
    name: "MaMa WaWa",
    pitch: "A learning platform for kids, with interactive stories and minigames.",
    description:
      "Our first-year team project: a web-based platform where kids learn through interactive stories and small games. I worked on the frontend, building the pages and interactions.",
    role: "Frontend developer",
    stack: ["HTML5", "CSS", "JavaScript"],
    source: "https://github.com/YesBlueue/mama-wawa-for-kids",
  },
  {
    slug: "eaindray-go",
    name: "Eaindray Go",
    pitch: "My first real video game: an endless 2D runner.",
    description:
      "Inspired by classic endless runners. Tap to jump over obstacles and incoming animals, and see how far you can get. Built in Godot as a birthday gift.",
    role: "Solo developer",
    stack: ["Godot", "GDScript", "GDShader"],
    demo: "https://yesblueue.itch.io/eaindray-go",
    source: "https://github.com/YesBlueue/eaindray-go",
  },
];
