import type { DemoActor, StaffRole } from '../../types';

export const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  product_manager: 'Product Manager',
  stock_editor: 'Stock Editor',
  viewer: 'Viewer (Customer)',
};

/**
 * Authentication does not exist yet. Staff actions are attributed honestly to
 * "the demo session using role X" — never to a named person picked from the
 * staff list, and never to an invented fallback name.
 */
export function getDemoActor(role: StaffRole): DemoActor {
  return { kind: 'demo_session', role, label: `Demo session (${ROLE_LABELS[role]} role)` };
}

export const canEditCatalog = (role: StaffRole) => role === 'owner' || role === 'product_manager';
export const canEditStock = (role: StaffRole) => role !== 'viewer';
export const canManageTeam = (role: StaffRole) => role === 'owner';
