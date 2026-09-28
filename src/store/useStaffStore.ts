import { INITIAL_STAFF } from '../data/seedData';
import { fail, ok, type Result } from '../features/catalog/productRecords';
import { isValidEmail } from '../features/alerts/notifications';
import { createId } from '../lib/ids';
import { asString, isRecord, normalizeArray, readJSON, STORAGE_KEYS } from '../lib/storage';
import type { StaffMember, StaffRole, TeamRole } from '../types';
import { usePersistentState } from './usePersistentState';

type WriteErrorHandler = (key: string, message: string) => void;

const TEAM_ROLES: TeamRole[] = ['owner', 'product_manager', 'stock_editor'];

function normalizeStaff(raw: unknown): StaffMember | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id);
  const name = asString(raw.name);
  const email = asString(raw.email);
  const role = raw.role as TeamRole;
  if (!id || !name || !TEAM_ROLES.includes(role)) return null;
  return { id, name, email, role, status: raw.status === 'suspended' ? 'suspended' : 'active', isCurrentUser: raw.isCurrentUser === true };
}

/**
 * Demo team list for the role-switcher prototype. These records are NOT user
 * accounts: nobody can sign in, and no invitation emails are sent.
 */
export function useStaffStore(currentRole: StaffRole, onWriteError: WriteErrorHandler) {
  const [staffList, setStaffList] = usePersistentState<StaffMember[]>(
    STORAGE_KEYS.STAFF,
    () => readJSON(STORAGE_KEYS.STAFF, p => normalizeArray(p, normalizeStaff), () => INITIAL_STAFF.map(s => ({ ...s }))).value,
    onWriteError,
  );

  const ownerOnly = (what: string): Result | null => (currentRole === 'owner' ? null : fail(`Only the Owner role can ${what}.`));

  const addStaff = (name: string, email: string, role: TeamRole): Result => {
    const denied = ownerOnly('add staff records');
    if (denied) return denied;
    const n = name.trim();
    const e = email.trim().toLowerCase();
    if (!n || !e) return fail('Name and email are required.');
    if (!isValidEmail(e)) return fail('Please enter a valid email address.');
    if (staffList.some(s => s.email.toLowerCase() === e)) return fail('A staff member with this email already exists.');
    setStaffList(prev => [...prev, { id: createId('staff'), name: n, email: e, role, status: 'active', isCurrentUser: false }]);
    return ok;
  };

  const updateStaffRole = (id: string, newRole: TeamRole): Result => {
    const denied = ownerOnly('change team roles');
    if (denied) return denied;
    const target = staffList.find(s => s.id === id);
    if (!target) return fail('Staff member not found.');
    if (target.isCurrentUser && target.role === 'owner' && newRole !== 'owner') {
      return fail('Protection rule: the demo owner record cannot remove its own Owner role.');
    }
    setStaffList(prev => prev.map(s => (s.id === id ? { ...s, role: newRole } : s)));
    return ok;
  };

  const toggleStaffStatus = (id: string): Result => {
    const denied = ownerOnly('suspend or activate staff');
    if (denied) return denied;
    const target = staffList.find(s => s.id === id);
    if (!target) return fail('Staff member not found.');
    if (target.isCurrentUser) return fail('Protection rule: the demo owner record cannot be suspended.');
    setStaffList(prev => prev.map(s => (s.id === id ? { ...s, status: s.status === 'active' ? 'suspended' : 'active' } : s)));
    return ok;
  };

  const revokeStaff = (id: string): Result => {
    const denied = ownerOnly('remove staff records');
    if (denied) return denied;
    const target = staffList.find(s => s.id === id);
    if (!target) return fail('Staff member not found.');
    if (target.isCurrentUser) return fail('Protection rule: the demo owner record cannot be removed.');
    setStaffList(prev => prev.filter(s => s.id !== id));
    return ok;
  };

  const resetStaffDemo = () => setStaffList(INITIAL_STAFF.map(s => ({ ...s })));

  return { staffList, addStaff, updateStaffRole, toggleStaffStatus, revokeStaff, resetStaffDemo };
}
