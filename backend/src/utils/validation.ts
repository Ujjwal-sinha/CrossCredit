// Validation utilities for backend operations

export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidCreditScore(score: any): boolean {
  return typeof score === 'number' && score >= 0 && score <= 1000;
}

export function sanitizeAddress(address: string): string {
  return address.toLowerCase().trim();
}

export function validatePagination(page?: any, limit?: any): { page: number; limit: number } {
  const validPage = typeof page === 'string' ? parseInt(page, 10) : 1;
  const validLimit = typeof limit === 'string' ? parseInt(limit, 10) : 10;
  
  return {
    page: Math.max(1, isNaN(validPage) ? 1 : validPage),
    limit: Math.min(100, Math.max(1, isNaN(validLimit) ? 10 : validLimit)),
  };
}

export function validateAmount(amount: any): boolean {
  if (typeof amount === 'string') {
    const parsed = parseFloat(amount);
    return !isNaN(parsed) && parsed > 0;
  }
  return typeof amount === 'number' && amount > 0;
}

export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength);
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateUserProfileRequest(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!body.address || !isValidEthereumAddress(body.address)) {
    errors.push({ field: 'address', message: 'Valid Ethereum address is required' });
  }
  
  return errors;
}

export function validateCreditScoreRequest(body: any): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!body.address || !isValidEthereumAddress(body.address)) {
    errors.push({ field: 'address', message: 'Valid Ethereum address is required' });
  }
  
  if (!isValidCreditScore(body.creditScore)) {
    errors.push({ field: 'creditScore', message: 'Credit score must be a number between 0 and 1000' });
  }
  
  return errors;
} 