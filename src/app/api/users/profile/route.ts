import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/config/database';
import { User } from '@/database/models/User';
import { requireAuth } from '@/lib/auth/middleware';
import { deleteFileFromS3 } from '@/lib/s3-utils';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.userId;
    const body = await request.json();
    const { avatar, avatarKey, oldAvatarKey, profile, preferences } = body;

    await connectDB();

    // Подготавливаем данные для обновления
    const updateData: any = {};

    // Обновляем аватарку
    if (avatar !== undefined) {
      updateData['profile.avatar'] = avatar;
    }

    if (avatarKey !== undefined) {
      updateData['profile.avatarKey'] = avatarKey;
    }

    // Удаляем старую аватарку из S3, если есть
    if (oldAvatarKey && oldAvatarKey !== avatarKey) {
      try {
        await deleteFileFromS3(oldAvatarKey);
        console.log(`Старая аватарка удалена из S3: ${oldAvatarKey}`);
      } catch (error) {
        console.error('Ошибка удаления старой аватарки из S3:', error);
        // Не прерываем выполнение, так как новая аватарка уже загружена
      }
    }

    // Обновляем профиль
    if (profile) {
      if (profile.firstName) updateData['profile.firstName'] = profile.firstName;
      if (profile.lastName) updateData['profile.lastName'] = profile.lastName;
      if (profile.company !== undefined) updateData['profile.company'] = profile.company;
      if (profile.phone !== undefined) updateData['profile.phone'] = profile.phone;
      if (profile.address) {
        if (profile.address.street) updateData['profile.address.street'] = profile.address.street;
        if (profile.address.city) updateData['profile.address.city'] = profile.address.city;
        if (profile.address.state) updateData['profile.address.state'] = profile.address.state;
        if (profile.address.country) updateData['profile.address.country'] = profile.address.country;
        if (profile.address.postalCode) updateData['profile.address.postalCode'] = profile.address.postalCode;
        if (profile.address.zipCode) updateData['profile.address.zipCode'] = profile.address.zipCode;
      }
    }

    // Обновляем настройки
    if (preferences) {
      if (preferences.notifications !== undefined) updateData['preferences.notifications'] = preferences.notifications;
      if (preferences.language) updateData['preferences.language'] = preferences.language;
      if (preferences.currency) updateData['preferences.currency'] = preferences.currency;
    }

    // Обновляем пользователя в базе данных
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Возвращаем обновленные данные пользователя
    return NextResponse.json({
      success: true,
      data: {
        _id: updatedUser._id,
        email: updatedUser.email,
        role: updatedUser.role,
        profile: updatedUser.profile,
        preferences: updatedUser.preferences,
        verification: updatedUser.verification,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка обновления профиля' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return authResult.response;
    }

    const userId = authResult.userId;

    await connectDB();

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        preferences: user.preferences,
        verification: user.verification,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Ошибка получения профиля' },
      { status: 500 }
    );
  }
}