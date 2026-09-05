export interface SkillGapStudentSkill {
  name: string;
  proficiency: string;
}

export interface SkillGapCareerSkill {
  name: string;
  importance: 'REQUIRED' | 'PREFERRED';
  minProficiency: string;
}

export interface SkillGapInput {
  careerId: string;
  careerName: string;
  careerSkills: SkillGapCareerSkill[];
  studentSkills: SkillGapStudentSkill[];
}

export interface SkillGapItem {
  name: string;
  studentProficiency?: string;
  requiredProficiency: string;
  importance: 'REQUIRED' | 'PREFERRED';
}

export interface PrioritySkill extends SkillGapItem {
  priority: 'HIGH' | 'MEDIUM';
  reason: string;
}

export interface SkillGapResult {
  careerId: string;
  careerName: string;
  existingSkills: SkillGapItem[];
  missingSkills: SkillGapItem[];
  partialSkills: SkillGapItem[];
  totalRequiredSkills: number;
  matchedSkillCount: number;
  missingSkillCount: number;
  skillCoverage: number;
  prioritySkills: PrioritySkill[];
}

const proficiencyRank: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const calculateSkillGap = (input: SkillGapInput): SkillGapResult => {
  const studentSkills = new Map(input.studentSkills.map((skill) => [normalize(skill.name), skill.proficiency]));
  const existingSkills: SkillGapItem[] = [];
  const missingSkills: SkillGapItem[] = [];
  const partialSkills: SkillGapItem[] = [];

  for (const careerSkill of input.careerSkills) {
    const studentProficiency = studentSkills.get(normalize(careerSkill.name));
    const item = {
      name: careerSkill.name,
      studentProficiency,
      requiredProficiency: careerSkill.minProficiency,
      importance: careerSkill.importance,
    } satisfies SkillGapItem;

    if (!studentProficiency) {
      missingSkills.push(item);
    } else if ((proficiencyRank[studentProficiency] || 0) >= (proficiencyRank[careerSkill.minProficiency] || 1)) {
      existingSkills.push(item);
    } else {
      partialSkills.push(item);
    }
  }

  const matchedSkillCount = existingSkills.length;
  const totalRequiredSkills = input.careerSkills.length;
  const skillCoverage = totalRequiredSkills === 0 ? 0 : Math.round((matchedSkillCount / totalRequiredSkills) * 100);
  const prioritySkills = [...missingSkills, ...partialSkills]
    .map((skill) => ({
      ...skill,
      priority: skill.importance === 'REQUIRED' ? 'HIGH' as const : 'MEDIUM' as const,
      reason: skill.importance === 'REQUIRED'
        ? 'Required by the career knowledge base.'
        : 'Preferred supporting skill in the career knowledge base.',
    }))
    .sort((left, right) => (left.priority === 'HIGH' ? 0 : 1) - (right.priority === 'HIGH' ? 0 : 1) || left.name.localeCompare(right.name));

  return {
    careerId: input.careerId,
    careerName: input.careerName,
    existingSkills,
    missingSkills,
    partialSkills,
    totalRequiredSkills,
    matchedSkillCount,
    missingSkillCount: missingSkills.length,
    skillCoverage,
    prioritySkills,
  };
};
