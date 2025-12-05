export interface Admin {
  id: string;
  username: string;
  email: string;
  isMasterAdmin: boolean;
  isActive: boolean;
  avatar?: string;
  permissions: AdminPermissions;
  createdAt: string;
  lastLoginAt?: string;
  _count?: {
    whitelists: number;
  };
}

export interface AdminPermissions {
  canViewDashboard: boolean;
  canViewWhitelists: boolean;
  canViewTemplates: boolean;
  canViewAdmins: boolean;
  canViewAnalytics: boolean;
  canManageWhitelists: boolean;
  canManageTemplates: boolean;
  canManageAdmins: boolean;
}

export enum ExperienceLevel {
  DEBUTANT = 'DEBUTANT',
  INTERMEDIAIRE = 'INTERMEDIAIRE',
  EXPERIMENTE = 'EXPERIMENTE'
}

export enum WhitelistCategory {
  LEGAL = 'LEGAL',
  ILLEGAL = 'ILLEGAL'
}

export enum WhitelistStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum WhitelistDecision {
  ACCEPTED = 'ACCEPTED',
  REFUSED = 'REFUSED',
  WAITING = 'WAITING'
}

export enum TemplateType {
  MANDATORY_QUESTION = 'MANDATORY_QUESTION',
  SCENARIO = 'SCENARIO',
  RULES_QUESTION = 'RULES_QUESTION',
  LEXICON = 'LEXICON'
}

export interface Whitelist {
  id: string;
  candidateFirstname: string;
  candidateLastname: string;
  candidateDiscord: string;
  candidateAge: number;
  experienceLevel: ExperienceLevel;
  category: WhitelistCategory;
  status: WhitelistStatus;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  totalScore?: number;
  scenarioScore?: number;
  rulesScore?: number;
  decision?: WhitelistDecision;
  decisionReason?: string;
  customMessage?: string;
  reexamDate?: string;
  adminNotes?: string;
  adminId: string;
  admin: {
    id: string;
    username: string;
    avatar?: string;
  };
  answers?: Answer[];
  comments?: Comment[];
  activityLogs?: ActivityLog[];
  _count?: {
    comments: number;
    answers: number;
  };
}

export interface Template {
  id: string;
  type: TemplateType;
  category?: WhitelistCategory;
  question: string;
  answer?: string;
  isActive: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    username: string;
  };
}

export interface Answer {
  id: string;
  whitelistId: string;
  templateId: string;
  template: Template;
  candidateAnswer?: string;
  isCorrect?: boolean;
  score?: number;
  notes?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  whitelistId: string;
  adminId: string;
  admin: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  mentions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  adminId: string;
  admin: {
    id: string;
    username: string;
  };
  whitelistId?: string;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  today: {
    accepted: number;
    refused: number;
    waiting: number;
    pending: number;
  };
  week: {
    accepted: number;
    refused: number;
    waiting: number;
  };
  month: {
    accepted: number;
    refused: number;
    waiting: number;
  };
  successRate: number;
  topAdmins: Array<{
    id: string;
    username: string;
    avatar?: string;
    whitelistCount: number;
  }>;
  categoryStats: Array<{
    category: WhitelistCategory;
    count: number;
  }>;
  evolution: Array<{
    date: string;
    accepted: number;
    refused: number;
    total: number;
  }>;
}

export interface AdvancedAnalytics {
  global: {
    total: number;
    accepted: number;
    refused: number;
    acceptanceRate: number;
    avgScoreAccepted: number;
    avgScoreRefused: number;
  };
  byAdmin: Array<{
    id: string;
    username: string;
    avatar?: string;
    totalWhitelists: number;
    acceptanceRate: number;
    avgDuration: number;
  }>;
  byCategory: Array<{
    category: WhitelistCategory;
    total: number;
    acceptanceRate: number;
    avgScore: number;
  }>;
}
