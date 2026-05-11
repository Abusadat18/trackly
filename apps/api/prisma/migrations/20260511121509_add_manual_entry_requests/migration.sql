-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "manual_entry_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "task_id" TEXT,
    "description" TEXT,
    "reason" TEXT NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "reject_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_entry_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_entry_requests_org_id_status_idx" ON "manual_entry_requests"("org_id", "status");

-- CreateIndex
CREATE INDEX "manual_entry_requests_user_id_idx" ON "manual_entry_requests"("user_id");

-- AddForeignKey
ALTER TABLE "manual_entry_requests" ADD CONSTRAINT "manual_entry_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_entry_requests" ADD CONSTRAINT "manual_entry_requests_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_entry_requests" ADD CONSTRAINT "manual_entry_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_entry_requests" ADD CONSTRAINT "manual_entry_requests_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_entry_requests" ADD CONSTRAINT "manual_entry_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
