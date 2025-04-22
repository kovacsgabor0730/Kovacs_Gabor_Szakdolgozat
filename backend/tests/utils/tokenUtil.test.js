const protect = require('../../src/middlewares/authMiddleware');
const { verifyToken } = require('../../src/utils/tokenUtil');

jest.mock('../../src/utils/tokenUtil');

describe('Auth Middleware', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    verifyToken.mockReset();
  });

  it('should call next() when token is valid', () => {
    const userId = '12345';
    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue({ id: userId });

    protect(req, res, next);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(req.userId).toBe(userId);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

it('should return 401 when no token is provided', () => {
    protect(req, res, next);
  
    expect(verifyToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
  
  it('should return 401 when token format is invalid', () => {
    req.headers.authorization = 'InvalidToken';
  
    protect(req, res, next);
  
    expect(verifyToken).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized" });
  });
  
  it('should return 401 when token verification fails', () => {
    req.headers.authorization = 'Bearer invalid-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Token verification failed');
    });
  
    protect(req, res, next);
  
    expect(verifyToken).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
  });
});