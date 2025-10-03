#!/usr/bin/env node

/**
 * Скрипт для верификации тестовых пользователей
 * Использование: node scripts/verify-test-users.js
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gigross';

async function verifyTestUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🔌 Подключение к MongoDB...');
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Находим тестовых пользователей
    const testEmails = [
      'producer@test.com',
      'distributor@test.com', 
      'investor@test.com',
      'admin@test.com'
    ];
    
    const testUsers = await usersCollection.find({ email: { $in: testEmails } }).toArray();
    console.log(`📋 Найдено ${testUsers.length} тестовых пользователей`);
    
    // Верифицируем каждого пользователя
    for (const user of testUsers) {
      const result = await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            isVerified: true,
            isActive: true,
            verifiedAt: new Date()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Пользователь ${user.email} (${user.role}) верифицирован`);
      } else {
        console.log(`⚠️  Пользователь ${user.email} уже был верифицирован`);
      }
    }
    
    console.log('\n🎉 Верификация тестовых пользователей завершена!');
    
    // Показываем итоговую информацию
    const verifiedUsers = await usersCollection.find({ 
      email: { $in: testEmails },
      isVerified: true 
    }).toArray();
    
    console.log('\n📊 Итоговая информация:');
    console.log('┌─────────────────────┬──────────────┬──────────────┐');
    console.log('│ Email               │ Роль         │ Статус       │');
    console.log('├─────────────────────┼──────────────┼──────────────┤');
    
    verifiedUsers.forEach(user => {
      const roleNames = {
        'producer': 'Производитель',
        'distributor': 'Дистрибьютор', 
        'investor': 'Инвестор',
        'admin': 'Администратор'
      };
      
      console.log(`│ ${user.email.padEnd(19)} │ ${roleNames[user.role]?.padEnd(12)} │ Верифицирован │`);
    });
    
    console.log('└─────────────────────┴──────────────┴──────────────┘');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await client.close();
  }
}

// Запуск скрипта
if (require.main === module) {
  verifyTestUsers().catch(console.error);
}

module.exports = { verifyTestUsers };
