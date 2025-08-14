// server/src/types/auth.d.ts
import { Request, Response } from 'express';

export interface AuthRequest extends Request {
    user?: AuthUser;
}
  
export interface JWTConfig {
    access: string;
    refresh: string;
    verification: string;
    reset: string;
}

export interface AuthUser {
    _id: string;
    name: string;
    email: string;
    role: string;
    permissions: string[];
    isEmailVerified: boolean;
    lastLogin?: Date;
}
  
export interface IAuthController {
    register(req: AuthRequest, res: Response): Promise<Response>;
    login(req: AuthRequest, res: Response): Promise<Response>;
    verifyEmail(req: AuthRequest, res: Response): Promise<Response>;
    requestPasswordReset(req: AuthRequest, res: Response): Promise<Response>;
    resetPassword(req: AuthRequest, res: Response): Promise<Response>;
    refreshToken(req: AuthRequest, res: Response): Promise<Response>;
    logout(req: AuthRequest, res: Response): Promise<Response>;
    verifyAuth(req: AuthRequest, res: Response): Promise<Response>;
    resendVerificationEmail?(req: AuthRequest, res: Response): Promise<Response>;
    generateAccessToken(user: any): string;
    generateRefreshToken(user: any): string;
    verifyUserEmail(req: AuthRequest, res: ExpressResponse): Promise<ExpressResponse>;
    checkUser(req: AuthRequest, res: ExpressResponse): Promise<ExpressResponse>;
}