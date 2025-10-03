import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Хеширует пароль
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Сравнивает пароль с хешем
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Failed to compare password');
  }
}

/**
 * Валидирует силу пароля
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Пароль должен содержать минимум 8 символов');
  }

  if (password.length > 128) {
    errors.push('Пароль слишком длинный (максимум 128 символов)');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Пароль должен содержать минимум одну строчную букву');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Пароль должен содержать минимум одну заглавную букву');
  }

  if (!/\d/.test(password)) {
    errors.push('Пароль должен содержать минимум одну цифру');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Пароль должен содержать минимум один специальный символ');
  }

  // Проверка на общие слабые пароли
  const commonPasswords = [
    'password',
    '123456',
    '123456789',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('Пароль слишком простой, выберите более сложный');
  }

  // Проверка на повторяющиеся символы
  if (/(.)\1{2,}/.test(password)) {
    errors.push('Пароль не должен содержать более 2 одинаковых символов подряд');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Генерирует случайный пароль
 */
export function generateRandomPassword(length: number = 12): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = lowercase + uppercase + numbers + symbols;

  let password = '';

  // Гарантируем наличие каждого типа символов
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Заполняем остальные позиции случайными символами
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Перемешиваем символы
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Проверяет, не был ли пароль скомпрометирован (заглушка для будущей интеграции с HaveIBeenPwned)
 */
export async function checkPasswordBreach(password: string): Promise<boolean> {
  // В реальном приложении здесь была бы интеграция с API HaveIBeenPwned
  // Пока возвращаем false (пароль не скомпрометирован)
  return false;
}
