import { PrismaClient, SkillProficiency, SkillImportance, ResourceType, ResourceLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ==========================================
  // 1. INTERESTS CATALOG
  // ==========================================
  const interestsData = [
    { name: 'Web Development', category: 'Engineering' },
    { name: 'Backend Architecture', category: 'Engineering' },
    { name: 'Cloud & Infrastructure', category: 'Engineering' },
    { name: 'Mobile App Development', category: 'Engineering' },
    { name: 'Data Science & Analytics', category: 'Data & Intelligence' },
    { name: 'Artificial Intelligence & Machine Learning', category: 'Data & Intelligence' },
    { name: 'Big Data & Pipelines', category: 'Data & Intelligence' },
    { name: 'Cybersecurity & Ethical Hacking', category: 'Security & Systems' },
    { name: 'Operating Systems & Networks', category: 'Security & Systems' },
    { name: 'UI/UX Design', category: 'Product & Design' },
    { name: 'Product Management', category: 'Product & Design' },
    { name: 'Business Analysis', category: 'Product & Design' },
    { name: 'Problem Solving & Algorithms', category: 'Engineering' },
  ];

  const interestMap = new Map<string, string>();
  for (const item of interestsData) {
    const interest = await prisma.interest.upsert({
      where: { name: item.name },
      update: { category: item.category },
      create: item,
    });
    interestMap.set(interest.name, interest.id);
  }
  console.log(`✅ Seeded ${interestMap.size} interests.`);

  // ==========================================
  // 2. SKILLS CATALOG
  // ==========================================
  const skillsData = [
    // Languages
    { name: 'JavaScript', category: 'Programming Languages' },
    { name: 'TypeScript', category: 'Programming Languages' },
    { name: 'Python', category: 'Programming Languages' },
    { name: 'SQL', category: 'Programming Languages' },
    { name: 'HTML/CSS', category: 'Programming Languages' },
    { name: 'Java', category: 'Programming Languages' },
    { name: 'Go', category: 'Programming Languages' },

    // Frontend
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Frontend' },

    // Backend & DB
    { name: 'Node.js', category: 'Backend' },
    { name: 'Express.js', category: 'Backend' },
    { name: 'REST APIs', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Backend' },
    { name: 'MongoDB', category: 'Backend' },
    { name: 'Redis', category: 'Backend' },

    // Data & ML
    { name: 'Pandas', category: 'Data & ML' },
    { name: 'NumPy', category: 'Data & ML' },
    { name: 'Scikit-Learn', category: 'Data & ML' },
    { name: 'PyTorch', category: 'Data & ML' },
    { name: 'Data Visualization', category: 'Data & ML' },
    { name: 'Statistical Modeling', category: 'Data & ML' },

    // AI & GenAI
    { name: 'Large Language Models', category: 'AI & GenAI' },
    { name: 'Prompt Engineering', category: 'AI & GenAI' },
    { name: 'RAG Systems', category: 'AI & GenAI' },
    { name: 'Vector Databases', category: 'AI & GenAI' },

    // DevOps & Cloud
    { name: 'Git & GitHub', category: 'DevOps & Cloud' },
    { name: 'Docker', category: 'DevOps & Cloud' },
    { name: 'Kubernetes', category: 'DevOps & Cloud' },
    { name: 'Linux', category: 'DevOps & Cloud' },
    { name: 'AWS', category: 'DevOps & Cloud' },
    { name: 'CI/CD Pipelines', category: 'DevOps & Cloud' },

    // Security
    { name: 'Network Security', category: 'Security' },
    { name: 'Vulnerability Assessment', category: 'Security' },
    { name: 'Web Security (OWASP)', category: 'Security' },
    { name: 'Cryptography Fundamentals', category: 'Security' },

    // Design & Product
    { name: 'Figma', category: 'Design & Product' },
    { name: 'UI Wireframing & Prototyping', category: 'Design & Product' },
    { name: 'User Research', category: 'Design & Product' },
    { name: 'Design Systems', category: 'Design & Product' },
    { name: 'Agile & Scrum Methodologies', category: 'Design & Product' },
    { name: 'Requirements Gathering & User Stories', category: 'Design & Product' },
  ];

  const skillMap = new Map<string, string>();
  for (const item of skillsData) {
    const skill = await prisma.skill.upsert({
      where: { name: item.name },
      update: { category: item.category },
      create: item,
    });
    skillMap.set(skill.name, skill.id);
  }
  console.log(`✅ Seeded ${skillMap.size} skills.`);

  // ==========================================
  // 3. CURATED RESOURCES (Grounded Official URLs)
  // ==========================================
  const resourcesData = [
    {
      title: 'MDN Web Docs: Web Development Tutorials',
      type: ResourceType.DOCUMENTATION,
      url: 'https://developer.mozilla.org',
      provider: 'Mozilla MDN',
      level: ResourceLevel.BEGINNER,
    },
    {
      title: 'React Official Documentation',
      type: ResourceType.DOCUMENTATION,
      url: 'https://react.dev',
      provider: 'React Core Team',
      level: ResourceLevel.INTERMEDIATE,
    },
    {
      title: 'The Python Official Tutorial',
      type: ResourceType.TUTORIAL,
      url: 'https://docs.python.org/3/tutorial/',
      provider: 'Python Software Foundation',
      level: ResourceLevel.BEGINNER,
    },
    {
      title: 'PostgreSQL Official Documentation',
      type: ResourceType.DOCUMENTATION,
      url: 'https://www.postgresql.org/docs/',
      provider: 'PostgreSQL Global Development Group',
      level: ResourceLevel.INTERMEDIATE,
    },
    {
      title: 'Docker Official Getting Started Guide',
      type: ResourceType.DOCUMENTATION,
      url: 'https://docs.docker.com/get-started/',
      provider: 'Docker',
      level: ResourceLevel.BEGINNER,
    },
    {
      title: 'OWASP Top 10 Web Application Security Risks',
      type: ResourceType.DOCUMENTATION,
      url: 'https://owasp.org/www-project-top-ten/',
      provider: 'OWASP Foundation',
      level: ResourceLevel.INTERMEDIATE,
    },
    {
      title: 'freeCodeCamp Responsive Web Design Certification',
      type: ResourceType.COURSE,
      url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
      provider: 'freeCodeCamp',
      level: ResourceLevel.BEGINNER,
    },
    {
      title: 'Scikit-learn User Guide and Machine Learning in Python',
      type: ResourceType.DOCUMENTATION,
      url: 'https://scikit-learn.org/stable/user_guide.html',
      provider: 'Scikit-learn Developers',
      level: ResourceLevel.INTERMEDIATE,
    },
    {
      title: 'Pro Git Book & Official Documentation',
      type: ResourceType.BOOK,
      url: 'https://git-scm.com/doc',
      provider: 'Git SCM',
      level: ResourceLevel.ALL_LEVELS,
    },
  ];

  const resourceMap = new Map<string, string>();
  for (const item of resourcesData) {
    const existing = await prisma.resource.findFirst({
      where: { title: item.title },
    });
    const resource = existing
      ? await prisma.resource.update({
          where: { id: existing.id },
          data: item,
        })
      : await prisma.resource.create({
          data: item,
        });
    resourceMap.set(resource.title, resource.id);
  }
  console.log(`✅ Seeded ${resourceMap.size} learning resources.`);

  // ==========================================
  // 4. BASELINE CAREERS (12 Baseline Careers from SDD)
  // ==========================================
  interface CareerSeedConfig {
    title: string;
    domain: string;
    description: string;
    skills: { name: string; importance: SkillImportance; minProficiency: SkillProficiency }[];
    interests: { name: string; weight: number }[];
    resources: { title: string; relevance: string }[];
    projects: { title: string; description: string; difficulty: SkillProficiency }[];
  }

  const careersData: CareerSeedConfig[] = [
    {
      title: 'Software Developer',
      domain: 'Software Engineering',
      description:
        'Builds, tests, and maintains software applications and systems across multiple platforms, applying core computer science fundamentals, data structures, and software architecture patterns.',
      skills: [
        { name: 'Git & GitHub', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'JavaScript', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'SQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.BEGINNER },
        { name: 'TypeScript', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'REST APIs', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Linux', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
      ],
      interests: [
        { name: 'Web Development', weight: 1.0 },
        { name: 'Problem Solving & Algorithms', weight: 1.0 },
        { name: 'Backend Architecture', weight: 0.8 },
      ],
      resources: [
        { title: 'MDN Web Docs: Web Development Tutorials', relevance: 'Core web fundamentals' },
        { title: 'Pro Git Book & Official Documentation', relevance: 'Version control workflows' },
      ],
      projects: [
        {
          title: 'CLI Task Manager with File Persistence',
          description: 'A robust command-line application supporting CRUD task operations, category tagging, and JSON/file storage.',
          difficulty: SkillProficiency.BEGINNER,
        },
        {
          title: 'RESTful Inventory Management API',
          description: 'A backend service featuring database persistence, input validation, structured error handling, and automated integration tests.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Frontend Developer',
      domain: 'Software Engineering',
      description:
        'Specializes in building responsive, accessible, and high-performance user interfaces for web applications using modern web technologies and client-side frameworks.',
      skills: [
        { name: 'HTML/CSS', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'JavaScript', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'TypeScript', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'React', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Tailwind CSS', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Git & GitHub', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
      ],
      interests: [
        { name: 'Web Development', weight: 1.0 },
        { name: 'UI/UX Design', weight: 0.9 },
        { name: 'Problem Solving & Algorithms', weight: 0.7 },
      ],
      resources: [
        { title: 'MDN Web Docs: Web Development Tutorials', relevance: 'HTML, CSS, and JS reference' },
        { title: 'React Official Documentation', relevance: 'Component state, hooks, and architecture' },
        { title: 'freeCodeCamp Responsive Web Design Certification', relevance: 'Responsive layout exercises' },
      ],
      projects: [
        {
          title: 'Responsive Personal Portfolio & Project Showcase',
          description: 'An interactive portfolio featuring mobile-first responsive design, theme toggling, and accessible UI components.',
          difficulty: SkillProficiency.BEGINNER,
        },
        {
          title: 'Interactive Dashboard with API Integration',
          description: 'A React and TypeScript dashboard consuming live third-party APIs with loading skeletons, error states, and filtering.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Backend Developer',
      domain: 'Software Engineering',
      description:
        'Designs, implements, and optimizes server-side logic, databases, APIs, and microservices architecture to power robust and scalable applications.',
      skills: [
        { name: 'Node.js', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Express.js', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'PostgreSQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'SQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'REST APIs', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Docker', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
        { name: 'Redis', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
      ],
      interests: [
        { name: 'Backend Architecture', weight: 1.0 },
        { name: 'Web Development', weight: 0.8 },
        { name: 'Operating Systems & Networks', weight: 0.7 },
      ],
      resources: [
        { title: 'PostgreSQL Official Documentation', relevance: 'Relational data modeling and indexing' },
        { title: 'Docker Official Getting Started Guide', relevance: 'Containerizing backend services' },
      ],
      projects: [
        {
          title: 'Authentication & Role-Based Access Service',
          description: 'A secure backend service featuring JWT authentication, refresh tokens, password hashing, and role-based route guards.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
        {
          title: 'High-Throughput URL Shortener with Redis Caching',
          description: 'A scalable URL shortening engine with rate limiting, database persistence, and Redis caching for low-latency lookups.',
          difficulty: SkillProficiency.ADVANCED,
        },
      ],
    },
    {
      title: 'Full Stack Developer',
      domain: 'Software Engineering',
      description:
        'Bridges frontend user experience and backend services, developing end-to-end web applications with proficiency across client technologies, server frameworks, and data persistence.',
      skills: [
        { name: 'JavaScript', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'TypeScript', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'React', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Node.js', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'PostgreSQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'REST APIs', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Git & GitHub', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
      ],
      interests: [
        { name: 'Web Development', weight: 1.0 },
        { name: 'Backend Architecture', weight: 0.9 },
        { name: 'UI/UX Design', weight: 0.7 },
      ],
      resources: [
        { title: 'MDN Web Docs: Web Development Tutorials', relevance: 'Full web platform reference' },
        { title: 'React Official Documentation', relevance: 'Frontend application structure' },
        { title: 'PostgreSQL Official Documentation', relevance: 'Data persistence and query optimization' },
      ],
      projects: [
        {
          title: 'Full Stack E-Commerce / Marketplace Prototype',
          description: 'An end-to-end web application with catalog browsing, shopping cart state management, checkout processing, and admin dashboard.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Data Analyst',
      domain: 'Data Science & Analytics',
      description:
        'Inspects, cleans, transforms, and models data to discover meaningful trends, produce actionable business intelligence, and create executive dashboards and reports.',
      skills: [
        { name: 'SQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Python', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Pandas', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Data Visualization', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Statistical Modeling', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
      ],
      interests: [
        { name: 'Data Science & Analytics', weight: 1.0 },
        { name: 'Business Analysis', weight: 0.9 },
        { name: 'Problem Solving & Algorithms', weight: 0.7 },
      ],
      resources: [
        { title: 'The Python Official Tutorial', relevance: 'Python scripting for data wrangling' },
        { title: 'PostgreSQL Official Documentation', relevance: 'Complex SQL queries and aggregations' },
      ],
      projects: [
        {
          title: 'Exploratory Sales & Customer Trend Analysis',
          description: 'A comprehensive data analysis notebook examining retail transactions, seasonal patterns, and customer retention cohorts.',
          difficulty: SkillProficiency.BEGINNER,
        },
        {
          title: 'Interactive BI Dashboard with Metric Visualizations',
          description: 'An analytical dashboard translating raw SQL database extracts into key performance indicators and trend charts.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Data Scientist',
      domain: 'Data Science & Analytics',
      description:
        'Applies advanced statistical methods, data modeling, exploratory data analysis, and predictive modeling to extract actionable insights from complex structured and unstructured datasets.',
      skills: [
        { name: 'Python', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'SQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Pandas', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'NumPy', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Scikit-Learn', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Statistical Modeling', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
      ],
      interests: [
        { name: 'Data Science & Analytics', weight: 1.0 },
        { name: 'Artificial Intelligence & Machine Learning', weight: 0.9 },
        { name: 'Problem Solving & Algorithms', weight: 0.8 },
      ],
      resources: [
        { title: 'The Python Official Tutorial', relevance: 'Python programming mastery' },
        { title: 'Scikit-learn User Guide and Machine Learning in Python', relevance: 'Statistical modeling workflows' },
      ],
      projects: [
        {
          title: 'Predictive Churn Modeling with Supervised Learning',
          description: 'Feature engineering and cross-validated classification models to predict customer churn, evaluated by ROC-AUC and F1-score.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Machine Learning Engineer',
      domain: 'Artificial Intelligence',
      description:
        'Designs, trains, deploys, and optimizes machine learning models and scalable inference pipelines that run efficiently in production systems.',
      skills: [
        { name: 'Python', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'PyTorch', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Scikit-Learn', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Docker', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Git & GitHub', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Linux', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.INTERMEDIATE },
      ],
      interests: [
        { name: 'Artificial Intelligence & Machine Learning', weight: 1.0 },
        { name: 'Data Science & Analytics', weight: 0.8 },
        { name: 'Cloud & Infrastructure', weight: 0.7 },
      ],
      resources: [
        { title: 'Scikit-learn User Guide and Machine Learning in Python', relevance: 'ML algorithms and validation' },
        { title: 'Docker Official Getting Started Guide', relevance: 'Containerizing ML inference services' },
      ],
      projects: [
        {
          title: 'Containerized Model Serving API',
          description: 'A FastAPI service wrapping a trained PyTorch/Scikit-learn model, deployed in a lightweight Docker container.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'AI Engineer',
      domain: 'Artificial Intelligence',
      description:
        'Builds intelligent applications integrating large language models, agentic workflows, embeddings, vector databases, and retrieval-augmented generation (RAG) systems.',
      skills: [
        { name: 'Python', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Large Language Models', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Prompt Engineering', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'RAG Systems', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Vector Databases', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.BEGINNER },
        { name: 'REST APIs', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
      ],
      interests: [
        { name: 'Artificial Intelligence & Machine Learning', weight: 1.0 },
        { name: 'Web Development', weight: 0.8 },
        { name: 'Problem Solving & Algorithms', weight: 0.8 },
      ],
      resources: [
        { title: 'The Python Official Tutorial', relevance: 'Core language proficiency' },
      ],
      projects: [
        {
          title: 'Retrieval-Augmented Generation (RAG) Document Assistant',
          description: 'An AI assistant that ingests PDF documents, chunks text, creates embeddings in a vector store, and answers grounded questions.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Cybersecurity Analyst',
      domain: 'Cybersecurity',
      description:
        'Protects computer networks, applications, and data systems from unauthorized access, cyber threats, vulnerabilities, and security breaches through threat modeling and monitoring.',
      skills: [
        { name: 'Network Security', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Web Security (OWASP)', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Vulnerability Assessment', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Linux', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Cryptography Fundamentals', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
      ],
      interests: [
        { name: 'Cybersecurity & Ethical Hacking', weight: 1.0 },
        { name: 'Operating Systems & Networks', weight: 0.9 },
        { name: 'Problem Solving & Algorithms', weight: 0.7 },
      ],
      resources: [
        { title: 'OWASP Top 10 Web Application Security Risks', relevance: 'Web vulnerability analysis' },
      ],
      projects: [
        {
          title: 'Automated Web Vulnerability Scanner',
          description: 'A Python script scanning HTTP endpoints for security headers, SSL certificates, and common OWASP misconfigurations.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Cloud/DevOps Engineer',
      domain: 'Cloud & Infrastructure',
      description:
        'Automates deployment pipelines, provisions infrastructure as code, and manages cloud environments to ensure high availability, scalability, and security of software systems.',
      skills: [
        { name: 'Linux', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Docker', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Kubernetes', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'CI/CD Pipelines', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'AWS', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Git & GitHub', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
      ],
      interests: [
        { name: 'Cloud & Infrastructure', weight: 1.0 },
        { name: 'Operating Systems & Networks', weight: 0.9 },
        { name: 'Backend Architecture', weight: 0.7 },
      ],
      resources: [
        { title: 'Docker Official Getting Started Guide', relevance: 'Container builds and multi-stage workflows' },
        { title: 'Pro Git Book & Official Documentation', relevance: 'Git branching and automation strategies' },
      ],
      projects: [
        {
          title: 'Automated CI/CD Pipeline with GitHub Actions & Docker',
          description: 'A complete continuous integration and delivery pipeline that builds, tests, and publishes container images upon code merge.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'UI/UX Designer',
      domain: 'Product & Design',
      description:
        'Researches user behaviors and crafts intuitive user journeys, wireframes, interactive prototypes, design systems, and visually compelling product experiences.',
      skills: [
        { name: 'Figma', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'UI Wireframing & Prototyping', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'User Research', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Design Systems', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'HTML/CSS', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
      ],
      interests: [
        { name: 'UI/UX Design', weight: 1.0 },
        { name: 'Product Management', weight: 0.7 },
        { name: 'Web Development', weight: 0.6 },
      ],
      resources: [
        { title: 'freeCodeCamp Responsive Web Design Certification', relevance: 'Understanding CSS layout constraints' },
      ],
      projects: [
        {
          title: 'Comprehensive Mobile Banking App Prototype',
          description: 'A Figma design system, clickable interactive prototype, and usability test report for a mobile personal finance app.',
          difficulty: SkillProficiency.INTERMEDIATE,
        },
      ],
    },
    {
      title: 'Product/Business Analyst',
      domain: 'Product & Design',
      description:
        'Bridges technical development teams and business stakeholders by analyzing market requirements, defining product specifications, and translating business goals into actionable roadmaps.',
      skills: [
        { name: 'Requirements Gathering & User Stories', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'Agile & Scrum Methodologies', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.ADVANCED },
        { name: 'SQL', importance: SkillImportance.REQUIRED, minProficiency: SkillProficiency.INTERMEDIATE },
        { name: 'Data Visualization', importance: SkillImportance.PREFERRED, minProficiency: SkillProficiency.BEGINNER },
      ],
      interests: [
        { name: 'Product Management', weight: 1.0 },
        { name: 'Business Analysis', weight: 1.0 },
        { name: 'Data Science & Analytics', weight: 0.6 },
      ],
      resources: [
        { title: 'PostgreSQL Official Documentation', relevance: 'Data exploration queries for business metrics' },
      ],
      projects: [
        {
          title: 'Product Requirement Document (PRD) & Roadmap',
          description: 'A comprehensive PRD including user personas, functional specifications, acceptance criteria, and KPI metrics.',
          difficulty: SkillProficiency.BEGINNER,
        },
      ],
    },
  ];

  for (const careerData of careersData) {
    const career = await prisma.career.upsert({
      where: { title: careerData.title },
      update: {
        domain: careerData.domain,
        description: careerData.description,
      },
      create: {
        title: careerData.title,
        domain: careerData.domain,
        description: careerData.description,
      },
    });

    // Seed CareerSkill mappings
    for (const skillItem of careerData.skills) {
      const skillId = skillMap.get(skillItem.name);
      if (skillId) {
        await prisma.careerSkill.upsert({
          where: {
            careerId_skillId: {
              careerId: career.id,
              skillId,
            },
          },
          update: {
            importance: skillItem.importance,
            minProficiency: skillItem.minProficiency,
          },
          create: {
            careerId: career.id,
            skillId,
            importance: skillItem.importance,
            minProficiency: skillItem.minProficiency,
          },
        });
      }
    }

    // Seed CareerInterest mappings
    for (const interestItem of careerData.interests) {
      const interestId = interestMap.get(interestItem.name);
      if (interestId) {
        await prisma.careerInterest.upsert({
          where: {
            careerId_interestId: {
              careerId: career.id,
              interestId,
            },
          },
          update: {
            weight: interestItem.weight,
          },
          create: {
            careerId: career.id,
            interestId,
            weight: interestItem.weight,
          },
        });
      }
    }

    // Seed CareerResource mappings
    for (const resourceItem of careerData.resources) {
      const resourceId = resourceMap.get(resourceItem.title);
      if (resourceId) {
        await prisma.careerResource.upsert({
          where: {
            careerId_resourceId: {
              careerId: career.id,
              resourceId,
            },
          },
          update: {
            relevance: resourceItem.relevance,
          },
          create: {
            careerId: career.id,
            resourceId,
            relevance: resourceItem.relevance,
          },
        });
      }
    }

    // Seed Project Recommendations
    for (const projectItem of careerData.projects) {
      const existing = await prisma.projectRecommendation.findFirst({
        where: {
          careerId: career.id,
          title: projectItem.title,
        },
      });

      if (!existing) {
        await prisma.projectRecommendation.create({
          data: {
            careerId: career.id,
            title: projectItem.title,
            description: projectItem.description,
            difficulty: projectItem.difficulty,
          },
        });
      }
    }

    console.log(`  ✓ Seeded career: ${career.title}`);
  }

  console.log(`✅ Seeded all ${careersData.length} baseline careers successfully.`);
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

