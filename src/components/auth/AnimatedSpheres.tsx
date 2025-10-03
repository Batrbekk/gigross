'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Ball, ContainerBounds, BallPhysics } from './types';

interface AnimatedSpheresProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

const AnimatedSpheres: React.FC<AnimatedSpheresProps> = ({ containerRef, className = '' }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [balls, setBalls] = React.useState<Ball[]>([]);
  const [mousePos, setMousePos] = React.useState({ x: -1000, y: -1000 });


  const ballsRef = useRef<Ball[]>([
    {
      id: 'ball-1',
      x: 200,
      y: 150,
      vx: 2.0,
      vy: 1.5,
      radius: 100, // #371AE7 - самый большой
      color: '#371AE7'
    },
    {
      id: 'ball-2',
      x: 400,
      y: 250,
      vx: -1.8,
      vy: 2.0,
      radius: 80, // #F8FF37 - средний
      color: '#F8FF37'
    },
    {
      id: 'ball-3',
      x: 300,
      y: 100,
      vx: 1.5,
      vy: -1.8,
      radius: 60, // #02ED2A - самый маленький
      color: '#02ED2A'
    }
  ]);

  const animationRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Инициализируем шарики
  useEffect(() => {
    setBalls([...ballsRef.current]);
  }, []);

  // Проверяем предпочтения пользователя по анимации
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

   // Отслеживание позиции мыши
   useEffect(() => {
    if (!containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleMouseLeave = () => {
      setMousePos({ x: -1000, y: -1000 }); // Убираем курсор за пределы
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef]);

  const physics: BallPhysics = useMemo(() => ({
    damping: 0.9995, // Уменьшили затухание для более долгого движения
    stiffness: 100,
    mass: 1,
    restDelta: 0.001
  }), []);

  // Обнаружение столкновений между шариками
  const detectCollision = useCallback((ball1: Ball, ball2: Ball): boolean => {
    const dx = ball1.x - ball2.x;
    const dy = ball1.y - ball2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (ball1.radius + ball2.radius);
  }, []);

  // Улучшенная обработка столкновений между шариками с учетом массы
  const handleBallCollision = useCallback((ball1: Ball, ball2: Ball) => {
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;
    
    // Нормализованные векторы
    const nx = dx / distance;
    const ny = dy / distance;
    
    // Разделяем шарики чтобы они не пересекались
    const overlap = (ball1.radius + ball2.radius) - distance;
    const separationX = nx * overlap * 0.5;
    const separationY = ny * overlap * 0.5;
    
    ball1.x -= separationX;
    ball1.y -= separationY;
    ball2.x += separationX;
    ball2.y += separationY;
    
    // Применяем импульс к скоростям
    const tempVx = ball1.vx;
    const tempVy = ball1.vy;
    ball1.vx = ball2.vx;
    ball1.vy = ball2.vy;
    ball2.vx = tempVx;
    ball2.vy = tempVy;

    const pushForce = 0.2;
    ball1.vx -= nx * pushForce;
    ball1.vy -= ny * pushForce;
    ball2.vx += nx * pushForce;
    ball2.vy += ny * pushForce;
  }, []);

  // Обработка столкновений с границами
  const handleWallCollision = useCallback((ball: Ball, bounds: ContainerBounds) => {
    const restitution = 0.9; // Коэффициент упругости для стен (чуть более упруго)

    // Эффект невесомости - при касании любой стены добавляем импульс вверх
    const upwardBoost = 1.0; // Сила импульса вверх
    const randomHorizontal = (Math.random() - 0.5) * 1.2; // Случайное горизонтальное направление

    
    // Левая и правая стенки
    if (ball.x - ball.radius <= 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx) * restitution; // Отскок вправо
      ball.vy -= upwardBoost; // Импульс вверх
      ball.vx += randomHorizontal; // Случайное горизонтальное отклонение
    } else if (ball.x + ball.radius >= bounds.width) {
      ball.x = bounds.width - ball.radius;
      ball.vx = -Math.abs(ball.vx) * restitution; // Отскок влево
      ball.vy -= upwardBoost; // Импульс вверх
      ball.vx += randomHorizontal; // Случайное горизонтальное отклонение
    }
    
    // Верхняя и нижняя стенки
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy) * restitution; // Отскок вниз
      ball.vy += upwardBoost * 0.5; // Небольшой дополнительный импульс вниз
      ball.vx += randomHorizontal; // Случайное горизонтальное отклонение
    } else if (ball.y + ball.radius >= bounds.height) {
      ball.y = bounds.height - ball.radius;
      ball.vy = -Math.abs(ball.vy) * restitution; // Отскок вверх
      ball.vy -= upwardBoost; // Дополнительный импульс вверх (эффект невесомости)
      ball.vx += randomHorizontal; // Случайное горизонтальное отклонение
    }
  }, []);

  const handleMouseRepulsion = useCallback((ball: Ball) => {
    const mouseRadius = 120; // Радиус воздействия курсора
    const repulsionForce = 0.8; // Сила отталкивания
    
    const dx = ball.x - mousePos.x;
    const dy = ball.y - mousePos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Если шар в зоне воздействия курсора
    if (distance < mouseRadius && distance > 0) {
      const force = (mouseRadius - distance) / mouseRadius * repulsionForce;
      const normalizedDx = dx / distance;
      const normalizedDy = dy / distance;
      
      // Отталкиваем шар от курсора
      ball.vx += normalizedDx * force;
      ball.vy += normalizedDy * force;
      
      // Добавляем небольшой импульс вверх (эффект невесомости)
      ball.vy -= force * 0.3;
    }
  }, [mousePos.x, mousePos.y]);

  // Запуск анимации
  useEffect(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const animate = (currentTime: number) => {
      if (!containerRef.current) return;

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const containerRect = containerRef.current.getBoundingClientRect();
      const bounds: ContainerBounds = {
        width: containerRect.width,
        height: containerRect.height
      };

      // Обновляем позиции шариков
      const updatedBalls = ballsRef.current.map(ball => ({ ...ball }));
      
      updatedBalls.forEach(ball => {
        // Добавляем небольшую гравитацию
        ball.vy += 0.015;
        
        // Обновляем позицию с учетом времени
        const timeMultiplier = deltaTime / 16.67; // Нормализуем к 60 FPS
        ball.x += ball.vx * timeMultiplier;
        ball.y += ball.vy * timeMultiplier;
        
        // Применяем затухание
        ball.vx *= physics.damping;
        ball.vy *= physics.damping;
        
        // Обрабатываем столкновения с границами
        handleWallCollision(ball, bounds);
        handleMouseRepulsion(ball);
      });

      // Проверяем столкновения между шариками
      for (let i = 0; i < updatedBalls.length; i++) {
        for (let j = i + 1; j < updatedBalls.length; j++) {
          if (detectCollision(updatedBalls[i], updatedBalls[j])) {
            handleBallCollision(updatedBalls[i], updatedBalls[j]);
          }
        }
      }

      // Обновляем состояние и ref
      ballsRef.current = updatedBalls;
      setBalls(updatedBalls);

      animationRef.current = requestAnimationFrame(animate);
    };

    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion, physics.damping, detectCollision, handleWallCollision, handleBallCollision, containerRef, handleMouseRepulsion]);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {balls.map((ball) => (
        <div
          key={ball.id}
          className="absolute rounded-full shadow-2xl"
          style={{
            width: ball.radius * 2,
            height: ball.radius * 2,
            backgroundColor: ball.color,
            filter: 'blur(8px)',
            boxShadow: `0 0 ${ball.radius}px ${ball.color}60, 0 0 ${ball.radius * 2}px ${ball.color}40, 0 0 ${ball.radius * 3}px ${ball.color}20`,
            transform: `translate(${ball.x - ball.radius}px, ${ball.y - ball.radius}px)`,
            transition: 'none',
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
};

export default AnimatedSpheres;
