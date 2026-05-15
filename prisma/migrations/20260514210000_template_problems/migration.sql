-- CreateTable: ordered problem lists per study plan / topic template
CREATE TABLE "template_problems" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "problemId" UUID NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "template_problems_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "template_problems_templateId_problemId_key" ON "template_problems"("templateId", "problemId");

CREATE UNIQUE INDEX "template_problems_templateId_order_key" ON "template_problems"("templateId", "order");

CREATE INDEX "template_problems_problemId_idx" ON "template_problems"("problemId");

ALTER TABLE "template_problems" ADD CONSTRAINT "template_problems_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "schedule_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template_problems" ADD CONSTRAINT "template_problems_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
