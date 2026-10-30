// Daily builds: one entry per day. Add a new object to BUILDS and the calendar fills itself in.
// `thumb` is a still of the real app for the calendar (transparent PNG, ~240px wide).
// `demo` is a short screen-capture GIF for the spec window, one per theme.
const START = "2026-10-28";

const BUILDS = [
  {
    date: "2026-10-28",
    title: "Personal Focus",
    what: "A tiny macOS app: a blue “Work log” folder on my desktop. Click it, today’s note slides out. Add a task, time it, tick it off, and a Markdown log of my day lands in my notes.",
    problem: "I wanted an honest record of what I actually worked on each day, agent work included, without adopting another task system. Most focus apps want to own your to-do list; I just wanted the time and the log.",
    built: "Swift for the window and timer, a little HTML view for the folder and note.",
    status: "v1. Works on my machine.",
    link: { href: "https://github.com/oleenamak/personal-focus", label: "View the code on GitHub" },
    thumb: "builds/001-personal-focus.png",
    demo: { light: "builds/001-personal-focus.gif", dark: "builds/001-personal-focus-dark.gif", alt: "Personal Focus in use: the folder opens, two tasks are added, one is timed and ticked off with a note, and the folder closes." },
  },
];
