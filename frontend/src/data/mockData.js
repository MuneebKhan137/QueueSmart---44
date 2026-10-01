// mock data for assignment 2
// in assignment 3 this whole file gets replaced by API calls

// helper so the sample notifications look like they came in a few minutes ago
const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000);

export const initialServices = [
  {
    id: 1,
    name: "Academic Advising",
    description: "Degree planning and course selection with a college advisor.",
    durationMinutes: 15,
    priority: "medium",
    isOpen: true,
  },
  {
    id: 2,
    name: "Financial Aid",
    description: "Help with FAFSA, scholarships, grants and checking your aid status.",
    durationMinutes: 10,
    priority: "high",
    isOpen: true,
  },
  {
    id: 3,
    name: "ID Card Services",
    description: "Get a new student ID card or replace a lost or damaged one.",
    durationMinutes: 5,
    priority: "low",
    isOpen: true,
  },
  {
    id: 4,
    name: "Registrar",
    description: "Transcripts, enrollment verification and registration holds.",
    durationMinutes: 20,
    priority: "medium",
    isOpen: true,
  },
];

// queues keyed by service id, each one is an array of people in line
// order in the array = order in line
// possible status: waiting, almost ready or served
export const initialQueues = {
  // academic advising
  1: [
    { id: 101, name: "Santiago Reyes", email: "santiago.reyes@example.com", joinedAt: "1:05 PM", priority: "medium", status: "almost ready" },
    { id: 102, name: "Muneeb Khan", email: "muneeb.khan@example.com", joinedAt: "1:09 PM", priority: "medium", status: "waiting" },
    { id: 103, name: "Diego Cepeda", email: "diego.cepeda@example.com", joinedAt: "1:14 PM", priority: "low", status: "waiting" },
  ],
  // financial aid
  2: [
    { id: 201, name: "Aqeel Somani", email: "aqeel.somani@example.com", joinedAt: "12:58 PM", priority: "high", status: "served" },
    { id: 202, name: "Diego Cepeda", email: "diego.cepeda@example.com", joinedAt: "1:02 PM", priority: "high", status: "served" },
    { id: 203, name: "Demo Student", email: "demo.student@example.com", joinedAt: "1:07 PM", priority: "high", status: "almost ready" },
    { id: 204, name: "Muneeb Khan", email: "muneeb.khan@example.com", joinedAt: "1:12 PM", priority: "medium", status: "waiting" },
    { id: 205, name: "Santiago Reyes", email: "santiago.reyes@example.com", joinedAt: "1:16 PM", priority: "medium", status: "waiting" },
  ],
  // id card services
  3: [
    { id: 301, name: "Aqeel Somani", email: "aqeel.somani@example.com", joinedAt: "1:10 PM", priority: "low", status: "almost ready" },
    { id: 302, name: "Demo Student", email: "demo.student@example.com", joinedAt: "1:18 PM", priority: "low", status: "waiting" },
  ],
  // registrar
  4: [
    { id: 401, name: "Muneeb Khan", email: "muneeb.khan@example.com", joinedAt: "12:50 PM", priority: "medium", status: "served" },
    { id: 402, name: "Diego Cepeda", email: "diego.cepeda@example.com", joinedAt: "12:55 PM", priority: "medium", status: "almost ready" },
    { id: 403, name: "Aqeel Somani", email: "aqeel.somani@example.com", joinedAt: "1:01 PM", priority: "medium", status: "waiting" },
    { id: 404, name: "Santiago Reyes", email: "santiago.reyes@example.com", joinedAt: "1:06 PM", priority: "low", status: "waiting" },
    { id: 405, name: "Demo Student", email: "demo.student@example.com", joinedAt: "1:11 PM", priority: "medium", status: "waiting" },
  ],
};

// sample notifications, audience decides if admin or user sees it
export const initialNotifications = [
  {
    id: 1,
    audience: "admin",
    type: "signup",
    title: "New signup",
    message: "Demo Student created an account.",
    createdAt: minutesAgo(2),
    read: false,
  },
  {
    id: 2,
    audience: "admin",
    type: "queue_update",
    title: "Queue getting long",
    message: "Registrar now has 5 people in line.",
    createdAt: minutesAgo(9),
    read: true,
  },
  {
    id: 3,
    audience: "user",
    type: "queue_update",
    title: "Queue update",
    message: "You're #3 in Financial Aid.",
    createdAt: minutesAgo(4),
    read: false,
  },
  {
    id: 4,
    audience: "user",
    type: "status_change",
    title: "Almost your turn",
    message: "Your status in Financial Aid changed to almost ready.",
    createdAt: minutesAgo(6),
    read: true,
  },
];