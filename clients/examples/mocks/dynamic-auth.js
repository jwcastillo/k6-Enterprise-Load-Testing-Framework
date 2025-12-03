/**
 * Dynamic Auth Mock Handler
 * 
 * Provides authentication and authorization with token validation
 */

export default function(app) {
  // In-memory token store
  const tokens = new Map(); // token -> { userId, username, expiresAt }
  const users = new Map(); // userId -> user data

  // Register user
  app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }
    
    // Check if user already exists
    const existingUser = Array.from(users.values()).find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const userId = `user_${Date.now()}`;
    const user = {
      id: userId,
      username,
      email,
      createdAt: new Date().toISOString()
    };
    
    users.set(userId, user);
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  });

  // Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const user = Array.from(users.values()).find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    tokens.set(token, {
      userId: user.id,
      username: user.username,
      expiresAt
    });
    
    res.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && tokens.has(token)) {
      tokens.delete(token);
    }
    
    res.status(204).send();
  });

  // Verify token middleware
  function verifyToken(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const tokenData = tokens.get(token);
    
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (new Date() > new Date(tokenData.expiresAt)) {
      tokens.delete(token);
      return res.status(401).json({ error: 'Token expired' });
    }
    
    req.user = tokenData;
    next();
  }

  // Get current user (protected route)
  app.get('/api/auth/me', verifyToken, (req, res) => {
    const user = users.get(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      email: user.email
    });
  });

  // Refresh token
  app.post('/api/auth/refresh', verifyToken, (req, res) => {
    const oldToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Generate new token
    const newToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    tokens.set(newToken, {
      userId: req.user.userId,
      username: req.user.username,
      expiresAt
    });
    
    // Delete old token
    if (oldToken) {
      tokens.delete(oldToken);
    }
    
    res.json({
      token: newToken,
      expiresAt: expiresAt.toISOString()
    });
  });
}
