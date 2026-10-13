import jwt from 'jsonwebtoken';

export const protect = (req, res, next) => {
  let token = null;

  // Check Authorization header for Bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // Fall back to httpOnly cookie named 'token'
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const secret = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';
    const decoded = jwt.verify(token, secret);

    req.user = {
      id: decoded.id,
      email: decoded.email
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }
};

export default protect;
