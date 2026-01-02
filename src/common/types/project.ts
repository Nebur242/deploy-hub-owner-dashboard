import { BaseEntity } from "./base";
import { Category } from "./category";
import { TechStack, Visibility, ModerationStatus } from "../enums/project";
import { LicenseOption } from "./license";
import { ProjectConfiguration } from "./configuration";

// Project entity
export interface Project extends BaseEntity {
  name: string;
  description: string;
  slug: string;
  owner_id: string;
  repository: string;
  tech_stack: TechStack[];
  visibility: Visibility;
  // Moderation fields
  moderation_status: ModerationStatus;
  moderation_note?: string;
  moderated_by?: string;
  moderated_at?: string;
  submitted_for_review_at?: string;
  // Pending changes fields (for approved projects with edits awaiting review)
  pending_changes?: Record<string, unknown> | null;
  has_pending_changes?: boolean;
  pending_changes_submitted_at?: string | null;
  // Relations
  categories: Category[];
  versions?: ProjectVersion[];
  configurations?: ProjectConfiguration[];
  licenses?: LicenseOption[];
  preview_url?: string;
  image?: string | null;
}

// Project Version entity
export interface ProjectVersion extends BaseEntity {
  project_id: string;
  version: string;
  release_notes: string;
  commit_hash?: string;
  is_latest: boolean;
  is_stable: boolean;
  project: Project;
}
