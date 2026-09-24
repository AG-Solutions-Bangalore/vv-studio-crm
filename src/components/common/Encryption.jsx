import CryptoJS from "crypto-js";

const ENCRYPTION_KEY = import.meta.env.VITE_SECRET_KEY;

export const encryptId = (id) => {
  try {
    return encodeURIComponent(
      CryptoJS.AES.encrypt(id.toString(), ENCRYPTION_KEY).toString()
    );
  } catch (error) {
    console.error("Error encrypting ID:", error);
    return null;
  }
};

export const decryptId = (encryptedId) => {
  try {
    const bytes = CryptoJS.AES.decrypt(
      decodeURIComponent(encryptedId),
      ENCRYPTION_KEY
    );
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Error decrypting ID:", error);
    return null;
  }
};

export default {
  encryptId,
  decryptId,
};
