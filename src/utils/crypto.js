import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || 'default_emwa_secret_key_32bytes_len';

/**
 * Encrypts an ID or string using AES and encodes URI component (matching Sriparshwa cards pattern)
 */
export const encryptId = (id) => {
  try {
    if (id === null || id === undefined) return null;
    return encodeURIComponent(
      CryptoJS.AES.encrypt(id.toString(), SECRET_KEY).toString()
    );
  } catch (error) {
    console.error('Error encrypting ID:', error);
    return null;
  }
};

/**
 * Decrypts an encrypted ID or string
 */
export const decryptId = (encryptedId) => {
  try {
    if (!encryptedId) return null;
    const bytes = CryptoJS.AES.decrypt(
      decodeURIComponent(encryptedId),
      SECRET_KEY
    );
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Error decrypting ID:', error);
    return null;
  }
};

/**
 * Encrypts any text or object to an AES encrypted ciphertext string
 */
export const encryptData = (data) => {
  try {
    if (data === null || data === undefined) return '';
    const textToEncrypt = typeof data === 'object' ? JSON.stringify(data) : String(data);
    return CryptoJS.AES.encrypt(textToEncrypt, SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    return '';
  }
};

/**
 * Decrypts AES ciphertext back into original string or parsed JSON object
 */
export const decryptData = (cipherText, parseJson = true) => {
  try {
    if (!cipherText) return null;
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return null;

    if (parseJson) {
      try {
        return JSON.parse(decryptedText);
      } catch {
        return decryptedText;
      }
    }
    return decryptedText;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
};

/**
 * Encrypted localStorage helpers
 */
export const secureStorage = {
  setItem: (key, value) => {
    try {
      const encrypted = encryptData(value);
      localStorage.setItem(`_sec_${key}`, encrypted);
    } catch (e) {
      console.error('secureStorage setItem error:', e);
    }
  },
  getItem: (key, parseJson = true) => {
    try {
      const raw = localStorage.getItem(`_sec_${key}`);
      if (!raw) return null;
      return decryptData(raw, parseJson);
    } catch (e) {
      console.error('secureStorage getItem error:', e);
      return null;
    }
  },
  removeItem: (key) => {
    localStorage.removeItem(`_sec_${key}`);
  },
  clear: () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('_sec_')) {
        localStorage.removeItem(key);
      }
    });
  },
};

export default {
  encryptId,
  decryptId,
  encryptData,
  decryptData,
  secureStorage,
};
