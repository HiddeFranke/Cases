import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET not set in environment');
  return createHash('sha256').update(secret).digest();
}

export function encrypt(data) {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return JSON.stringify({
    iv: iv.toString('hex'),
    data: encrypted,
    tag: authTag,
  });
}

export function decrypt(encryptedStr) {
  const key = getKey();
  const { iv, data, tag } = JSON.parse(encryptedStr);

  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
