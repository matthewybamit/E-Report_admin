// src/utils/auditLogger.js
import { supabase } from '../config/supabase';

/**
 * Log an admin/operator action to the audit_logs table.
 *
 * @param {object} params
 * @param {'create'|'update'|'delete'|'view'|'export'|'login'|'logout'} params.action
 * @param {'report'|'emergency'|'announcement'|'user'|'responder'|'auth'|'settings'|'evidence'} params.actionType
 * @param {string} params.description  - Human-readable description
 * @param {'info'|'warning'|'critical'} [params.severity='info']
 * @param {string} [params.targetId]   - UUID of the affected resource
 * @param {string} [params.targetType] - e.g. 'report', 'emergency'
 * @param {string} [params.targetName] - e.g. report title, user name
 * @param {object} [params.oldValues]  - Previous state (for updates/deletes)
 * @param {object} [params.newValues]  - New state (for creates/updates)
 */
export async function logAuditAction({
  action,
  actionType,
  description,
  severity = 'info',
  targetId = null,
  targetType = null,
  targetName = null,
  oldValues = null,
  newValues = null,
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // No session — skip silently

    const adminName  = user.user_metadata?.name  || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unknown';
    const adminRole  = user.user_metadata?.role  || 'operator';
    const adminEmail = user.email || 'N/A';

    await supabase.from('audit_logs').insert({
      auth_user_id: user.id,
      admin_email:  adminEmail,
      admin_name:   adminName,
      admin_role:   adminRole,
      action,
      action_type:  actionType,
      description,
      severity,
      target_id:    targetId   || null,
      target_type:  targetType || null,
      target_name:  targetName || null,
      old_values:   oldValues  || null,
      new_values:   newValues  || null,
    });
  } catch (err) {
    // Never throw — audit logging must not break the main flow
    console.warn('[AuditLogger] Failed to log action:', err?.message);
  }
}
