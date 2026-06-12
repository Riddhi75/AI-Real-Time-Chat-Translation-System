import { AuthService } from '../../src/app/services/auth.service';

describe('AuthService Tests', () => {

  it('1. AuthService class should exist', () => {
    expect(AuthService).toBeDefined();
  });

  it('2. AuthService should have login method', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    expect(typeof service.login).toBe('function');
  });

  it('3. AuthService should have register method', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    expect(typeof service.register).toBe('function');
  });

  it('4. AuthService should have saveToken method', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    expect(typeof service.saveToken).toBe('function');
  });

  it('5. AuthService should have getToken method', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    expect(typeof service.getToken).toBe('function');
  });

  it('6. AuthService should have logout method', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    expect(typeof service.logout).toBe('function');
  });

  it('7. saveToken should store token in localStorage', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    const testToken = 'test-token-123';
    service.saveToken(testToken);
    expect(localStorage.getItem('token')).toBe(testToken);
    localStorage.removeItem('token');
  });

  it('8. getToken should retrieve token from localStorage', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    localStorage.setItem('token', 'stored-token');
    const token = service.getToken();
    expect(token).toBe('stored-token');
    localStorage.removeItem('token');
  });

  it('9. logout should remove token from localStorage', () => {
    const mockHttp = {} as any;
    const service = new AuthService(mockHttp);
    localStorage.setItem('token', 'test-token');
    service.logout();
    expect(localStorage.getItem('token')).toBeNull();
  });
});