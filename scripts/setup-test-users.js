#!/usr/bin/env node

/**
 * Скрипт для создания и верификации тестовых пользователей
 * Использование: node scripts/setup-test-users.js
 */

const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Тестовые пользователи для каждой роли
const testUsers = [
  {
    email: 'producer@test.com',
    password: 'password123',
    role: 'producer',
    profile: {
      firstName: 'Иван',
      lastName: 'Производитель',
      phone: '+7 777 123 4567',
      company: 'ООО "Тестовые продукты"',
      position: 'Директор',
    },
    preferences: {
      currency: 'KZT',
      language: 'ru',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
  {
    email: 'distributor@test.com',
    password: 'password123',
    role: 'distributor',
    profile: {
      firstName: 'Мария',
      lastName: 'Дистрибьютор',
      phone: '+7 777 234 5678',
      company: 'ИП "Оптовые поставки"',
      position: 'Менеджер по закупкам',
    },
    preferences: {
      currency: 'KZT',
      language: 'ru',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
  {
    email: 'investor@test.com',
    password: 'password123',
    role: 'investor',
    profile: {
      firstName: 'Алексей',
      lastName: 'Инвестор',
      phone: '+7 777 345 6789',
      company: 'ООО "Инвестиционная компания"',
      position: 'Инвестиционный менеджер',
    },
    preferences: {
      currency: 'KZT',
      language: 'ru',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
  {
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
    profile: {
      firstName: 'Админ',
      lastName: 'Администратор',
      phone: '+7 777 456 7890',
      company: 'Gigross.com',
      position: 'Системный администратор',
    },
    preferences: {
      currency: 'KZT',
      language: 'ru',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
  },
];

async function createUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();
    return { success: result.success, error: result.error, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function verifyUsers() {
  try {
    // Сначала нужно войти как админ
    const loginResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'password123',
      }),
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      console.log('❌ Не удалось войти как админ. Сначала создайте админа.');
      return false;
    }

    const token = loginResult.data.token;
    
    const response = await fetch(`${API_BASE_URL}/api/admin/verify-users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return { success: result.success, error: result.error, data: result.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function setupTestUsers() {
  console.log('🚀 Настройка тестовых пользователей...\n');

  // Создаем пользователей
  console.log('📝 Создание пользователей...');
  const createdUsers = [];
  const errors = [];

  for (const userData of testUsers) {
    console.log(`   Создание: ${userData.email} (${userData.role})`);
    
    const result = await createUser(userData);
    
    if (result.success) {
      console.log(`   ✅ ${userData.email} создан`);
      createdUsers.push(userData);
    } else {
      console.log(`   ❌ ${userData.email}: ${result.error}`);
      errors.push(`${userData.email}: ${result.error}`);
    }
  }

  console.log(`\n📊 Создано: ${createdUsers.length} из ${testUsers.length} пользователей`);

  if (errors.length > 0) {
    console.log('\n⚠️  Ошибки:');
    errors.forEach(error => console.log(`   - ${error}`));
  }

  // Верифицируем пользователей
  console.log('\n🔐 Верификация пользователей...');
  
  const verifyResult = await verifyUsers();
  
  if (verifyResult.success) {
    console.log(`✅ Верифицировано: ${verifyResult.data.successful} из ${verifyResult.data.total} пользователей`);
  } else {
    console.log(`❌ Ошибка верификации: ${verifyResult.error}`);
  }

  // Показываем итоговую информацию
  console.log('\n🎉 Настройка завершена!');
  console.log('\n📋 Данные для входа:');
  console.log('┌─────────────────────┬──────────────┬──────────────┐');
  console.log('│ Email               │ Пароль       │ Роль         │');
  console.log('├─────────────────────┼──────────────┼──────────────┤');
  
  const roleNames = {
    'producer': 'Производитель',
    'distributor': 'Дистрибьютор',
    'investor': 'Инвестор',
    'admin': 'Администратор'
  };
  
  testUsers.forEach(user => {
    console.log(`│ ${user.email.padEnd(19)} │ password123   │ ${roleNames[user.role]?.padEnd(12)} │`);
  });
  
  console.log('└─────────────────────┴──────────────┴──────────────┘');
  
  console.log('\n🌐 Войти в систему: http://localhost:3000/dashboard');
}

// Запуск скрипта
if (require.main === module) {
  setupTestUsers().catch(console.error);
}

module.exports = { setupTestUsers, testUsers };
