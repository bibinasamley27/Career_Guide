-- CreateTable
CREATE TABLE "resource_skills" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_skills" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resource_skills_resourceId_idx" ON "resource_skills"("resourceId");

-- CreateIndex
CREATE INDEX "resource_skills_skillId_idx" ON "resource_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "resource_skills_resourceId_skillId_key" ON "resource_skills"("resourceId", "skillId");

-- CreateIndex
CREATE INDEX "project_skills_projectId_idx" ON "project_skills"("projectId");

-- CreateIndex
CREATE INDEX "project_skills_skillId_idx" ON "project_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "project_skills_projectId_skillId_key" ON "project_skills"("projectId", "skillId");

-- AddForeignKey
ALTER TABLE "resource_skills" ADD CONSTRAINT "resource_skills_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_skills" ADD CONSTRAINT "resource_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "project_recommendations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
