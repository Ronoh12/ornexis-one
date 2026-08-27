-- CreateTable
CREATE TABLE "workflow_definitions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_states" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workflow_definition_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_initial" BOOLEAN NOT NULL DEFAULT false,
    "is_terminal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_transitions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workflow_definition_id" UUID NOT NULL,
    "from_state_id" UUID NOT NULL,
    "to_state_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "requires_approval" BOOLEAN NOT NULL DEFAULT false,
    "condition_config" JSONB,
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workflow_definition_id" UUID NOT NULL,
    "current_state_id" UUID NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "started_by_organization_user_id" UUID,
    "completed_by_organization_user_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "context_data" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_history" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workflow_instance_id" UUID NOT NULL,
    "from_state_id" UUID,
    "to_state_id" UUID NOT NULL,
    "actor_organization_user_id" UUID,
    "action" TEXT NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_steps" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workflow_definition_id" UUID NOT NULL,
    "workflow_state_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "approver_type" TEXT NOT NULL,
    "approver_config" JSONB,
    "minimum_approvals" INTEGER NOT NULL DEFAULT 1,
    "allow_self_approval" BOOLEAN NOT NULL DEFAULT false,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_decisions" (
    "id" UUID NOT NULL,
    "organization_id" UUID NOT NULL,
    "workflow_instance_id" UUID NOT NULL,
    "approval_step_id" UUID NOT NULL,
    "approver_organization_user_id" UUID NOT NULL,
    "decision" TEXT NOT NULL,
    "comment" TEXT,
    "metadata" JSONB,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "approval_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workflow_definitions_organization_id_idx" ON "workflow_definitions"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_definitions_organization_id_entity_type_idx" ON "workflow_definitions"("organization_id", "entity_type");

-- CreateIndex
CREATE INDEX "workflow_definitions_organization_id_is_active_idx" ON "workflow_definitions"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_id_organization_id_key" ON "workflow_definitions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_definitions_organization_id_code_version_key" ON "workflow_definitions"("organization_id", "code", "version");

-- CreateIndex
CREATE INDEX "workflow_states_organization_id_idx" ON "workflow_states"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_states_organization_id_workflow_definition_id_idx" ON "workflow_states"("organization_id", "workflow_definition_id");

-- CreateIndex
CREATE INDEX "workflow_states_workflow_definition_id_position_idx" ON "workflow_states"("workflow_definition_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_states_id_organization_id_key" ON "workflow_states"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_states_workflow_definition_id_code_key" ON "workflow_states"("workflow_definition_id", "code");

-- CreateIndex
CREATE INDEX "workflow_transitions_organization_id_idx" ON "workflow_transitions"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_transitions_organization_id_workflow_definition_id_idx" ON "workflow_transitions"("organization_id", "workflow_definition_id");

-- CreateIndex
CREATE INDEX "workflow_transitions_workflow_definition_id_from_state_id_idx" ON "workflow_transitions"("workflow_definition_id", "from_state_id");

-- CreateIndex
CREATE INDEX "workflow_transitions_workflow_definition_id_to_state_id_idx" ON "workflow_transitions"("workflow_definition_id", "to_state_id");

-- CreateIndex
CREATE INDEX "workflow_transitions_organization_id_is_active_idx" ON "workflow_transitions"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_transitions_id_organization_id_key" ON "workflow_transitions"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_transitions_workflow_definition_id_code_key" ON "workflow_transitions"("workflow_definition_id", "code");

-- CreateIndex
CREATE INDEX "workflow_instances_organization_id_idx" ON "workflow_instances"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_instances_organization_id_workflow_definition_id_idx" ON "workflow_instances"("organization_id", "workflow_definition_id");

-- CreateIndex
CREATE INDEX "workflow_instances_organization_id_entity_type_entity_id_idx" ON "workflow_instances"("organization_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "workflow_instances_organization_id_status_idx" ON "workflow_instances"("organization_id", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_organization_id_current_state_id_idx" ON "workflow_instances"("organization_id", "current_state_id");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_instances_id_organization_id_key" ON "workflow_instances"("id", "organization_id");

-- CreateIndex
CREATE INDEX "workflow_history_organization_id_idx" ON "workflow_history"("organization_id");

-- CreateIndex
CREATE INDEX "workflow_history_organization_id_workflow_instance_id_idx" ON "workflow_history"("organization_id", "workflow_instance_id");

-- CreateIndex
CREATE INDEX "workflow_history_organization_id_occurred_at_idx" ON "workflow_history"("organization_id", "occurred_at");

-- CreateIndex
CREATE INDEX "workflow_history_workflow_instance_id_occurred_at_idx" ON "workflow_history"("workflow_instance_id", "occurred_at");

-- CreateIndex
CREATE UNIQUE INDEX "workflow_history_id_organization_id_key" ON "workflow_history"("id", "organization_id");

-- CreateIndex
CREATE INDEX "approval_steps_organization_id_idx" ON "approval_steps"("organization_id");

-- CreateIndex
CREATE INDEX "approval_steps_organization_id_workflow_definition_id_idx" ON "approval_steps"("organization_id", "workflow_definition_id");

-- CreateIndex
CREATE INDEX "approval_steps_workflow_definition_id_workflow_state_id_idx" ON "approval_steps"("workflow_definition_id", "workflow_state_id");

-- CreateIndex
CREATE INDEX "approval_steps_organization_id_is_active_idx" ON "approval_steps"("organization_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_id_organization_id_key" ON "approval_steps"("id", "organization_id");

-- CreateIndex
CREATE UNIQUE INDEX "approval_steps_workflow_definition_id_code_key" ON "approval_steps"("workflow_definition_id", "code");

-- CreateIndex
CREATE INDEX "approval_decisions_organization_id_idx" ON "approval_decisions"("organization_id");

-- CreateIndex
CREATE INDEX "approval_decisions_organization_id_workflow_instance_id_idx" ON "approval_decisions"("organization_id", "workflow_instance_id");

-- CreateIndex
CREATE INDEX "approval_decisions_organization_id_approval_step_id_idx" ON "approval_decisions"("organization_id", "approval_step_id");

-- CreateIndex
CREATE INDEX "approval_decisions_organization_id_approver_organization_us_idx" ON "approval_decisions"("organization_id", "approver_organization_user_id");

-- CreateIndex
CREATE INDEX "approval_decisions_workflow_instance_id_decided_at_idx" ON "approval_decisions"("workflow_instance_id", "decided_at");

-- CreateIndex
CREATE UNIQUE INDEX "approval_decisions_id_organization_id_key" ON "approval_decisions"("id", "organization_id");

-- AddForeignKey
ALTER TABLE "workflow_definitions" ADD CONSTRAINT "workflow_definitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_states" ADD CONSTRAINT "workflow_states_workflow_definition_id_organization_id_fkey" FOREIGN KEY ("workflow_definition_id", "organization_id") REFERENCES "workflow_definitions"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_workflow_definition_id_organization_i_fkey" FOREIGN KEY ("workflow_definition_id", "organization_id") REFERENCES "workflow_definitions"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_from_state_id_organization_id_fkey" FOREIGN KEY ("from_state_id", "organization_id") REFERENCES "workflow_states"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_to_state_id_organization_id_fkey" FOREIGN KEY ("to_state_id", "organization_id") REFERENCES "workflow_states"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_workflow_definition_id_organization_id_fkey" FOREIGN KEY ("workflow_definition_id", "organization_id") REFERENCES "workflow_definitions"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_current_state_id_organization_id_fkey" FOREIGN KEY ("current_state_id", "organization_id") REFERENCES "workflow_states"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_started_by_organization_user_id_organiz_fkey" FOREIGN KEY ("started_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_completed_by_organization_user_id_organ_fkey" FOREIGN KEY ("completed_by_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_workflow_instance_id_organization_id_fkey" FOREIGN KEY ("workflow_instance_id", "organization_id") REFERENCES "workflow_instances"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_from_state_id_organization_id_fkey" FOREIGN KEY ("from_state_id", "organization_id") REFERENCES "workflow_states"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_to_state_id_organization_id_fkey" FOREIGN KEY ("to_state_id", "organization_id") REFERENCES "workflow_states"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_history" ADD CONSTRAINT "workflow_history_actor_organization_user_id_organization_i_fkey" FOREIGN KEY ("actor_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflow_definition_id_organization_id_fkey" FOREIGN KEY ("workflow_definition_id", "organization_id") REFERENCES "workflow_definitions"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_workflow_state_id_organization_id_fkey" FOREIGN KEY ("workflow_state_id", "organization_id") REFERENCES "workflow_states"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_workflow_instance_id_organization_id_fkey" FOREIGN KEY ("workflow_instance_id", "organization_id") REFERENCES "workflow_instances"("id", "organization_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_approval_step_id_organization_id_fkey" FOREIGN KEY ("approval_step_id", "organization_id") REFERENCES "approval_steps"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_decisions" ADD CONSTRAINT "approval_decisions_approver_organization_user_id_organizat_fkey" FOREIGN KEY ("approver_organization_user_id", "organization_id") REFERENCES "organization_users"("id", "organization_id") ON DELETE RESTRICT ON UPDATE CASCADE;
