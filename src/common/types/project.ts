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
  ownerId: string;
  repository: string;
  techStack: TechStack[];
  visibility: Visibility;
  categories: Category[];
  versions?: ProjectVersion[];
  configurations?: ProjectConfiguration[];
  licenses?: LicenseOption[];
}

// Project Version entity
export interface ProjectVersion extends BaseEntity {
  projectId: string;
  version: string;
  releaseNotes: string;
  commitHash?: string;
  isLatest: boolean;
  isStable: boolean;
  project: Project;
}