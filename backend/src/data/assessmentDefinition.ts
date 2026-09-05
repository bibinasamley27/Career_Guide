import { z } from 'zod';

export const assessmentQuestions = [
  {
    id: 'technicalInterests',
    question: 'Which technical areas hold your attention?',
    description: 'Choose the areas you would be most excited to explore.',
    type: 'multiple',
    options: [
      { value: 'Web Development', label: 'Web Development' },
      { value: 'Artificial Intelligence & Machine Learning', label: 'Artificial Intelligence' },
      { value: 'Data Science & Analytics', label: 'Data and analytics' },
      { value: 'Cybersecurity & Ethical Hacking', label: 'Cybersecurity' },
      { value: 'Cloud & Infrastructure', label: 'Cloud and DevOps' },
      { value: 'UI/UX Design', label: 'UI/UX design' },
      { value: 'Backend Architecture', label: 'Software and backend systems' },
      { value: 'Business Analysis', label: 'Business and analysis' },
    ],
    required: true,
    maxSelections: 5,
  },
  {
    id: 'workPreferences',
    question: 'How do you prefer to contribute?',
    description: 'Select the kinds of work you would like to do regularly.',
    type: 'multiple',
    options: [
      { value: 'building_applications', label: 'Build applications' },
      { value: 'analyzing_data', label: 'Analyze data' },
      { value: 'solving_technical_problems', label: 'Solve technical problems' },
      { value: 'designing_user_experiences', label: 'Design user experiences' },
      { value: 'managing_systems', label: 'Manage systems' },
      { value: 'researching_technology', label: 'Research new technology' },
      { value: 'working_with_business_requirements', label: 'Work with people and business requirements' },
    ],
    required: true,
    maxSelections: 4,
  },
  {
    id: 'problemSolvingPreferences',
    question: 'What kinds of problems energize you?',
    description: 'There is no wrong answer. Pick the problems you naturally want to untangle.',
    type: 'multiple',
    options: [
      { value: 'logical_algorithmic', label: 'Logical and algorithmic problems' },
      { value: 'creative_design', label: 'Creative and design problems' },
      { value: 'data_driven', label: 'Data-driven problems' },
      { value: 'systems_infrastructure', label: 'Systems and infrastructure problems' },
      { value: 'security', label: 'Security problems' },
      { value: 'business', label: 'Business problems' },
    ],
    required: true,
    maxSelections: 3,
  },
  {
    id: 'learningPreference',
    question: 'How do you learn best?',
    description: 'Choose up to three formats that help concepts stick.',
    type: 'multiple',
    options: [
      { value: 'video_tutorials', label: 'Video tutorials' },
      { value: 'hands_on_projects', label: 'Hands-on projects' },
      { value: 'documentation', label: 'Documentation' },
      { value: 'courses', label: 'Courses' },
      { value: 'books_articles', label: 'Books and articles' },
      { value: 'practice_problems', label: 'Practice problems' },
    ],
    required: true,
    maxSelections: 3,
  },
  {
    id: 'careerGoal',
    question: 'What would you like your career to move toward?',
    description: 'Choose the direction that best describes your current goal.',
    type: 'single',
    options: [
      { value: 'software_development', label: 'Get a software development job' },
      { value: 'ai_ml', label: 'Become an AI/ML professional' },
      { value: 'data', label: 'Work in data' },
      { value: 'product_building', label: 'Build products' },
      { value: 'cybersecurity', label: 'Work in cybersecurity' },
      { value: 'cloud_devops', label: 'Become a cloud/DevOps professional' },
      { value: 'explore_technology', label: 'Explore technology careers' },
    ],
    required: true,
  },
  {
    id: 'confidenceLevel',
    question: 'How confident are you with technology today?',
    description: 'Use the scale that feels most honest right now.',
    type: 'rating',
    options: [
      { value: '1', label: '1 - Beginner' },
      { value: '2', label: '2 - Basic' },
      { value: '3', label: '3 - Intermediate' },
      { value: '4', label: '4 - Good' },
      { value: '5', label: '5 - Very confident' },
    ],
    required: true,
  },
  {
    id: 'workEnvironment',
    question: 'Which work environments appeal to you?',
    description: 'Select up to three environments where you could do your best work.',
    type: 'multiple',
    options: [
      { value: 'individual_technical', label: 'Individual technical work' },
      { value: 'team_development', label: 'Team-based development' },
      { value: 'research_oriented', label: 'Research-oriented work' },
      { value: 'creative_work', label: 'Creative work' },
      { value: 'business_technology', label: 'Business and technology' },
      { value: 'fast_paced_startup', label: 'Fast-paced startup' },
      { value: 'structured_organization', label: 'Structured organization' },
    ],
    required: true,
    maxSelections: 3,
  },
] as const;

const allowedValues = (questionId: string) => {
  const question = assessmentQuestions.find((item) => item.id === questionId);
  return question ? question.options.map((option) => option.value) : [];
};

const multipleAnswer = (questionId: string, maxSelections: number) =>
  z.array(z.string()).min(1).max(maxSelections).superRefine((values, context) => {
    const allowed = allowedValues(questionId);
    if (new Set(values).size !== values.length) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Answers cannot be duplicated' });
    }
    if (values.some((value) => !allowed.includes(value as never))) {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Contains an invalid option' });
    }
  });

const singleAnswer = (questionId: string) =>
  z.string().refine((value) => allowedValues(questionId).includes(value as never), 'Contains an invalid option');

export const assessmentAnswersSchema = z
  .object({
    technicalInterests: multipleAnswer('technicalInterests', 5),
    workPreferences: multipleAnswer('workPreferences', 4),
    problemSolvingPreferences: multipleAnswer('problemSolvingPreferences', 3),
    learningPreference: multipleAnswer('learningPreference', 3),
    careerGoal: singleAnswer('careerGoal'),
    confidenceLevel: z.number().int().min(1).max(5),
    workEnvironment: multipleAnswer('workEnvironment', 3),
  })
  .strict();

export const assessmentSubmissionSchema = z.object({ answers: assessmentAnswersSchema }).strict();
export type AssessmentAnswers = z.infer<typeof assessmentAnswersSchema>;
