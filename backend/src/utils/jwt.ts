import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AuthUserPayload } from '../types/index.js';

export const signToken = (payload: AuthUserPayload): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  });
};

export const verifyToken = (token: string): AuthUserPayload => {
  return jwt.verify(token, config.jwt.secret) as AuthUserPayload;
};
