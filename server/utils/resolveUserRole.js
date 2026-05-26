const ASSIGNABLE_BY_ADMIN = ['admin', 'staff'];
const ASSIGNABLE_BY_SUPERADMIN = ['admin', 'staff', 'superadmin'];

export const resolveAssignableRole = (requestedRole, requesterRole) => {
  if (requesterRole === 'superadmin') {
    return requestedRole && ASSIGNABLE_BY_SUPERADMIN.includes(requestedRole)
      ? requestedRole
      : 'staff';
  }
  return requestedRole && ASSIGNABLE_BY_ADMIN.includes(requestedRole)
    ? requestedRole
    : 'staff';
};

export const canAssignRole = (requestedRole, requesterRole) => {
  if (!requestedRole) return true;
  if (requesterRole === 'superadmin') {
    return ASSIGNABLE_BY_SUPERADMIN.includes(requestedRole);
  }
  return ASSIGNABLE_BY_ADMIN.includes(requestedRole);
};
