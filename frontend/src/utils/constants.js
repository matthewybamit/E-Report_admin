 export const REPORT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
};

export const REPORT_CATEGORIES = {
  INFRASTRUCTURE: 'infrastructure',
  HEALTH: 'health',
  SAFETY: 'safety',
  ENVIRONMENT: 'environment',
  OTHERS: 'others',
};

export const USER_ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  RESIDENT: 'resident',
};

export const EMERGENCY_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const STATUS_COLORS = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  resolved: { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
};
