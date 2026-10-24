export const taskCategories = [
  "Homework Help",
  "Tech Support",
  "Moving Help",
  "Groceries",
  "Handyman",
  "Other"
];

export const neighborhoods = [
  "Monastir Centre",
  "Skanes",
  "Sahline",
  "Ouardanine",
  "Moknine"
];

export const helpers = [
  {
    id: "h1",
    name: "Meriem",
    neighborhood: "Monastir Centre",
    distanceKm: 0.8,
    rating: 4.9,
    skills: ["Tech Support", "Homework Help"],
    bio: "Computer science student available for PC, Wi-Fi, and smartphone troubleshooting.",
    availability: "Weekdays after 5 PM",
    availabilityBand: "scheduled",
    location: [35.7762, 10.8274],
    phone: "+216 98 111 222",
    email: "meriem@gmail.com"
  },
  {
    id: "h2",
    name: "Walid",
    neighborhood: "Skanes",
    distanceKm: 1.9,
    rating: 4.7,
    skills: ["Moving Help", "Groceries"],
    bio: "Available evenings and weekends for errands and small moving jobs.",
    availability: "Evenings and weekends",
    availabilityBand: "week",
    location: [35.7615, 10.8111],
    phone: "+216 95 223 481",
    email: "walid@gmail.com"
  },
  {
    id: "h3",
    name: "Rim",
    neighborhood: "Sahline",
    distanceKm: 2.1,
    rating: 4.8,
    skills: ["Homework Help", "Handyman"],
    bio: "Math tutor who can help with schoolwork and basic home fixes.",
    availability: "Afternoons and weekends",
    availabilityBand: "week",
    location: [35.7513, 10.7118],
    phone: "+216 53 700 105",
    email: "rim@gmail.com"
  },
  {
    id: "h4",
    name: "Hamza",
    neighborhood: "Monastir Centre",
    distanceKm: 1.2,
    rating: 4.6,
    skills: ["Tech Support", "Handyman"],
    bio: "Can help with printer issues, app setup, and quick household fixes.",
    availability: "Daily after 6 PM",
    availabilityBand: "week",
    location: [35.7837, 10.8375],
    phone: "+216 97 012 440",
    email: "hamza@gmail.com"
  },
  {
    id: "h5",
    name: "Ines",
    neighborhood: "Ouardanine",
    distanceKm: 0.4,
    rating: 4.8,
    skills: ["Homework Help", "Groceries"],
    bio: "English and math support, plus nearby errands when needed.",
    availability: "Weekends and Tuesdays",
    availabilityBand: "scheduled",
    location: [35.6469, 10.8895],
    phone: "+216 52 884 190",
    email: "ines@gmail.com"
  },
  {
    id: "h6",
    name: "Karim",
    neighborhood: "Moknine",
    distanceKm: 4.2,
    rating: 4.5,
    skills: ["Moving Help", "Handyman"],
    bio: "Experienced with furniture moving and small fix-it jobs.",
    availability: "Most mornings",
    availabilityBand: "now",
    location: [35.6369, 10.9012],
    phone: "+216 54 229 610",
    email: "karim@gmail.com"
  }
];

export const tasks = [
  {
    id: "t1",
    title: "Need help moving a desk",
    category: "Moving Help",
    neighborhood: "Monastir Centre",
    requester: "Nadia",
    budget: "30 TND",
    urgency: "Today",
    description: "One medium desk, third floor with elevator, about 30 minutes.",
    status: "Open",
    attachments: [],
    helperRating: null,
    helperReview: null
  },
  {
    id: "t2",
    title: "Wi-Fi router setup",
    category: "Tech Support",
    neighborhood: "Skanes",
    requester: "Ahmed",
    budget: "Free",
    urgency: "This week",
    description: "Need help connecting a new router and securing the network.",
    status: "Open",
    attachments: [],
    helperRating: null,
    helperReview: null
  },
  {
    id: "t3",
    title: "Math homework support",
    category: "Homework Help",
    neighborhood: "Sahline",
    requester: "Leila",
    budget: "20 TND",
    urgency: "Tomorrow",
    description: "One-hour review session for grade 9 math exercises.",
    status: "In Progress",
    acceptedBy: "Meriem",
    helperRating: null,
    helperReview: null,
    attachments: []
  }
];

export const trustSafetyTeam = ["Moderator Amal", "Moderator Youssef", "Trust & Safety lead"];

export const helperHistories = {
  h1: {
    posted: [
      {
        id: "hp-h1-1",
        title: "Peer review for CS assignment",
        category: "Homework Help",
        status: "Done",
        date: "Mar 2026"
      }
    ],
    accepted: [
      {
        id: "ha-h1-1",
        title: "Office PC cleanup & antivirus",
        category: "Tech Support",
        status: "Completed",
        date: "Feb 2026"
      },
      {
        id: "ha-h1-2",
        title: "Smart TV streaming setup",
        category: "Tech Support",
        status: "Completed",
        date: "Jan 2026"
      }
    ]
  },
  h2: {
    posted: [],
    accepted: [
      {
        id: "ha-h2-1",
        title: "Grocery run — Skanes",
        category: "Groceries",
        status: "Completed",
        date: "Mar 2026"
      },
      {
        id: "ha-h2-2",
        title: "Sofa move (2nd floor)",
        category: "Moving Help",
        status: "Completed",
        date: "Feb 2026"
      }
    ]
  },
  h3: {
    posted: [
      {
        id: "hp-h3-1",
        title: "Looking for math worksheets",
        category: "Homework Help",
        status: "Open",
        date: "Mar 2026"
      }
    ],
    accepted: [
      {
        id: "ha-h3-1",
        title: "Grade 9 algebra session",
        category: "Homework Help",
        status: "Completed",
        date: "Feb 2026"
      }
    ]
  },
  h4: {
    posted: [],
    accepted: [
      {
        id: "ha-h4-1",
        title: "Printer driver install",
        category: "Tech Support",
        status: "Completed",
        date: "Mar 2026"
      }
    ]
  },
  h5: {
    posted: [],
    accepted: [
      {
        id: "ha-h5-1",
        title: "English essay feedback",
        category: "Homework Help",
        status: "Completed",
        date: "Jan 2026"
      }
    ]
  },
  h6: {
    posted: [],
    accepted: [
      {
        id: "ha-h6-1",
        title: "Bookshelf assembly",
        category: "Handyman",
        status: "Completed",
        date: "Feb 2026"
      }
    ]
  }
};

export const initialConversations = [
  {
    id: "c1",
    helperId: "h1",
    taskId: null,
    peerKind: "helper",
    peerName: "Meriem",
    helperName: "Meriem",
    taskTitle: "Wi-Fi router setup",
    messages: [
      {
        id: "m1",
        from: "Meriem",
        content: "hi",
        time: "17:12",
        read: true
      }
    ]
  },
  {
    id: "c2",
    helperId: "h2",
    taskId: null,
    peerKind: "helper",
    peerName: "Walid",
    helperName: "Walid",
    taskTitle: "Need help moving a desk",
    messages: [
      {
        id: "m3",
        from: "Walid",
        content: "hi",
        time: "16:48",
        read: true
      }
    ]
  }
];
