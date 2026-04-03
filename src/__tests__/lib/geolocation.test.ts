import { calculateDistance, formatDistance, getUserLocation } from '../../lib/geolocation';

describe('Lib - Geolocation', () => {
  describe('calculateDistance', () => {
    it('should calculate ~1138km between Hanoi and Ho Chi Minh City', () => {
      // Hanoi: 21.0285, 105.8542 | HCM: 10.8231, 106.6297
      const distance = calculateDistance(21.0285, 105.8542, 10.8231, 106.6297);
      expect(distance).toBeGreaterThan(1080);
      expect(distance).toBeLessThan(1200);
    });

    it('should return 0 for same coordinates', () => {
      const distance = calculateDistance(10.0, 106.0, 10.0, 106.0);
      expect(distance).toBe(0);
    });

    it('should be symmetric (A->B equals B->A)', () => {
      const ab = calculateDistance(21.0285, 105.8542, 10.8231, 106.6297);
      const ba = calculateDistance(10.8231, 106.6297, 21.0285, 105.8542);
      expect(Math.abs(ab - ba)).toBeLessThan(0.001);
    });
  });

  describe('formatDistance', () => {
    it('should format 0.5km as "500m"', () => {
      expect(formatDistance(0.5)).toBe('500m');
    });

    it('should format 2.35km as "2.4km" (1 decimal)', () => {
      expect(formatDistance(2.35)).toBe('2.4km');
    });

    it('should format 0.001km as "1m"', () => {
      expect(formatDistance(0.001)).toBe('1m');
    });
  });

  describe('getUserLocation', () => {
    const originalNavigator = global.navigator;

    afterEach(() => {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it('should resolve with lat/lng on success', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          geolocation: {
            getCurrentPosition: (success: Function) => {
              success({ coords: { latitude: 10.82, longitude: 106.63 } });
            },
          },
        },
        writable: true,
        configurable: true,
      });

      const loc = await getUserLocation();
      expect(loc).toEqual({ lat: 10.82, lng: 106.63 });
    });

    it('should reject when geolocation is not supported', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      await expect(getUserLocation()).rejects.toThrow('không hỗ trợ định vị');
    });

    it('should reject with PERMISSION_DENIED error', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          geolocation: {
            getCurrentPosition: (_: Function, error: Function) => {
              error({ code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
            },
          },
        },
        writable: true,
        configurable: true,
      });

      await expect(getUserLocation()).rejects.toThrow('từ chối quyền truy cập vị trí');
    });

    it('should reject with POSITION_UNAVAILABLE error', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          geolocation: {
            getCurrentPosition: (_: Function, error: Function) => {
              error({ code: 2, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
            },
          },
        },
        writable: true,
        configurable: true,
      });

      await expect(getUserLocation()).rejects.toThrow('Không thể xác định vị trí');
    });

    it('should reject with TIMEOUT error', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          geolocation: {
            getCurrentPosition: (_: Function, error: Function) => {
              error({ code: 3, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
            },
          },
        },
        writable: true,
        configurable: true,
      });

      await expect(getUserLocation()).rejects.toThrow('Hết thời gian chờ');
    });

    it('should reject with default error for unknown code', async () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          geolocation: {
            getCurrentPosition: (_: Function, error: Function) => {
              error({ code: 99, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
            },
          },
        },
        writable: true,
        configurable: true,
      });

      await expect(getUserLocation()).rejects.toThrow('Lỗi không xác định');
    });
  });
});
