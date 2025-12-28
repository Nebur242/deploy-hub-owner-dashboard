import { BaseEntity } from "./base";
import { Category } from "./category";
import { TechStack, Visibility } from "../enums/project";
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
