/**
 * Dynamic Mock Example
 * 
 * This module exports a function that receives the Express app instance.
 * You can define complex logic, dynamic responses, and stateful mocks here.
 */

module.exports = function(app) {
  // In-memory store for dynamic mock
  const users = [];

  // Dynamic POST endpoint
  app.post('/api/dynamic/users', (req, res) => {
    const user = req.body;
    
    if (!user.username || !user.email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    const newUser = {
      id: `user_${Date.now()}`,
      ...user,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    res.status(201).json(newUser);
  });

  // Dynamic GET endpoint with query params
  app.get('/api/dynamic/users', (req, res) => {
    const { limit = 10 } = req.query;
    res.json({
      data: users.slice(0, parseInt(limit)),
      total: users.length
    });
  });

  // Random error simulation
  app.get('/api/flaky', (req, res) => {
    if (Math.random() < 0.3) {
      return res.status(500).json({ error: 'Random server error' });
    }
    res.json({ status: 'success' });
  });
};
