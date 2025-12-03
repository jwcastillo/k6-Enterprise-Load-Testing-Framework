/**
 * Dynamic User Mock Handler
 * 
 * This module exports a function that receives the Express app instance.
 * Provides dynamic user management with CRUD operations.
 */

export default function(app) {
  // In-memory store for dynamic mock
  const users = [];

  // Create user
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

  // Get all users with pagination
  app.get('/api/dynamic/users', (req, res) => {
    const { limit = 10, offset = 0, search = '' } = req.query;
    
    let filteredUsers = users;
    
    // Search filter
    if (search) {
      filteredUsers = users.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    const start = parseInt(offset);
    const end = start + parseInt(limit);
    
    res.json({
      data: filteredUsers.slice(start, end),
      total: filteredUsers.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  });

  // Get user by ID
  app.get('/api/dynamic/users/:id', (req, res) => {
    const user = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  });

  // Update user
  app.put('/api/dynamic/users/:id', (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users[index] = {
      ...users[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };
    
    res.json(users[index]);
  });

  // Delete user
  app.delete('/api/dynamic/users/:id', (req, res) => {
    const index = users.findIndex(u => u.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    users.splice(index, 1);
    res.status(204).send();
  });

  // Random error simulation
  app.get('/api/flaky', (req, res) => {
    if (Math.random() < 0.3) {
      return res.status(500).json({ error: 'Random server error' });
    }
    res.json({ status: 'success' });
  });
}
