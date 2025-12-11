import { supabase } from '../config/supabase';

/**
 * Update admin last login timestamp
 */
export async function updateAdminLastLogin() {
  try {
    const { error } = await supabase.rpc('update_admin_last_login');
    if (error) throw error;
  } catch (error) {
    console.error('Error updating last login:', error);
  }
}

/**
 * Log admin action to audit trail
 */
export async function logAdminAction({
  action,
  actionType,
  description,
  targetId = null,
  targetType = null,
  targetName = null,
  oldValues = null,
  newValues = null,
  severity = 'info'
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn('No user found for audit log');
      return;
    }

    const { error } = await supabase.rpc('log_admin_action', {
      p_action: action,
      p_action_type: actionType,
      p_description: description,
      p_target_id: targetId,
      p_target_type: targetType,
      p_target_name: targetName,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_severity: severity
    });

    if (error) throw error;
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

// Pre-defined action helpers
export const AuditActions = {
  // User actions
  userVerified: (userId, userName) => logAdminAction({
    action: 'update',
    actionType: 'user',
    description: `Verified user: ${userName}`,
    targetId: userId,
    targetType: 'user',
    targetName: userName,
    severity: 'info'
  }),
  
  userFlagged: (userId, userName) => logAdminAction({
    action: 'update',
    actionType: 'user',
    description: `Flagged user for review: ${userName}`,
    targetId: userId,
    targetType: 'user',
    targetName: userName,
    severity: 'warning'
  }),
  
  userSuspended: (userId, userName) => logAdminAction({
    action: 'update',
    actionType: 'user',
    description: `Suspended user account: ${userName}`,
    targetId: userId,
    targetType: 'user',
    targetName: userName,
    severity: 'critical'
  }),
  
  userRestored: (userId, userName) => logAdminAction({
    action: 'update',
    actionType: 'user',
    description: `Restored user account: ${userName}`,
    targetId: userId,
    targetType: 'user',
    targetName: userName,
    severity: 'info'
  }),

  // Report actions
  reportViewed: (reportId) => logAdminAction({
    action: 'view',
    actionType: 'report',
    description: `Viewed report #${reportId}`,
    targetId: reportId,
    targetType: 'report',
    severity: 'info'
  }),

  reportUpdated: (reportId, oldStatus, newStatus) => logAdminAction({
    action: 'update',
    actionType: 'report',
    description: `Updated report #${reportId} from ${oldStatus} to ${newStatus}`,
    targetId: reportId,
    targetType: 'report',
    oldValues: { status: oldStatus },
    newValues: { status: newStatus },
    severity: 'info'
  }),

  reportDeleted: (reportId, reportTitle) => logAdminAction({
    action: 'delete',
    actionType: 'report',
    description: `Deleted report: ${reportTitle}`,
    targetId: reportId,
    targetType: 'report',
    targetName: reportTitle,
    severity: 'warning'
  }),

  // Emergency actions
  emergencyViewed: (emergencyId) => logAdminAction({
    action: 'view',
    actionType: 'emergency',
    description: `Viewed emergency #${emergencyId}`,
    targetId: emergencyId,
    targetType: 'emergency',
    severity: 'info'
  }),

  emergencyAssigned: (emergencyId, responder) => logAdminAction({
    action: 'update',
    actionType: 'emergency',
    description: `Assigned emergency #${emergencyId} to ${responder}`,
    targetId: emergencyId,
    targetType: 'emergency',
    severity: 'warning'
  }),

  emergencyResolved: (emergencyId) => logAdminAction({
    action: 'update',
    actionType: 'emergency',
    description: `Resolved emergency #${emergencyId}`,
    targetId: emergencyId,
    targetType: 'emergency',
    severity: 'info'
  }),

  // Announcement actions
  announcementCreated: (title) => logAdminAction({
    action: 'create',
    actionType: 'announcement',
    description: `Created announcement: ${title}`,
    targetType: 'announcement',
    targetName: title,
    severity: 'info'
  }),

  announcementUpdated: (announcementId, title) => logAdminAction({
    action: 'update',
    actionType: 'announcement',
    description: `Updated announcement: ${title}`,
    targetId: announcementId,
    targetType: 'announcement',
    targetName: title,
    severity: 'info'
  }),

  announcementDeleted: (announcementId, title) => logAdminAction({
    action: 'delete',
    actionType: 'announcement',
    description: `Deleted announcement: ${title}`,
    targetId: announcementId,
    targetType: 'announcement',
    targetName: title,
    severity: 'warning'
  }),

  // Export actions
  dataExported: (dataType, recordCount) => logAdminAction({
    action: 'export',
    actionType: dataType,
    description: `Exported ${recordCount} ${dataType} records to CSV`,
    severity: 'info'
  }),

  // Settings
  settingsChanged: (setting, oldValue, newValue) => logAdminAction({
    action: 'update',
    actionType: 'settings',
    description: `Changed ${setting} from "${oldValue}" to "${newValue}"`,
    oldValues: { [setting]: oldValue },
    newValues: { [setting]: newValue },
    severity: 'warning'
  }),

  // Auth
  adminLogin: (email) => logAdminAction({
    action: 'login',
    actionType: 'auth',
    description: `Admin logged in: ${email}`,
    severity: 'info'
  }),

  adminLogout: (email) => logAdminAction({
    action: 'logout',
    actionType: 'auth',
    description: `Admin logged out: ${email}`,
    severity: 'info'
  }),
};
