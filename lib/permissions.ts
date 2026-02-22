/**
 * Client-side utility to check if the current user has a specific permission.
 * Fetches user data from localStorage.
 */
export function checkPermission(entity: string, action: string): boolean {
    if (typeof window === 'undefined') return false;

    const role = localStorage.getItem('role');
    if (role === 'ADMIN') return true;
    if (role !== 'STAFF') return false;

    const userStr = localStorage.getItem('user');
    if (!userStr) return false;

    try {
        const user = JSON.parse(userStr);
        if (!user.permissions) return false;

        const entityPerms = user.permissions[entity];
        if (!entityPerms) return false;

        return entityPerms[action] === true;
    } catch (e) {
        return false;
    }
}
