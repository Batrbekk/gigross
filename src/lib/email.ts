import nodemailer from 'nodemailer';

// Создаем транспорт для отправки email
const transporter = nodemailer.createTransport({
  service: 'gmail', // или другой сервис
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Генерируем 6-значный OTP код
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Отправляем OTP код на email
export async function sendOTPEmail(email: string, otp: string, type: 'registration' | 'password-reset'): Promise<void> {
  const subject = type === 'registration' 
    ? 'Подтверждение регистрации - Gigross'
    : 'Сброс пароля - Gigross';
    
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Gigross</h1>
        <p style="color: #666; font-size: 16px;">B2B Торговая платформа</p>
      </div>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 30px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 20px;">
          ${type === 'registration' ? 'Подтверждение регистрации' : 'Сброс пароля'}
        </h2>
        
        <p style="color: #666; font-size: 16px; margin-bottom: 30px;">
          ${type === 'registration' 
            ? 'Для завершения регистрации введите код подтверждения:'
            : 'Для сброса пароля введите код подтверждения:'
          }
        </p>
        
        <div style="background: white; border: 2px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
          <span style="font-size: 32px; font-weight: bold; color: #333; letter-spacing: 8px;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Код действителен в течение 10 минут
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          Если вы не запрашивали этот код, просто проигнорируйте это письмо.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p style="color: #999; font-size: 12px;">
          © 2024 Gigross. Все права защищены.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Gigross" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

// Отправляем уведомление о смене пароля
export async function sendPasswordChangeNotification(email: string, userName?: string): Promise<void> {
  const subject = 'Пароль изменен - Gigross';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Gigross</h1>
        <p style="color: #666; font-size: 16px;">B2B Торговая платформа</p>
      </div>
      
      <div style="background: #f8f9fa; border-radius: 8px; padding: 30px;">
        <h2 style="color: #333; margin-bottom: 20px; text-align: center;">
          Пароль успешно изменен
        </h2>
        
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
          ${userName ? `Здравствуйте, ${userName}!` : 'Здравствуйте!'}
        </p>
        
        <p style="color: #666; font-size: 16px; margin-bottom: 20px;">
          Мы уведомляем вас о том, что пароль для вашего аккаунта <strong>${email}</strong> был успешно изменен.
        </p>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="color: #856404; font-size: 14px; margin: 0;">
            <strong>Важно:</strong> Если вы не меняли пароль, немедленно обратитесь в службу поддержки.
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Дата и время изменения: <strong>${new Date().toLocaleString('ru-RU')}</strong>
        </p>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Для безопасности вашего аккаунта рекомендуется:
        </p>
        <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
          <li>Использовать сложный пароль</li>
          <li>Не передавать пароль третьим лицам</li>
          <li>Регулярно менять пароль</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
        <p style="color: #999; font-size: 12px;">
          © 2024 Gigross. Все права защищены.
        </p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"Gigross" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
}

// Проверяем валидность OTP кода
export function validateOTP(inputOTP: string, storedOTP: string, timestamp: number): boolean {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000; // 10 минут в миллисекундах
  
  // Проверяем, не истек ли код
  if (now - timestamp > tenMinutes) {
    return false;
  }
  
  // Проверяем совпадение кода
  return inputOTP === storedOTP;
}
