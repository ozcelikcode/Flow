/**
 * Authentication Service
 * Handles password hashing, session management, and user authentication
 */

// Session duration options in milliseconds
export const SESSION_DURATIONS = {
    '1d': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000,
    '3m': 90 * 24 * 60 * 60 * 1000,
    '6m': 180 * 24 * 60 * 60 * 1000,
    '12m': 365 * 24 * 60 * 60 * 1000,
} as const;

export type SessionDuration = keyof typeof SESSION_DURATIONS;

// Profile icons available for users
export const PROFILE_ICONS = [
    'User', 'UserCircle', 'Smile', 'Star', 'Heart',
    'Zap', 'Crown', 'Gem', 'Rocket', 'Ghost'
] as const;

export type ProfileIcon = typeof PROFILE_ICONS[number];

export interface User {
    id: string;
    username: string;
    displayName: string;
    profileIcon: ProfileIcon;
    passwordHash: string;
    salt: string;
    isAdmin: boolean;
    createdAt: string;
}

export interface Session {
    token: string;
    userId: string;
    expiresAt: number;
}


// Storage keys
const USERS_KEY = 'flow_users';
const SESSION_KEY = 'flow_session';

// Utility functions for Web Crypto API
async function generateSalt(): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password + salt);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordData,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive bits using PBKDF2
    const derivedBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        256
    );

    // Convert to hex string
    return Array.from(new Uint8Array(derivedBits))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

function generateToken(): string {
    return crypto.randomUUID();
}

// Pre-computed admin hash (for admin:12345678)
// This will be computed on first load if not exists
const ADMIN_SALT = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

// Validation functions
export function validateUsername(username: string): { valid: boolean; error?: string } {
    if (username.length < 3 || username.length > 20) {
        return { valid: false, error: 'usernameLength' };
    }
    if (!/^[a-zA-Z0-9]+$/.test(username)) {
        return { valid: false, error: 'usernameAlphanumeric' };
    }
    if (username.toLowerCase() === 'admin') {
        return { valid: false, error: 'usernameReserved' };
    }
    return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (password.length < 8) {
        return { valid: false, error: 'passwordLength' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'passwordUppercase' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'passwordLowercase' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'passwordNumber' };
    }
    return { valid: true };
}

// User management
async function getAdminUser(): Promise<User> {
    const hash = await hashPassword('12345678', ADMIN_SALT);
    return {
        id: 'admin',
        username: 'admin',
        displayName: 'Administrator',
        profileIcon: 'Crown',
        passwordHash: hash,
        salt: ADMIN_SALT,
        isAdmin: true,
        createdAt: '2025-01-01T00:00:00.000Z'
    };
}

export async function getUsers(): Promise<User[]> {
    const stored = localStorage.getItem(USERS_KEY);
    const users: User[] = stored ? JSON.parse(stored) : [];

    // Always include admin user
    const admin = await getAdminUser();
    const hasAdmin = users.some(u => u.id === 'admin');

    if (!hasAdmin) {
        users.unshift(admin);
    } else {
        // Update admin in case password hash changed
        const idx = users.findIndex(u => u.id === 'admin');
        users[idx] = admin;
    }

    return users;
}

function saveUsers(users: User[]): void {
    // Filter out admin before saving (admin is hardcoded)
    const usersToSave = users.filter(u => u.id !== 'admin');
    localStorage.setItem(USERS_KEY, JSON.stringify(usersToSave));
}

export async function registerUser(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
        return { success: false, error: usernameValidation.error };
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
    }

    const users = await getUsers();

    // Check if username exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return { success: false, error: 'usernameTaken' };
    }

    // Create new user
    const salt = await generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const newUser: User = {
        id: `user_${Date.now()}`,
        username,
        displayName: username,
        profileIcon: 'User',
        passwordHash,
        salt,
        isAdmin: false,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Create default sample data for new user
    createDefaultUserData(newUser.id);

    return { success: true };
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
    const users = await getUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return null;
    }

    const hash = await hashPassword(password, user.salt);

    if (hash === user.passwordHash) {
        return user;
    }

    return null;
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
        return { success: false, error: passwordValidation.error };
    }

    const users = await getUsers();
    const userIdx = users.findIndex(u => u.id === userId);

    if (userIdx === -1) {
        return { success: false, error: 'userNotFound' };
    }

    const user = users[userIdx];

    // Verify old password
    const oldHash = await hashPassword(oldPassword, user.salt);
    if (oldHash !== user.passwordHash) {
        return { success: false, error: 'wrongPassword' };
    }

    // Don't allow changing admin password (it's hardcoded for testing)
    if (user.isAdmin) {
        return { success: false, error: 'cannotChangeAdminPassword' };
    }

    // Update password
    const newSalt = await generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    users[userIdx] = {
        ...user,
        passwordHash: newHash,
        salt: newSalt
    };

    saveUsers(users);

    return { success: true };
}

// Session management
export function createSession(userId: string, duration: SessionDuration): Session {
    const session: Session = {
        token: generateToken(),
        userId,
        expiresAt: Date.now() + SESSION_DURATIONS[duration]
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return session;
}

export function getSession(): Session | null {
    const stored = localStorage.getItem(SESSION_KEY);

    if (!stored) {
        return null;
    }

    const session: Session = JSON.parse(stored);

    // Check if session expired
    if (Date.now() > session.expiresAt) {
        clearSession();
        return null;
    }

    return session;
}

export function clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
}

export async function getCurrentUser(): Promise<User | null> {
    const session = getSession();

    if (!session) {
        return null;
    }

    const users = await getUsers();
    return users.find(u => u.id === session.userId) || null;
}

// Profile management
export async function updateProfile(
    userId: string,
    updates: { displayName?: string; profileIcon?: ProfileIcon }
): Promise<{ success: boolean; error?: string }> {
    const users = await getUsers();
    const userIdx = users.findIndex(u => u.id === userId);

    if (userIdx === -1) {
        return { success: false, error: 'userNotFound' };
    }

    // Don't allow updating admin profile
    if (users[userIdx].isAdmin) {
        return { success: false, error: 'cannotUpdateAdminProfile' };
    }

    users[userIdx] = {
        ...users[userIdx],
        ...updates
    };

    saveUsers(users);
    return { success: true };
}

// Create default sample data for new users
function createDefaultUserData(userId: string): void {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Sample transactions for new users
    const sampleTransactions = [
        {
            id: `sample_${Date.now()}_1`,
            name: 'Maaş / Salary',
            amount: 5000,
            type: 'income',
            category: 'Salary',
            date: todayStr,
            recurrence: 'monthly',
            isActive: true,
            currentPeriod: 1,
            nextBillingDate: getNextMonthDate(today)
        },
        {
            id: `sample_${Date.now()}_2`,
            name: 'Netflix',
            amount: 9.99,
            type: 'expense',
            category: 'Subscription',
            date: todayStr,
            recurrence: 'monthly',
            isActive: true,
            currentPeriod: 1,
            nextBillingDate: getNextMonthDate(today)
        },
        {
            id: `sample_${Date.now()}_3`,
            name: 'Market Alışverişi / Groceries',
            amount: 150,
            type: 'expense',
            category: 'Food & Drink',
            date: todayStr,
            recurrence: 'once',
            isActive: true
        }
    ];

    localStorage.setItem(`flow_transactions_${userId}`, JSON.stringify(sampleTransactions));
}

function getNextMonthDate(date: Date): string {
    const next = new Date(date);
    next.setMonth(next.getMonth() + 1);
    return next.toISOString().split('T')[0];
}

// Get user-specific storage key
export function getUserStorageKey(key: string, userId: string): string {
    return `flow_${key}_${userId}`;
}
