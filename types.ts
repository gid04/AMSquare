
export enum View {
  DASHBOARD = 'DASHBOARD',
  ANALYST = 'ANALYST',
  REPORTS = 'REPORTS',
  TEAM = 'TEAM',
  REGULATIONS = 'REGULATIONS',
  AUTOMATIONS = 'AUTOMATIONS',
  SETTINGS = 'SETTINGS',
  TRANSACTIONS = 'TRANSACTIONS',
  HELP_CENTER = 'HELP_CENTER',
  BUSINESS = 'BUSINESS',
  NOTIFICATIONS = 'NOTIFICATIONS'
}

export interface User {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: 'active' | 'offline' | 'busy';
}

// Extended User type for Team Management
export interface ManagedUser extends User {
    email?: string;
    accessLevel?: 'Admin' | 'Manager' | 'Editor' | 'Viewer';
    joinedDate?: string;
    invitationDeadline?: string;
    residency?: string;
    // Compensation Data
    salary?: number;
    paymentFrequency?: 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
    paymentDate?: string; // e.g., "1st of month", "Friday", "2024-01-01"
    amsid?: string; // Unique 8-char ID for internal transfers
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  businessName: string;
  niche: string;
  location: string;
  legalStructure: string;
  operationRange: string[];
  size: string;
  isFreshSignup: boolean;
  hasConnectedBank?: boolean;
  completedRequirements?: string[]; // Track IDs of completed onboarding tasks
  // New Settings Fields
  theme?: 'light' | 'dark';
  language?: string;
  agentName?: string;
  agentPersonality?: string;
  agentModel?: string;
  billingAddress?: string;
  primaryAddress?: string;
  legalDetails?: { label: string; value: string }[];
  // Team Data for Regulations
  staffResidencies?: string[];
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  billingPeriod: 'Daily' | 'Monthly' | 'Quarterly' | 'Yearly' | 'One-time';
  paymentMethods: string[];
  supportedCountries: string[];
  platforms: string[];
}

export interface Service {
  id: string;
  type: 'Service' | 'Product';
  name: string;
  description: string;
  price?: number;
  frequency?: 'Daily' | 'Monthly' | 'Yearly' | 'One-time' | 'Hourly';
  plans?: Plan[];
  status: 'Active' | 'Archived' | 'Draft';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  senderId?: string; // 'user', 'agent', or specific staff ID
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string; // For UI badge
  text: string;
  timestamp: Date | string; // Allow string for JSON parsed dates
  isStreaming?: boolean;
  attachments?: string[];
  // Action Request Properties
  requestType?: 'add_staff';
  requestData?: any; // e.g., the staff member object to add
  requestStatus?: 'pending' | 'approved' | 'denied';
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: number; // Timestamp for sorting
  messages: ChatMessage[];
  participants?: ManagedUser[]; // List of staff members added to this chat
}

export interface Metric {
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface AutomationRule {
  id: number;
  name: string;
  active: boolean;
  condition: string;
  action: string;
  lastRun: string;
  source: 'manual' | 'agent';
}
