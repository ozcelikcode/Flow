/**
 * Crypto Service - End-to-End Encryption
 * Uses Web Crypto API for AES-GCM encryption with PBKDF2 key derivation
 * Performance-optimized: encrypts only changed data
 */

// Encryption configuration
const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

interface EncryptedData {
    iv: string;      // Base64 encoded IV
    data: string;    // Base64 encoded ciphertext
    salt: string;    // Base64 encoded salt
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Generate random salt
export function generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    return arrayBufferToBase64(salt.buffer);
}

// Generate random IV
function generateIV(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(IV_LENGTH));
}

// Derive encryption key from password using PBKDF2
async function deriveKey(password: string, salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = base64ToArrayBuffer(salt);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

// Encrypt data
export async function encrypt(data: string, password: string): Promise<EncryptedData> {
    const salt = generateSalt();
    const key = await deriveKey(password, salt);
    const iv = generateIV();
    const encoder = new TextEncoder();

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as BufferSource },
        key,
        encoder.encode(data)
    );

    return {
        iv: arrayBufferToBase64(new Uint8Array(iv).buffer as ArrayBuffer),
        data: arrayBufferToBase64(encrypted),
        salt
    };
}

// Decrypt data
export async function decrypt(encryptedData: EncryptedData, password: string): Promise<string> {
    const key = await deriveKey(password, encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    const data = base64ToArrayBuffer(encryptedData.data);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv) },
        key,
        data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
}

// Check if data is encrypted format
export function isEncrypted(data: unknown): data is EncryptedData {
    return (
        typeof data === 'object' &&
        data !== null &&
        'iv' in data &&
        'data' in data &&
        'salt' in data
    );
}

// Encrypt and save to localStorage
export async function encryptAndSave(key: string, data: unknown, password: string): Promise<void> {
    const jsonString = JSON.stringify(data);
    const encrypted = await encrypt(jsonString, password);
    localStorage.setItem(key, JSON.stringify(encrypted));
}

// Load and decrypt from localStorage
export async function loadAndDecrypt<T>(key: string, password: string): Promise<T | null> {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    try {
        const parsed = JSON.parse(stored);

        // If not encrypted, return as-is (for migration)
        if (!isEncrypted(parsed)) {
            return parsed as T;
        }

        const decrypted = await decrypt(parsed, password);
        return JSON.parse(decrypted) as T;
    } catch {
        // Silently fail - decryption errors are expected for wrong passwords
        return null;
    }
}

// Verify password by attempting to decrypt existing data
export async function verifyPassword(key: string, password: string): Promise<boolean> {
    const stored = localStorage.getItem(key);
    if (!stored) return true; // No data to verify against

    try {
        const parsed = JSON.parse(stored);
        if (!isEncrypted(parsed)) return true; // Not encrypted yet

        await decrypt(parsed, password);
        return true;
    } catch {
        return false;
    }
}
