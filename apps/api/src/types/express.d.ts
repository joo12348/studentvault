import "express";

declare global {
  namespace Express {
    interface User {
      sub: string;
      email: string;
      role: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export {};