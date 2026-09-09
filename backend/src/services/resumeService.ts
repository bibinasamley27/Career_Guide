import { Prisma } from '@prisma/client';
import { createAiProvider } from '../ai';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { findResumeByUserId, findResumeByIdForUser, createResumeRecord, updateResumeRecord, deleteResumeRecord, findResumeById } from '../repositories/resumeRepository';
import { resumeRoadmapResponseSchema, ResumeRoadmapResponse } from '../schemas/resumeRoadmap';
import { analyzeResumeText, extractTextFromResume, normalizeResumeParsedData } from './resumeAnalysisService';

export type ResumeAnalysisStatus = 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

const uniqueStrings = (items: Array<string | null | undefined>) => Array.from(new Set(items.filter((item): item is string => Boolean(item && item.trim())).map((item) => item.trim())));

const normalizeResumeSkills = (parsedData: Record<string, unknown>) => {
  const skills = Array.isArray(parsedData.skills) ? parsedData.skills : [];
  const experience = Array.isArray(parsedData.experience) ? parsedData.experience : [];
  const projects = Array.isArray(parsedData.projects) ? parsedData.projects : [];
  const techEntries = [
    ...experience.flatMap((item) => (typeof item === 'object' && item && 'technologies' in item ? ((item as { technologies?: string[] }).technologies || []) : [])),
    ...projects.flatMap((item) => (typeof item === 'object' && item && 'technologies' in item ? ((item as { technologies?: string[] }).technologies || []) : [])),
  ];
  return uniqueStrings([...(skills as string[]), ...techEntries]).slice(0, 20);
};

const inferCareerDirection = (parsedData: Record<string, unknown>) => {
  const skills = normalizeResumeSkills(parsedData).join(' ').toLowerCase();
  if (/(react|next|javascript|typescript|node|express|html|css|tailwind|api|frontend|backend)/.test(skills)) {
    return 'Full-stack web development';
  }
  if (/(python|sql|pandas|tableau|power bi|excel|data|analytics|ml|machine learning)/.test(skills)) {
    return 'Data and analytics';
  }
  if (/(aws|azure|docker|kubernetes|linux|terraform|devops|cloud|ci|cd)/.test(skills)) {
    return 'Cloud and DevOps';
  }
  if (/(java|spring|c\+\+|c#|backend|api|microservices)/.test(skills)) {
    return 'Backend engineering';
  }
  return 'Software engineering';
};

const buildResumeRoadmapFallback = (resumeId: string, parsedData: Record<string, unknown>): ResumeRoadmapResponse => {
  const skills = normalizeResumeSkills(parsedData);
  const strengths = skills.length ? skills.slice(0, 6) : ['Problem solving', 'Learning agility'];
  const careerDirection = inferCareerDirection(parsedData);
  const directionSkills: Record<string, string[]> = {
    'Full-stack web development': ['Node.js', 'Express.js', 'REST APIs', 'PostgreSQL', 'Testing', 'Deployment'],
    'Data and analytics': ['Python', 'SQL', 'Data visualization', 'Statistical analysis', 'Machine learning basics', 'Portfolio storytelling'],
    'Cloud and DevOps': ['Docker', 'Linux', 'CI/CD', 'Cloud deployment', 'Infrastructure as code', 'Monitoring'],
    'Backend engineering': ['REST APIs', 'System design', 'Database modeling', 'Testing', 'Caching', 'Message queues'],
    'Software engineering': ['Problem solving', 'System design', 'Version control', 'Testing', 'Debugging', 'Documentation'],
  };
  const recommended = directionSkills[careerDirection] || directionSkills['Software engineering'];
  const alreadyHave = strengths.filter((skill) => recommended.some((option) => option.toLowerCase() === skill.toLowerCase() || (skill.toLowerCase().includes(option.toLowerCase()) && option.length > 4)));
  const buildNext = recommended.filter((skill) => !skills.some((existing) => existing.toLowerCase() === skill.toLowerCase() || existing.toLowerCase().includes(skill.toLowerCase()))).slice(0, 4);
  const gaps = [
    ...alreadyHave.map((skill) => ({ name: skill, status: 'ALREADY_HAVE' as const, priority: 'HIGH' as const, reason: `Your resume already shows ${skill} as part of your current foundation.` })),
    ...buildNext.map((skill, index) => ({ name: skill, status: 'BUILD_NEXT' as const, priority: (index === 0 ? 'HIGH' : 'MEDIUM') as 'HIGH' | 'MEDIUM', reason: `This skill helps connect your existing work to the next layer of ${careerDirection.toLowerCase()}.` })),
  ];

  const stageSkills = [strengths.slice(0, 3), buildNext.slice(0, 3), recommended.slice(0, 3), ['Portfolio project', 'Documentation', 'GitHub'], ['Interview prep', 'Resume refinement', 'Career targeting']];

  return {
    source: 'resume',
    resumeId,
    careerDirection,
    currentStrengths: strengths,
    skillGaps: gaps.length ? gaps : [{ name: 'Portfolio visibility', status: 'BUILD_NEXT', priority: 'HIGH', reason: 'A clear portfolio is the fastest way to turn your resume into proof of readiness.' }],
    roadmap: [
      {
        stageNumber: 1,
        title: 'Build on your foundation',
        objective: `Strengthen the core strengths already visible in your resume so they become reliable proof of readiness in ${careerDirection.toLowerCase()}.`,
        skills: stageSkills[0],
        topics: ['Core fundamentals', 'Best practices', 'Refining your strengths'],
        estimatedDuration: '2-3 weeks',
        practice: `Review and improve at least two projects or experiences that showcase ${strengths.slice(0, 2).join(' and ')}.`,
        project: `Create a small project that demonstrates your current strengths in ${careerDirection.toLowerCase()}.`,
        completionCriteria: 'You can explain your strongest resume skills clearly and connect them to one concrete project outcome.',
        whyThisComesNext: `Your resume already shows ${strengths.slice(0, 2).join(' and ')}. This stage focuses on making those strengths more visible and repeatable before you add new capabilities.`,
      },
      {
        stageNumber: 2,
        title: 'Close the most important gaps',
        objective: `Add the next set of skills that sit directly between your current resume and the work expected in ${careerDirection.toLowerCase()}.`,
        skills: stageSkills[1].length ? stageSkills[1] : ['Technical depth', 'Project delivery'],
        topics: ['Skill gap closure', 'Applied learning', 'Execution patterns'],
        estimatedDuration: '3-4 weeks',
        practice: `Practice one focused exercise for each missing skill and document what you built and what changed.`,
        project: `Build a small end-to-end deliverable that uses at least two skills from your gap list.`,
        completionCriteria: 'You can complete a practical task using the new skill without relying on templates or copy-paste examples.',
        whyThisComesNext: `The gap list is based only on what your resume suggests you already know and what logically needs to come next for ${careerDirection.toLowerCase()}.`,
      },
      {
        stageNumber: 3,
        title: 'Deepen your specialization',
        objective: `Turn broad experience into more relevant depth for ${careerDirection.toLowerCase()} and the kinds of projects hiring teams expect.`,
        skills: recommended.slice(0, 3),
        topics: ['Advanced patterns', 'Domain knowledge', 'Scalable implementation'],
        estimatedDuration: '4-6 weeks',
        practice: `Create a prototype or internal exercise that connects your current experience to a realistic professional problem.`,
        project: `Develop a portfolio project with a real workflow, metrics, and a clear end-user outcome.`,
        completionCriteria: 'Your work shows a clearer specialization, not just a collection of disconnected tools.',
        whyThisComesNext: `You have enough baseline capability from the resume to move from general experience to more convincing specialization in ${careerDirection.toLowerCase()}.`,
      },
      {
        stageNumber: 4,
        title: 'Build proof',
        objective: 'Turn your learning into evidence by shipping work that demonstrates decision-making, delivery, and technical implementation.',
        skills: ['Project planning', 'Implementation', 'Documentation'],
        topics: ['Feature design', 'Iteration', 'Writing technical outcomes'],
        estimatedDuration: '3-5 weeks',
        practice: 'Ship one polished proof-of-work project and document the decisions behind it.',
        project: 'Deliver a project that shows the full workflow from idea to deployment and reflection.',
        completionCriteria: 'The project is visible, understandable, and clearly linked to the resume-derived direction.',
        whyThisComesNext: `The resume already documents experience, but a memorable project helps connect that experience to a job-ready narrative in ${careerDirection.toLowerCase()}.`,
      },
      {
        stageNumber: 5,
        title: 'Prepare for your next role',
        objective: 'Package your story, portfolio, and readiness so your resume and experience align with the target direction.',
        skills: ['Resume refinement', 'Interview preparation', 'Portfolio polish'],
        topics: ['Role targeting', 'Storytelling', 'Communication'],
        estimatedDuration: '2-3 weeks',
        practice: 'Prepare your project explanations, resume bullets, and interview examples around the skills you already have.',
        project: 'Refine your summary, projects, and profile so the strongest evidence from your resume stands out clearly.',
        completionCriteria: 'You can explain your current strengths, the most important gaps, and the next role you are targeting with confidence.',
        whyThisComesNext: `This is the best next step after building on your existing resume: translate what you already demonstrated into a cleaner professional story.`,
      },
    ],
  };
};

const generateResumeRoadmapViaAi = async (resumeId: string, parsedData: Record<string, unknown>): Promise<ResumeRoadmapResponse> => {
  const provider = createAiProvider();
  if (!provider) {
    return buildResumeRoadmapFallback(resumeId, parsedData);
  }

  const payload = {
    education: parsedData.education || [],
    skills: normalizeResumeSkills(parsedData),
    experience: parsedData.experience || [],
    projects: parsedData.projects || [],
    certifications: parsedData.certifications || [],
    resumeDerivedCareerDirection: inferCareerDirection(parsedData),
    resumeDerivedStrengths: normalizeResumeSkills(parsedData).slice(0, 8),
    resumeDerivedGaps: ['Technical depth', 'Portfolio proof', 'Targeted specialization'],
  };

  const prompt = `Use only the resume data provided. Return valid JSON matching this structure: {"source":"resume","resumeId":"string","careerDirection":"string","currentStrengths":["string"],"skillGaps":[{"name":"string","status":"ALREADY_HAVE|BUILD_NEXT|MISSING_DEVELOP","priority":"HIGH|MEDIUM|LOW","reason":"string"}],"roadmap":[{"stageNumber":1,"title":"string","objective":"string","skills":["string"],"topics":["string"],"estimatedDuration":"string","practice":"string","project":"string","completionCriteria":"string","whyThisComesNext":"string"}]} . Use realistic stages grounded in the resume, not generic claims. Keep the roadmap concise and relevant.`;

  try {
    const response = await Promise.race([
      provider.generate({
        systemInstruction: prompt,
        messages: [{ role: 'user', content: JSON.stringify(payload) }],
        tools: [],
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini resume roadmap timed out')), 1500);
      }),
    ]);
    const raw = response.text || '';
    if (!raw.trim()) {
      return buildResumeRoadmapFallback(resumeId, parsedData);
    }

    const parsed = JSON.parse(raw);
    const validated = resumeRoadmapResponseSchema.safeParse({ ...parsed, resumeId, source: 'resume' });
    if (!validated.success) {
      return buildResumeRoadmapFallback(resumeId, parsedData);
    }
    return validated.data;
  } catch {
    return buildResumeRoadmapFallback(resumeId, parsedData);
  }
};

export const validateResumeUpload = (file: Express.Multer.File | undefined) => {
  if (!file) throw new ValidationError('Please attach a resume file.');
  if (file.size <= 0) throw new ValidationError('The uploaded resume is empty.');
  if (file.size > 5 * 1024 * 1024) {
    throw new ValidationError('Resume file is too large. Maximum size is 5MB.');
  }

  const isPdf = file.originalname.toLowerCase().endsWith('.pdf') || file.mimetype === 'application/pdf';
  const isDocx = file.originalname.toLowerCase().endsWith('.docx') || file.mimetype.includes('word');
  if (!isPdf && !isDocx) {
    throw new ValidationError('Unsupported file type. Please upload a PDF or DOCX resume.');
  }

  return file;
};

const summarizeResume = (resume: Awaited<ReturnType<typeof findResumeByUserId>>) => {
  if (!resume) return null;
  return {
    id: resume.id,
    userId: resume.userId,
    originalFileName: resume.originalFileName,
    fileType: resume.fileType,
    fileSize: resume.fileSize,
    extractedText: resume.extractedText,
    parsedData: (resume.parsedData && typeof resume.parsedData === 'object' ? resume.parsedData : {}) as Record<string, unknown>,
    analysisStatus: resume.analysisStatus,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
};

export const CreateResumeUpload = async (userId: string, file: Express.Multer.File) => {
  const extractedText = await extractTextFromResume({
    originalname: file.originalname,
    buffer: file.buffer,
    mimetype: file.mimetype,
  });

  const parsedData = await analyzeResumeText(extractedText);
  const normalizedParsedData = normalizeResumeParsedData(parsedData);

  const resume = await createResumeRecord(userId, {
    originalFileName: file.originalname,
    fileType: file.mimetype || file.originalname.split('.').pop() || 'application/octet-stream',
    fileSize: file.size,
    extractedText,
    parsedData: normalizedParsedData as Prisma.InputJsonValue,
    analysisStatus: 'COMPLETED',
  });

  return {
    analysisStatus: resume.analysisStatus,
    resume: summarizeResume(resume),
  };
};

export const getResumeSummaryForUser = async (userId: string) => {
  const resume = await findResumeByUserId(userId);
  return {
    resume: summarizeResume(resume),
  };
};

export const getResumeByIdForUser = async (userId: string, resumeId: string) => {
  const resume = await findResumeByIdForUser(userId, resumeId);
  if (!resume) throw new ValidationError('Resume not found.');
  return summarizeResume(resume);
};

export const removeResumeForUser = async (userId: string, resumeId: string) => {
  const resume = await findResumeByIdForUser(userId, resumeId);
  if (!resume) throw new ValidationError('Resume not found.');
  await deleteResumeRecord(resume.id);
  return { message: 'Resume deleted successfully.' };
};

export const updateResumeForUser = async (userId: string, resumeId: string, input: Record<string, unknown>) => {
  const resume = await findResumeByIdForUser(userId, resumeId);
  if (!resume) throw new ValidationError('Resume not found.');

  const parsedData = normalizeResumeParsedData({ ...(resume.parsedData as Record<string, unknown>), ...input });
  const updated = await updateResumeRecord(resume.id, {
    parsedData: parsedData as Prisma.InputJsonValue,
    analysisStatus: 'COMPLETED',
  });
  return summarizeResume(updated);
};

export const getResumeById = async (resumeId: string) => {
  const resume = await findResumeById(resumeId);
  if (!resume) throw new ValidationError('Resume not found.');
  return summarizeResume(resume);
};

export const getResumeRoadmapForUser = async (userId: string) => {
  const resume = await findResumeByUserId(userId);
  if (!resume) {
    throw new NotFoundError('No analyzed resume found. Analyze your resume first.');
  }

  const parsedData = normalizeResumeParsedData(resume.parsedData as Record<string, unknown>);
  return generateResumeRoadmapViaAi(resume.id, parsedData as Record<string, unknown>);
};
