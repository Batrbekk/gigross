#!/usr/bin/env node

/**
 * Скрипт для создания тестовых пользователей
 * Использование: node scripts/create-test-users.js
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

async function createTestUsers() {
  console.log('🚀 Создание тестовых пользователей...\n');

  for (const userData of testUsers) {
    try {
      console.log(`📝 Создание пользователя: ${userData.email} (${userData.role})`);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (result.success) {
        console.log(`✅ Пользователь ${userData.email} успешно создан`);
      } else {
        console.log(`❌ Ошибка создания пользователя ${userData.email}: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Ошибка при создании пользователя ${userData.email}:`, error.message);
    }
  }

  console.log('\n🎉 Создание тестовых пользователей завершено!');
  console.log('\n📋 Данные для входа:');
  console.log('┌─────────────────────┬──────────────┬──────────────┐');
  console.log('│ Email               │ Пароль       │ Роль         │');
  console.log('├─────────────────────┼──────────────┼──────────────┤');
  testUsers.forEach(user => {
    console.log(`│ ${user.email.padEnd(19)} │ password123   │ ${user.role.padEnd(12)} │`);
  });
  console.log('└─────────────────────┴──────────────┴──────────────┘');
}

// Запуск скрипта
if (require.main === module) {
  createTestUsers().catch(console.error);
}

module.exports = { createTestUsers, testUsers };
