import jwt from 'jsonwebtoken';
import type { 
  CaseJWT, 
  JWTValidationResult, 
  CreateSessionRequest,
  AuthError 
} from '../../types/auth';
import type { PrimaryContext } from '../../types/diagnosis';
import { DEFAULT_JWT_COOKIE_OPTIONS } from '../../types/auth';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ALGORITHM: jwt.Algorithm = 'HS256';

// JWT Utility Functions
export class CaseJWTManager {
  /**
   * Create a JWT token for case session management
   */
  static createCaseJWT(request: CreateSessionRequest): string {
    const { caseId, userId, primaryContext, expiresIn = 7 * 24 * 60 * 60 } = request; // Default 7 days

    const payload: Omit<CaseJWT, 'iat' | 'exp'> = {
      caseId,
      userId,
      sessionId: this.generateSessionId(),
      primaryContext
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      algorithm: JWT_ALGORITHM,
      expiresIn
    });

    return token;
  }

  /**
   * Validate and decode a JWT token
   */
  static validateCaseJWT(token: string): JWTValidationResult {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: [JWT_ALGORITHM]
      }) as CaseJWT;

      // Validate required fields
      if (!decoded.caseId || !decoded.userId || !decoded.sessionId || !decoded.primaryContext) {
        return {
          isValid: false,
          error: 'Invalid JWT payload structure'
        };
      }

      return {
        isValid: true,
        decoded
      };
    } catch (error) {
      const jwtError = error as jwt.JsonWebTokenError;
      
      let errorMessage: string;
      switch (jwtError.name) {
        case 'TokenExpiredError':
          errorMessage = 'JWT token has expired';
          break;
        case 'JsonWebTokenError':
          errorMessage = 'Invalid JWT token';
          break;
        case 'NotBeforeError':
          errorMessage = 'JWT token not yet valid';
          break;
        default:
          errorMessage = 'JWT validation failed';
      }

      return {
        isValid: false,
        error: errorMessage
      };
    }
  }

  /**
   * Generate a unique session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract JWT from request cookies
   */
  static extractJWTFromCookies(cookies: string): string | null {
    const cookiePairs = cookies.split(';');
    
    for (const pair of cookiePairs) {
      const [name, value] = pair.trim().split('=');
      if (name === 'case-context' && value) {
        return decodeURIComponent(value);
      }
    }
    
    return null;
  }

  /**
   * Create cookie options for JWT
   */
  static getCookieOptions(overrides?: Partial<typeof DEFAULT_JWT_COOKIE_OPTIONS>) {
    return {
      ...DEFAULT_JWT_COOKIE_OPTIONS,
      ...overrides
    };
  }

  /**
   * Check if JWT is expired
   */
  static isJWTExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as CaseJWT;
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get expiration time from JWT
   */
  static getJWTExpiration(token: string): Date | null {
    try {
      const decoded = jwt.decode(token) as CaseJWT;
      if (!decoded || !decoded.exp) {
        return null;
      }
      
      return new Date(decoded.exp * 1000);
    } catch {
      return null;
    }
  }

  /**
   * Refresh JWT token
   */
  static refreshCaseJWT(token: string, expiresIn?: number): string | null {
    try {
      const decoded = this.validateCaseJWT(token);
      if (!decoded.isValid || !decoded.decoded) {
        return null;
      }

      const { caseId, userId, primaryContext } = decoded.decoded;
      
      return this.createCaseJWT({
        caseId,
        userId,
        primaryContext,
        expiresIn
      });
    } catch {
      return null;
    }
  }
}

// Error handling utilities
export class JWTError extends Error {
  constructor(
    message: string,
    public code: AuthError['code'],
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'JWTError';
  }
}

export const createJWTError = (
  code: AuthError['code'],
  message: string,
  details?: Record<string, unknown>
): JWTError => {
  return new JWTError(message, code, details);
};

// Validation utilities
export const validatePrimaryContext = (context: unknown): context is PrimaryContext => {
  if (!context || typeof context !== 'object') {
    return false;
  }

  const ctx = context as PrimaryContext;
  
  return (
    typeof ctx.diagnosis === 'string' &&
    typeof ctx.primaryInfo === 'string' &&
    typeof ctx.openingLine === 'string' &&
    typeof ctx.isPediatric === 'boolean' &&
    typeof ctx.department === 'string' &&
    typeof ctx.difficultyLevel === 'string'
  );
};

export const validateCreateSessionRequest = (request: unknown): request is CreateSessionRequest => {
  if (!request || typeof request !== 'object') {
    return false;
  }

  const req = request as CreateSessionRequest;
  
  return (
    typeof req.caseId === 'string' &&
    typeof req.userId === 'string' &&
    validatePrimaryContext(req.primaryContext) &&
    (req.expiresIn === undefined || typeof req.expiresIn === 'number')
  );
};
