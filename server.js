const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Создаем Next.js приложение
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Создаем Socket.io сервер
  const io = new Server(httpServer, {
    cors: {
      origin: dev ? ['http://localhost:3000', 'http://localhost:3001'] : process.env.NEXTAUTH_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware для аутентификации Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Обработчики Socket.io событий
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 User connected: ${user.email} (${user.role})`);

    // Присоединение к комнате пользователя
    socket.join(`user_${user.userId}`);

    // Присоединение к аукциону
    socket.on('join_auction', (lotId) => {
      console.log(`🏛️ User ${user.email} joined auction for lot ${lotId}`);
      socket.join(`auction_${lotId}`);
      
      // Отправляем подтверждение подключения
      socket.emit('auction_joined', {
        lotId,
        message: 'Successfully joined auction',
        timestamp: new Date(),
      });
    });

    // Покидание аукциона
    socket.on('leave_auction', (lotId) => {
      console.log(`🚪 User ${user.email} left auction for lot ${lotId}`);
      socket.leave(`auction_${lotId}`);
    });

    // Размещение ставки (дублирует API, но для real-time уведомлений)
    socket.on('place_bid', async (data) => {
      try {
        console.log(`💰 Bid placed by ${user.email}:`, data);
        
        // Уведомляем всех участников аукциона
        io.to(`auction_${data.lotId}`).emit('bid_placed', {
          lotId: data.lotId,
          amount: data.amount,
          bidderId: user.userId,
          bidderName: user.email.split('@')[0],
          message: data.message,
          timestamp: new Date(),
        });

      } catch (error) {
        socket.emit('bid_error', {
          error: error instanceof Error ? error.message : 'Failed to place bid',
        });
      }
    });

    // Отключение
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${user.email}`);
    });
  });

  // Делаем io доступным глобально для API routes
  global.io = io;

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`🚀 Server ready on http://${hostname}:${port}`);
      console.log(`🔌 Socket.io ready on the same port`);
    });
});
