declare global {
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };

  var io: import('socket.io').Server | undefined;

  namespace NodeJS {
    interface ProcessEnv {
      MONGODB_URI: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      JWT_SECRET: string;
      EMAIL_USER: string;
      EMAIL_PASS: string;
    }
  }
}

export {};
