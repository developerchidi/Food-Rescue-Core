import {
  publicRoutes,
  authRoutes,
  apiAuthPrefix,
  DEFAULT_LOGIN_REDIRECT,
  ratelimitRoutes,
} from '../../lib/routes';

describe('Lib - Routes', () => {
  describe('publicRoutes', () => {
    it('should contain root, about, and contact', () => {
      expect(publicRoutes).toContain('/');
      expect(publicRoutes).toContain('/about');
      expect(publicRoutes).toContain('/contact');
    });

    it('should contain all expected public routes', () => {
      const expected = ['/', '/about', '/contact', '/faq', '/impact', '/partners', '/privacy', '/terms', '/help'];
      expected.forEach(route => {
        expect(publicRoutes).toContain(route);
      });
    });
  });

  describe('authRoutes', () => {
    it('should contain login and register', () => {
      expect(authRoutes).toContain('/login');
      expect(authRoutes).toContain('/register');
    });
  });

  describe('apiAuthPrefix', () => {
    it('should be /api/auth', () => {
      expect(apiAuthPrefix).toBe('/api/auth');
    });
  });

  describe('DEFAULT_LOGIN_REDIRECT', () => {
    it('should redirect to /', () => {
      expect(DEFAULT_LOGIN_REDIRECT).toBe('/');
    });
  });

  describe('ratelimitRoutes', () => {
    it('should contain /api/auth/register and /api/contact', () => {
      expect(ratelimitRoutes).toContain('/api/auth/register');
      expect(ratelimitRoutes).toContain('/api/contact');
    });
  });
});
