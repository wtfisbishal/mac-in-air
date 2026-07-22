import crypto from 'crypto';
import { logInfo, logError } from '../utils/logger';

let _store: any = null;

async function getStore() {
    if (_store) return _store;

    const { default: Store } = await import('electron-store');
    const { safeStorage } = await import('electron');

    const storeOptions: Record<string, unknown> = { name: 'auth' };

    if (safeStorage.isEncryptionAvailable()) {
        const keyMaterial = safeStorage.encryptString('wia-auth-store-key');
        storeOptions.encryptionKey = keyMaterial.toString('base64');
    }
    else {
        logError('MasterKeyService', 'safeStorage not available — store will be unencrypted');
    }
    _store = new Store(storeOptions);
    return _store;
}
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEY_LEN = 32; // 256-bit key
const PBKDF2_DIGEST = 'sha256';

class MasterKeyService {

    async hasMasterKey(): Promise<boolean> {
        try {
            const store = await getStore();
            const derivedKey = store.get('masterDerivedKey') as string | undefined;
            const salt = store.get('masterSalt') as string | undefined;
            return !!(derivedKey && salt);
        } catch (error) {
            logError('MasterKeyService', 'hasMasterKey error', error);
            return false;
        }
    }

    async setupMasterKey(password: string): Promise<{ salt: string }> {
        if (!password || password.length < 8) {
            throw new Error('Master password must be at least 8 characters.');
        }
        const saltBytes = crypto.randomBytes(32);
        const saltHex = saltBytes.toString('hex');

        const derivedKeyBytes = crypto.pbkdf2Sync(
            password, saltBytes, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, PBKDF2_DIGEST
        )
        const derivedKeyBase64 = derivedKeyBytes.toString('base64');
        const store = await getStore();

        store.set('masterDerivedKey', derivedKeyBase64);
        store.set('masterSalt', saltHex);

        logInfo('MasterKeyService', 'Master key set up successfully');
        return { salt: saltHex };
    }
    async getPairingChallenge(deviceId: string): Promise<{ challenge: string; salt: string } | null> {
        try {
            const store = await getStore();
            const derivedKeyB64 = store.get('masterDerivedKey') as string | undefined;
            const saltHex = store.get('masterSalt') as string | undefined;

            if (!derivedKeyB64 || !saltHex) {
                logError('MasterKeyService', 'getPairingChallenge: no master key set up');
                return null;
            }
            const derivedKey = Buffer.from(derivedKeyB64, 'base64');
            const challenge = crypto
                .createHmac('sha256', derivedKey)
                .update(deviceId)
                .digest('hex');

            return { challenge, salt: saltHex };

        } catch (err) {
            logError('MasterKeyService', 'getPairingChallenge error', err);
            return null;
        }
    }

    async clearMasterKey(): Promise<void> {
        try {

            const store = await getStore();
            store.delete('masterDerivedKey');
            store.delete('masterSalt');
        } catch (error) {
            logError('MasterKeyService', 'clearMasterKey error', error);

        }
    }
}

export const masterKeyService = new MasterKeyService();