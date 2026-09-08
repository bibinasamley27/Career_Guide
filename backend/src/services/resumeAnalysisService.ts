import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { z } from 'zod';
import { createAiProvider } from '../ai';
import prisma from '../lib/prisma';
import { ValidationError } from '../middleware/errorHandler';
import { resumeParsedDataSchema } from '../schemas/resume';

const MAX_EXTRACTED_TEXT_LENGTH = 20000;

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

const extractPdfTextFallback = (buffer: Buffer) => {
  const raw = buffer.toString('latin1');
  const matches = Array.from(raw.matchAll(/\(([^\\()]*(?:\\.[^\\()]*)*)\)/g))
    .map((match) => match[1].replace(/\\([0-7]{1,3}|\(|\)|\\|n|r|t|b|f)/g, ''))
    .filter(Boolean);

  return matches.join(' ');
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const makeStructuredFallback = async (text: string) => {
  const skillCatalog = await prisma.skill.findMany({ select: { name: true } });
  const interestCatalog = await prisma.interest.findMany({ select: { name: true } });
  const skillNames = skillCatalog.map((skill) => skill.name).sort((a, b) => b.length - a.length);
  const interestNames = interestCatalog.map((interest) => interest.name).sort((a, b) => b.length - a.length);

  const foundSkills = [...new Set(skillNames.filter((skill) => new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(text)))];
  const foundInterests = [...new Set(interestNames.filter((interest) => new RegExp(`\\b${escapeRegExp(interest)}\\b`, 'i').test(text)))];

  const matches = Array.from(text.matchAll(/(?:B\.?E\.?|B\.Tech|B\.Sc|B\.S\.?|M\.?S\.?|M\.Tech|MCA|Diploma|Bachelor|Master|PhD)[^\n]{0,120}/gi)).map((entry) => entry[0].trim()).slice(0, 5);
  const education = matches.length ? matches.map((entry) => ({ degree: entry })) : [];

  const experience = text.split(/\n+/).filter((line) => line.trim().length > 20 && !/education|skills|project|certif|summary|experience/i.test(line)).slice(0, 3).map((line) => ({
    role: 'Experience',
    description: line.trim(),
    technologies: foundSkills.slice(0, 5),
  }));

  const projectMatches = text.split(/\n+/).filter((line) => /project|portfolio|app|dashboard|platform|system/i.test(line)).slice(0, 3);
  const projects = projectMatches.map((line) => ({ title: line.trim(), description: line.trim(), technologies: foundSkills.slice(0, 5), role: 'Contributor' }));

  const certifications = text.split(/\n+/).filter((line) => /certif|aws|azure|gcp|google|oracle|cloud|scrum|pmp|sql/i.test(line)).slice(0, 3);
  const achievementMatches = text.split(/\n+/).filter((line) => /award|winner|top|achieved|recognized|featured/i.test(line)).slice(0, 3);

  const keywords = Array.from(new Set(text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [])).slice(0, 20);

  return {
    personalSummary: text.slice(0, 500) || null,
    education,
    experience,
    skills: foundSkills.length ? foundSkills : ['Programming'],
    projects,
    certifications: certifications.length ? certifications : [],
    achievements: achievementMatches.length ? achievementMatches : [],
    interests: foundInterests,
    languages: /\b(english|hindi|spanish|french|german)\b/i.test(text) ? ['English'] : [],
    extractedKeywords: keywords,
  };
};

const currentPrompt = `You are extracting a student resume into structured JSON. Use only information visible in the resume. Do not invent missing data. Return valid JSON with this structure: {
  "personalSummary": string | null,
  "education": [{"degree": string | null, "institution": string | null, "field": string | null, "startYear": number | null, "endYear": number | null}],
  "experience": [{"role": string | null, "organization": string | null, "duration": string | null, "description": string | null, "technologies": [string]}],
  "skills": [string],
  "projects": [{"title": string | null, "description": string | null, "technologies": [string], "role": string | null}],
  "certifications": [string],
  "achievements": [string],
  "interests": [string],
  "languages": [string],
  "extractedKeywords": [string]
}`;

export const normalizeResumeParsedData = (value: unknown): z.infer<typeof resumeParsedDataSchema> => {
  const parsed = resumeParsedDataSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError('The resume could not be parsed into a valid structure.');
  }
  return parsed.data;
};

export const extractTextFromResume = async (file: { originalname: string; buffer: Buffer; mimetype: string }) => {
  const originalName = file.originalname.toLowerCase();
  const isPdf = originalName.endsWith('.pdf') || file.mimetype === 'application/pdf' || file.mimetype.includes('pdf');
  const isDocx = originalName.endsWith('.docx') || file.mimetype.includes('word') || file.mimetype.includes('docx');

  if (!isPdf && !isDocx) {
    throw new ValidationError('Unsupported file type. Please upload a PDF or DOCX resume.');
  }

  let text = '';

  try {
    if (isPdf) {
      const rawFallback = extractPdfTextFallback(file.buffer);
      try {
        const pdfData = new Uint8Array(file.buffer);
        const pdf = await pdfjsLib.getDocument({ data: pdfData, standardFontDataUrl: undefined }).promise;
        const pages: string[] = [];
        for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
          const page = await pdf.getPage(pageIndex);
          const content = await page.getTextContent();
          const contentText = content.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
          pages.push(contentText);
        }
        text = pages.join('\n');
      } catch {
        text = rawFallback;
      }
      if (!text.trim()) {
        text = rawFallback;
      }
    }

    if (isDocx && !text) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value || '';
    }
  } catch (error) {
    if (isPdf) {
      text = extractPdfTextFallback(file.buffer);
    }
    if (!text.trim()) {
      throw new ValidationError('Your resume could not be read. Please upload a text-based PDF or DOCX.');
    }
  }

  const cleanedText = normalizeWhitespace(text);
  if (!cleanedText || cleanedText.length < 10) {
    throw new ValidationError('This resume appears to be image-based. Please upload a text-readable PDF or DOCX.');
  }

  return cleanedText.slice(0, MAX_EXTRACTED_TEXT_LENGTH);
};

export const analyzeResumeText = async (resumeText: string) => {
  const provider = createAiProvider();
  const normalizedText = normalizeWhitespace(resumeText);

  if (!provider) {
    return makeStructuredFallback(normalizedText);
  }

  try {
    const response = await Promise.race([
      provider.generate({
        systemInstruction: currentPrompt,
        messages: [{ role: 'user', content: `Extract structured resume information from this resume text:\n\n${normalizedText}` }],
        tools: [],
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Gemini resume extraction timed out')), 1500);
      }),
    ]);

    const responseText = response.text || '';
    if (!responseText) {
      return makeStructuredFallback(normalizedText);
    }

    const parsed = JSON.parse(responseText);
    return normalizeResumeParsedData(parsed);
  } catch {
    return makeStructuredFallback(normalizedText);
  }
};
