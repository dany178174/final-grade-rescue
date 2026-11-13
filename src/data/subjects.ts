export type ResourceKind =
  | 'Channel'
  | 'Series'
  | 'Course'
  | 'Free textbook'
  | 'Articles'
  | 'Study guide'
  | 'Practice'
  | 'Tool'
  // Vietnamese section
  | 'Kênh'
  | 'Khóa học'
  | 'SGK điện tử'
  | 'Lời giải'
  | 'Luyện tập'
  | 'Báo'
  | 'Tra cứu'
  | 'Công cụ'

export type Resource = {
  title: string
  source: string
  url: string
  kind: ResourceKind
  note: string
}

export type SubjectId =
  | 'algebra'
  | 'calculus'
  | 'statistics'
  | 'biology'
  | 'chemistry'
  | 'physics'
  | 'history'
  | 'economics'
  | 'psychology'
  | 'english'
  | 'cs'
  | 'languages'
  | 'other'

export type Subject = {
  id: SubjectId
  name: string
  emoji: string
  examples: string
  topicExample: string
  /** Words added to YouTube searches, e.g. "calculus". */
  searchTerm: string
  /** How the subject reads inside a sentence: "my {promptName} final". */
  promptName: string
  videos: Resource[]
  reading: Resource[]
  /** A prompt tuned to how this subject is tested. {topic} is filled in. */
  specialPrompt: { title: string; text: string }
}

export function youtubeSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query).replace(/%20/g, '+')}`
}

export function wikipediaSearch(query: string): string {
  return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`
}

const desmos: Resource = {
  title: 'Desmos Graphing Calculator',
  source: 'Desmos',
  url: 'https://www.desmos.com/calculator',
  kind: 'Tool',
  note: 'Graph any function in seconds to see what the algebra is actually doing.',
}

const organicChemTutor = (note: string): Resource => ({
  title: 'The Organic Chemistry Tutor',
  source: 'YouTube',
  url: 'https://www.youtube.com/@TheOrganicChemistryTutor',
  kind: 'Channel',
  note,
})

export const SUBJECTS: Subject[] = [
  {
    id: 'algebra',
    name: 'Algebra & Precalc',
    emoji: '🧮',
    examples: 'Algebra 1–2, Precalc, Trig',
    topicExample: 'e.g. logarithms',
    searchTerm: 'algebra',
    promptName: 'algebra',
    videos: [
      {
        title: 'Algebra 2',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/math/algebra2',
        kind: 'Course',
        note: 'Short videos plus practice for every unit, so you can learn and check yourself in one place.',
      },
      {
        title: 'Precalculus',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/math/precalculus',
        kind: 'Course',
        note: 'Functions, trig, vectors, matrices and more, unit by unit.',
      },
      organicChemTutor(
        'Despite the name, one of the biggest algebra and precalc libraries on YouTube. Search the channel for your exact topic.',
      ),
      {
        title: 'PatrickJMT',
        source: 'YouTube',
        url: youtubeSearch('patrickjmt math'),
        kind: 'Channel',
        note: 'Quick, no-fluff worked examples. Perfect when you just need to see one done.',
      },
    ],
    reading: [
      {
        title: 'College Algebra 2e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/college-algebra-2e',
        kind: 'Free textbook',
        note: 'A complete, peer-reviewed textbook with worked examples and answers to odd problems.',
      },
      {
        title: 'Precalculus 2e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/precalculus-2e',
        kind: 'Free textbook',
        note: 'Free full textbook. Use the end-of-chapter review exercises as a mini practice test.',
      },
      {
        title: "Paul's Online Math Notes",
        source: 'Lamar University',
        url: 'https://tutorial.math.lamar.edu/',
        kind: 'Study guide',
        note: 'Clear notes with practice problems and full step-by-step solutions.',
      },
      desmos,
    ],
    specialPrompt: {
      title: 'Step-by-step solver coach',
      text: "I'm practicing {topic} for my algebra final. Give me one problem at a time, starting easy and getting harder. When I answer, check my work step by step. If I'm wrong, point to the exact step that broke and give me a hint, not the full solution.",
    },
  },
  {
    id: 'calculus',
    name: 'Calculus',
    emoji: '📈',
    examples: 'Limits, derivatives, integrals',
    topicExample: 'e.g. related rates',
    searchTerm: 'calculus',
    promptName: 'calculus',
    videos: [
      {
        title: 'Professor Leonard',
        source: 'YouTube',
        url: 'https://www.youtube.com/@ProfessorLeonard',
        kind: 'Channel',
        note: 'Full-length lectures for Calc 1–3. Best when you need to really understand a concept, not just a shortcut.',
      },
      {
        title: '3Blue1Brown: Essence of Calculus',
        source: 'YouTube',
        url: youtubeSearch('3blue1brown essence of calculus'),
        kind: 'Series',
        note: 'Beautiful animations that show what derivatives and integrals actually mean.',
      },
      organicChemTutor('Fast worked examples for every derivative rule and integration technique.'),
      {
        title: 'AP Calculus AB',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/math/ap-calculus-ab',
        kind: 'Course',
        note: 'Video lessons plus unit tests you can use as practice exams.',
      },
    ],
    reading: [
      {
        title: 'Calculus Volume 1',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/calculus-volume-1',
        kind: 'Free textbook',
        note: 'A complete calculus textbook, free online and as a PDF.',
      },
      {
        title: "Paul's Online Math Notes",
        source: 'Lamar University',
        url: 'https://tutorial.math.lamar.edu/',
        kind: 'Study guide',
        note: "The internet's favorite calculus notes, with practice problems and full solutions.",
      },
      {
        title: 'BetterExplained',
        source: 'Kalid Azad',
        url: 'https://betterexplained.com/',
        kind: 'Articles',
        note: 'Intuition-first articles that make calculus ideas finally click.',
      },
      desmos,
    ],
    specialPrompt: {
      title: 'Exam-style problem drill',
      text: 'Act as my calculus coach. Give me 5 {topic} problems that look like real final-exam questions, one at a time. After each answer, show the cleanest solution and name the rule I should recognize next time (chain rule, u-substitution, etc.).',
    },
  },
  {
    id: 'statistics',
    name: 'Statistics',
    emoji: '📊',
    examples: 'Probability, distributions, tests',
    topicExample: 'e.g. hypothesis tests',
    searchTerm: 'statistics',
    promptName: 'statistics',
    videos: [
      {
        title: 'StatQuest with Josh Starmer',
        source: 'YouTube',
        url: 'https://www.youtube.com/@statquest',
        kind: 'Channel',
        note: 'Stats concepts clearly explained with simple visuals. Great for p-values and regression.',
      },
      {
        title: 'jbstatistics',
        source: 'YouTube',
        url: youtubeSearch('jbstatistics'),
        kind: 'Channel',
        note: 'Classic intro-stats lessons: distributions, confidence intervals and hypothesis tests.',
      },
      {
        title: 'Crash Course Statistics',
        source: 'YouTube',
        url: youtubeSearch('crash course statistics'),
        kind: 'Series',
        note: 'A fast, fun overview of the whole course. Good for big-picture review.',
      },
      {
        title: 'Statistics & Probability',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/math/statistics-probability',
        kind: 'Course',
        note: 'Videos and practice for every topic in a typical intro stats class.',
      },
    ],
    reading: [
      {
        title: 'Introductory Statistics',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/introductory-statistics-2e',
        kind: 'Free textbook',
        note: 'Free textbook with practice problems and a formula review in every chapter.',
      },
      {
        title: 'OpenIntro Statistics',
        source: 'OpenIntro',
        url: 'https://www.openintro.org/book/os/',
        kind: 'Free textbook',
        note: 'A widely used free stats textbook with clear examples.',
      },
      {
        title: 'Seeing Theory',
        source: 'Brown University',
        url: 'https://seeing-theory.brown.edu/',
        kind: 'Tool',
        note: 'Interactive visuals of probability and statistics. Play with it to build intuition.',
      },
    ],
    specialPrompt: {
      title: 'Which test do I use?',
      text: 'I keep mixing up which statistical method to use. Give me 8 short word problems for my statistics final, focused on {topic}. For each one I will name the method (z-test, t-test, chi-square, regression, etc.) and explain why. Correct me and point out the clue in the problem I should have noticed.',
    },
  },
  {
    id: 'biology',
    name: 'Biology',
    emoji: '🧬',
    examples: 'Cells, genetics, evolution',
    topicExample: 'e.g. cellular respiration',
    searchTerm: 'biology',
    promptName: 'biology',
    videos: [
      {
        title: 'Amoeba Sisters',
        source: 'YouTube',
        url: 'https://www.youtube.com/@AmoebaSisters',
        kind: 'Channel',
        note: 'Short, funny, crystal-clear biology explainers. Perfect for tricky processes.',
      },
      {
        title: 'Crash Course Biology',
        source: 'YouTube',
        url: youtubeSearch('crash course biology'),
        kind: 'Series',
        note: 'Fast-paced episodes that cover the whole course.',
      },
      {
        title: 'Bozeman Science',
        source: 'YouTube',
        url: youtubeSearch('bozeman science biology'),
        kind: 'Channel',
        note: 'A biology teacher explaining AP-level topics step by step.',
      },
      {
        title: 'Biology',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/science/biology',
        kind: 'Course',
        note: 'In-depth videos and practice questions for every unit.',
      },
    ],
    reading: [
      {
        title: 'Biology 2e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/biology-2e',
        kind: 'Free textbook',
        note: 'Free full textbook with diagrams, chapter summaries and review questions.',
      },
      {
        title: 'Scitable',
        source: 'Nature Education',
        url: 'https://www.nature.com/scitable/',
        kind: 'Articles',
        note: "Free articles from Nature's education team on genetics and cell biology.",
      },
      {
        title: 'Biology LibreTexts',
        source: 'LibreTexts',
        url: 'https://bio.libretexts.org/',
        kind: 'Free textbook',
        note: 'A huge free library of biology chapters. Search for your exact topic.',
      },
      {
        title: 'Scientific American',
        source: 'Scientific American',
        url: 'https://www.scientificamerican.com/',
        kind: 'Articles',
        note: 'Real-world science stories that make textbook concepts stick.',
      },
    ],
    specialPrompt: {
      title: 'Process walkthrough',
      text: 'Walk me through {topic} as a step-by-step process, like a story with numbered stages. Then give me a blank version of the stages and make me fill them in from memory. Grade my answer and fix what I got wrong.',
    },
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    emoji: '⚗️',
    examples: 'Stoichiometry, reactions, organic',
    topicExample: 'e.g. stoichiometry',
    searchTerm: 'chemistry',
    promptName: 'chemistry',
    videos: [
      {
        title: 'Tyler DeWitt',
        source: 'YouTube',
        url: youtubeSearch('tyler dewitt chemistry'),
        kind: 'Channel',
        note: 'Makes intro chemistry finally click. Especially good for moles and stoichiometry.',
      },
      organicChemTutor('Thousands of worked chemistry problems, general and organic.'),
      {
        title: 'Crash Course Chemistry',
        source: 'YouTube',
        url: youtubeSearch('crash course chemistry'),
        kind: 'Series',
        note: 'A quick, energetic tour of the whole course.',
      },
      {
        title: 'Professor Dave Explains',
        source: 'YouTube',
        url: 'https://www.youtube.com/@ProfessorDaveExplains',
        kind: 'Channel',
        note: 'Clear tutorials for general and organic chemistry, each with a comprehension check.',
      },
    ],
    reading: [
      {
        title: 'Chemistry 2e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/chemistry-2e',
        kind: 'Free textbook',
        note: 'Free full textbook with worked examples and end-of-chapter problems.',
      },
      {
        title: 'Organic Chemistry',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/organic-chemistry',
        kind: 'Free textbook',
        note: 'Free organic chemistry textbook, if your final is on orgo.',
      },
      {
        title: 'Chemistry LibreTexts',
        source: 'LibreTexts',
        url: 'https://chem.libretexts.org/',
        kind: 'Free textbook',
        note: 'Searchable chemistry library. Great for looking up one specific concept.',
      },
      {
        title: 'Ptable',
        source: 'Ptable',
        url: 'https://ptable.com/',
        kind: 'Tool',
        note: 'Interactive periodic table with properties, orbitals and trends.',
      },
    ],
    specialPrompt: {
      title: 'Units-first problem drill',
      text: 'Give me {topic} chemistry problems one at a time, like a real final exam. Make me show units at every step. If I mess up a conversion or a significant figure, stop me right there and explain what went wrong.',
    },
  },
  {
    id: 'physics',
    name: 'Physics',
    emoji: '🧲',
    examples: 'Mechanics, energy, E&M',
    topicExample: 'e.g. projectile motion',
    searchTerm: 'physics',
    promptName: 'physics',
    videos: [
      {
        title: 'Flipping Physics',
        source: 'YouTube',
        url: youtubeSearch('flipping physics'),
        kind: 'Channel',
        note: 'Intro and AP physics with clear, fun worked examples.',
      },
      {
        title: 'Crash Course Physics',
        source: 'YouTube',
        url: youtubeSearch('crash course physics'),
        kind: 'Series',
        note: 'Big-picture explanations of every major topic.',
      },
      organicChemTutor('Fast worked physics problems for almost every formula you need.'),
      {
        title: 'Physics',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/science/physics',
        kind: 'Course',
        note: 'Video lessons and practice from motion to circuits.',
      },
    ],
    reading: [
      {
        title: 'College Physics 2e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/college-physics-2e',
        kind: 'Free textbook',
        note: 'Free algebra-based physics textbook with problem sets.',
      },
      {
        title: 'The Physics Classroom',
        source: 'The Physics Classroom',
        url: 'https://www.physicsclassroom.com/',
        kind: 'Study guide',
        note: 'Plain-language tutorials plus interactive practice for high school physics.',
      },
      {
        title: 'HyperPhysics',
        source: 'Georgia State University',
        url: 'http://hyperphysics.phy-astr.gsu.edu/hbase/index.html',
        kind: 'Study guide',
        note: 'A concept map of all of physics. Click through to see how ideas connect.',
      },
      {
        title: 'Quanta Magazine',
        source: 'Quanta Magazine',
        url: 'https://www.quantamagazine.org/',
        kind: 'Articles',
        note: 'Beautifully written stories about real physics research. Great motivation.',
      },
    ],
    specialPrompt: {
      title: 'Set it up before solving',
      text: "I'm studying {topic} for my physics final. Give me a problem, then before I calculate anything, ask me: what's given, what's unknown, which principle applies, and what the diagram looks like. Only then let me solve it. Check my answer and my units.",
    },
  },
  {
    id: 'history',
    name: 'History & Gov',
    emoji: '🏛️',
    examples: 'US, World, Government',
    topicExample: 'e.g. the Cold War',
    searchTerm: 'history',
    promptName: 'history',
    videos: [
      {
        title: "Heimler's History",
        source: 'YouTube',
        url: youtubeSearch("heimler's history"),
        kind: 'Channel',
        note: 'AP US, World and European history reviews organized by unit.',
      },
      {
        title: 'Crash Course US & World History',
        source: 'YouTube',
        url: youtubeSearch('crash course history'),
        kind: 'Series',
        note: 'Fast, funny episodes that connect events into a big picture.',
      },
      {
        title: 'OverSimplified',
        source: 'YouTube',
        url: 'https://www.youtube.com/@OverSimplified',
        kind: 'Channel',
        note: 'Hilarious, memorable deep dives on wars and revolutions.',
      },
      {
        title: 'US History',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/humanities/us-history',
        kind: 'Course',
        note: 'Video lessons and practice from colonization to today.',
      },
    ],
    reading: [
      {
        title: 'U.S. History',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/us-history',
        kind: 'Free textbook',
        note: 'Free full textbook with key terms and review questions in every chapter.',
      },
      {
        title: 'American Government 3e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/american-government-3e',
        kind: 'Free textbook',
        note: 'Free textbook for Government and Civics finals.',
      },
      {
        title: 'Smithsonian Magazine: History',
        source: 'Smithsonian',
        url: 'https://www.smithsonianmag.com/history/',
        kind: 'Articles',
        note: 'Well-researched stories that bring events and people to life.',
      },
      {
        title: 'History.com',
        source: 'HISTORY',
        url: 'https://www.history.com/',
        kind: 'Articles',
        note: 'Short, readable articles on almost any event. Good for a quick refresher.',
      },
    ],
    specialPrompt: {
      title: 'Cause → effect chains',
      text: 'Help me study {topic} for my history final. Build a timeline of the 8 most important events, and for each one give the cause, the effect and why it matters, one line each. Then quiz me: name an event and ask me for its cause and effect.',
    },
  },
  {
    id: 'economics',
    name: 'Economics',
    emoji: '💸',
    examples: 'Micro, macro, finance',
    topicExample: 'e.g. supply and demand',
    searchTerm: 'economics',
    promptName: 'economics',
    videos: [
      {
        title: 'Jacob Clifford (ACDC Econ)',
        source: 'YouTube',
        url: youtubeSearch('jacob clifford acdc econ'),
        kind: 'Channel',
        note: 'Energetic micro and macro reviews built for AP and intro econ exams.',
      },
      {
        title: 'Marginal Revolution University',
        source: 'YouTube',
        url: youtubeSearch('marginal revolution university'),
        kind: 'Channel',
        note: 'Short, clear lessons from economics professors.',
      },
      {
        title: 'Crash Course Economics',
        source: 'YouTube',
        url: youtubeSearch('crash course economics'),
        kind: 'Series',
        note: 'Real-world examples for the big ideas in micro and macro.',
      },
      {
        title: 'Microeconomics',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/economics-finance-domain/microeconomics',
        kind: 'Course',
        note: 'Video lessons and practice. Macro is in the same section.',
      },
    ],
    reading: [
      {
        title: 'Principles of Economics 3e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/principles-economics-3e',
        kind: 'Free textbook',
        note: 'Free textbook covering both micro and macro, with clear graphs.',
      },
      {
        title: 'Investopedia',
        source: 'Investopedia',
        url: 'https://www.investopedia.com/',
        kind: 'Articles',
        note: 'Plain-English definitions of every econ and finance term.',
      },
      {
        title: 'Econlib',
        source: 'Liberty Fund',
        url: 'https://www.econlib.org/',
        kind: 'Articles',
        note: 'Short encyclopedia articles on economic ideas, written by economists.',
      },
      {
        title: 'FRED Economic Data',
        source: 'St. Louis Fed',
        url: 'https://fred.stlouisfed.org/',
        kind: 'Tool',
        note: 'Real charts of GDP, inflation and unemployment to make macro concrete.',
      },
    ],
    specialPrompt: {
      title: 'Graph explainer',
      text: 'I\'m studying {topic} for my economics final. Describe the graph I should draw step by step (axes, curves, which curve shifts and in which direction), then explain what happens to price and quantity. After that, give me a new scenario and make me describe the shift myself.',
    },
  },
  {
    id: 'psychology',
    name: 'Psychology',
    emoji: '🧠',
    examples: 'Intro & AP Psych',
    topicExample: 'e.g. classical conditioning',
    searchTerm: 'psychology',
    promptName: 'psychology',
    videos: [
      {
        title: 'Crash Course Psychology',
        source: 'YouTube',
        url: youtubeSearch('crash course psychology'),
        kind: 'Series',
        note: 'A full intro psych course in short, lively episodes.',
      },
      {
        title: 'AP Psychology unit reviews',
        source: 'YouTube',
        url: youtubeSearch('AP psychology unit review'),
        kind: 'Series',
        note: 'Teacher-made reviews organized by unit. Pick the units on your final.',
      },
      {
        title: 'TED-Ed',
        source: 'YouTube',
        url: 'https://www.youtube.com/@TEDEd',
        kind: 'Channel',
        note: 'Short animated lessons on memory, the brain and behavior.',
      },
    ],
    reading: [
      {
        title: 'Psychology 2e',
        source: 'OpenStax',
        url: 'https://openstax.org/details/books/psychology-2e',
        kind: 'Free textbook',
        note: 'Free intro psych textbook with key terms and review questions.',
      },
      {
        title: 'Simply Psychology',
        source: 'Simply Psychology',
        url: 'https://www.simplypsychology.org/',
        kind: 'Articles',
        note: 'Short, student-friendly explanations of theories and famous studies.',
      },
      {
        title: 'Psychology Topics',
        source: 'American Psychological Association',
        url: 'https://www.apa.org/topics',
        kind: 'Articles',
        note: 'Trusted overviews of major topics from the APA.',
      },
      {
        title: 'Verywell Mind',
        source: 'Verywell Mind',
        url: 'https://www.verywellmind.com/',
        kind: 'Articles',
        note: 'Readable articles that connect psych concepts to everyday life.',
      },
    ],
    specialPrompt: {
      title: 'Real-life examples',
      text: 'For my psychology final, give me 10 real-life scenarios that each show a concept related to {topic}. I will name the concept for each one. Tell me if I am right and explain the clue that gives it away.',
    },
  },
  {
    id: 'english',
    name: 'English & Lit',
    emoji: '📖',
    examples: 'Novels, essays, grammar',
    topicExample: 'e.g. The Great Gatsby',
    searchTerm: 'literature',
    promptName: 'English',
    videos: [
      {
        title: 'Crash Course Literature',
        source: 'YouTube',
        url: youtubeSearch('crash course literature'),
        kind: 'Series',
        note: 'Smart breakdowns of classic books and how to read them closely.',
      },
      {
        title: 'Essay writing tutorials',
        source: 'YouTube',
        url: youtubeSearch('how to write a strong thesis statement'),
        kind: 'Series',
        note: 'Short guides on theses, structure and using quotes as evidence.',
      },
      {
        title: 'Grammar',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/humanities/grammar',
        kind: 'Course',
        note: 'Bite-size grammar lessons with practice, if your final includes it.',
      },
    ],
    reading: [
      {
        title: 'LitCharts',
        source: 'LitCharts',
        url: 'https://www.litcharts.com/',
        kind: 'Study guide',
        note: 'Theme trackers, key quotes and chapter summaries for well-known books.',
      },
      {
        title: 'SparkNotes',
        source: 'SparkNotes',
        url: 'https://www.sparknotes.com/',
        kind: 'Study guide',
        note: 'Summaries and analysis. Use it to review, not to replace reading.',
      },
      {
        title: 'Purdue OWL',
        source: 'Purdue University',
        url: 'https://owl.purdue.edu/owl/purdue_owl.html',
        kind: 'Study guide',
        note: 'The gold standard for essay structure, citations and grammar.',
      },
      {
        title: 'Project Gutenberg',
        source: 'Project Gutenberg',
        url: 'https://www.gutenberg.org/',
        kind: 'Free textbook',
        note: 'Read tens of thousands of classic books online for free.',
      },
    ],
    specialPrompt: {
      title: 'Thesis & evidence coach',
      text: "I'm preparing for my English final on {topic}. Give me 3 likely essay prompts. For each, help me build a strong thesis by asking me questions instead of writing it for me. Then give me feedback on my thesis and suggest the kinds of quotes or details I should use as evidence.",
    },
  },
  {
    id: 'cs',
    name: 'Computer Science',
    emoji: '💻',
    examples: 'Programming, algorithms',
    topicExample: 'e.g. recursion',
    searchTerm: 'computer science',
    promptName: 'computer science',
    videos: [
      {
        title: 'CS50',
        source: 'YouTube',
        url: 'https://www.youtube.com/@cs50',
        kind: 'Channel',
        note: "Harvard's famous intro CS lectures, free and incredibly clear.",
      },
      {
        title: 'freeCodeCamp',
        source: 'YouTube',
        url: 'https://www.youtube.com/@freecodecamp',
        kind: 'Channel',
        note: 'Full-length courses on almost every language and topic.',
      },
      {
        title: 'Crash Course Computer Science',
        source: 'YouTube',
        url: youtubeSearch('crash course computer science'),
        kind: 'Series',
        note: 'How computers actually work, from logic gates to algorithms.',
      },
    ],
    reading: [
      {
        title: 'CS50x course notes',
        source: 'Harvard',
        url: 'https://cs50.harvard.edu/x/',
        kind: 'Free textbook',
        note: 'Lecture notes, problem sets and shorts, all free online.',
      },
      {
        title: 'The Python Tutorial',
        source: 'Python.org',
        url: 'https://docs.python.org/3/tutorial/',
        kind: 'Study guide',
        note: 'The official, beginner-friendly guide to Python.',
      },
      {
        title: 'VisuAlgo',
        source: 'National University of Singapore',
        url: 'https://visualgo.net/',
        kind: 'Tool',
        note: 'Watch sorting algorithms and data structures run, step by step.',
      },
    ],
    specialPrompt: {
      title: 'Predict the output',
      text: 'Quiz me for my computer science final on {topic}. Show me short code snippets and ask me to predict the output or find the bug before you reveal it. Explain each answer by tracing the code line by line.',
    },
  },
  {
    id: 'languages',
    name: 'Languages',
    emoji: '🌎',
    examples: 'Spanish, French & more',
    topicExample: 'e.g. past tense verbs',
    searchTerm: 'spanish',
    promptName: 'language',
    videos: [
      {
        title: 'Dreaming Spanish',
        source: 'YouTube',
        url: 'https://www.youtube.com/@DreamingSpanish',
        kind: 'Channel',
        note: 'Comprehensible input videos sorted by level. Train your listening fast.',
      },
      {
        title: 'Butterfly Spanish',
        source: 'YouTube',
        url: youtubeSearch('butterfly spanish'),
        kind: 'Channel',
        note: 'Friendly grammar lessons for beginners and intermediate learners.',
      },
      {
        title: 'Easy Languages',
        source: 'YouTube',
        url: youtubeSearch('easy languages street interviews'),
        kind: 'Series',
        note: 'Real street interviews with subtitles in many languages.',
      },
    ],
    reading: [
      {
        title: 'SpanishDict',
        source: 'SpanishDict',
        url: 'https://www.spanishdict.com/',
        kind: 'Study guide',
        note: 'Dictionary, full conjugation tables and grammar guides in one place.',
      },
      {
        title: 'WordReference',
        source: 'WordReference',
        url: 'https://www.wordreference.com/',
        kind: 'Tool',
        note: 'Dictionaries and forums for Spanish, French, German, Italian and more.',
      },
      {
        title: 'BBC Mundo',
        source: 'BBC',
        url: 'https://www.bbc.com/mundo',
        kind: 'Articles',
        note: 'Real news in Spanish. Read one short article a day to build vocabulary.',
      },
      {
        title: 'Conjuguemos',
        source: 'Conjuguemos',
        url: 'https://conjuguemos.com/',
        kind: 'Practice',
        note: 'Free verb conjugation and vocabulary drills.',
      },
    ],
    specialPrompt: {
      title: 'Conversation partner',
      text: 'Be my conversation partner for my language final. Speak only in simple [Spanish] at my level, about everyday situations that use {topic}. After each of my replies, correct my mistakes in English in one short line, then keep the conversation going.',
    },
  },
  {
    id: 'other',
    name: 'Something else',
    emoji: '✏️',
    examples: 'Type your subject',
    topicExample: 'e.g. the topic you fear most',
    searchTerm: '',
    promptName: '',
    videos: [
      {
        title: 'Crash Course',
        source: 'YouTube',
        url: 'https://www.youtube.com/@crashcourse',
        kind: 'Channel',
        note: 'Fun intro courses on dozens of subjects. Check the playlists.',
      },
      {
        title: 'Khan Academy',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/',
        kind: 'Course',
        note: 'Free lessons and practice across math, science, humanities and more.',
      },
      {
        title: 'MIT OpenCourseWare',
        source: 'MIT',
        url: 'https://ocw.mit.edu/',
        kind: 'Course',
        note: 'Real MIT lectures and notes, free. Great for college-level subjects.',
      },
    ],
    reading: [
      {
        title: 'OpenStax subjects',
        source: 'OpenStax',
        url: 'https://openstax.org/subjects',
        kind: 'Free textbook',
        note: 'Free, peer-reviewed textbooks for dozens of college and high school courses.',
      },
      {
        title: 'LibreTexts',
        source: 'LibreTexts',
        url: 'https://libretexts.org/',
        kind: 'Free textbook',
        note: 'A huge open library of textbooks. Search for your subject.',
      },
      {
        title: 'The Conversation',
        source: 'The Conversation',
        url: 'https://theconversation.com/us',
        kind: 'Articles',
        note: 'Short articles written by professors, explaining their fields in plain English.',
      },
    ],
    specialPrompt: {
      title: 'Teach me like a tutor',
      text: 'Be my tutor for {topic}. First ask me 3 quick questions to see what I already know. Then teach me the most important ideas in order, one at a time, checking my understanding after each one before moving on.',
    },
  },
]

export function getSubject(id: string | null): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

export const STUDY_TOOLS: Resource[] = [
  {
    title: 'Anki',
    source: 'AnkiWeb',
    url: 'https://apps.ankiweb.net/',
    kind: 'Tool',
    note: 'Free flashcards that schedule reviews right before you would forget.',
  },
  {
    title: 'Quizlet',
    source: 'Quizlet',
    url: 'https://quizlet.com/',
    kind: 'Tool',
    note: 'Make flashcards fast, or find sets other students already made.',
  },
]
