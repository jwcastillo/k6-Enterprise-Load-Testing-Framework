/**
 * Dynamic Cart Mock Handler
 * 
 * Provides stateful shopping cart operations
 */

export default function(app) {
  // In-memory cart store: { userId: [items] }
  const carts = {};

  // Get cart for user
  app.get('/api/cart/:userId', (req, res) => {
    const { userId } = req.params;
    const cart = carts[userId] || [];
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.json({
      userId,
      items: cart,
      itemCount: cart.length,
      total
    });
  });

  // Add item to cart
  app.post('/api/cart/:userId/items', (req, res) => {
    const { userId } = req.params;
    const { productId, name, price, quantity = 1 } = req.body;
    
    if (!productId || !name || !price) {
      return res.status(400).json({ error: 'productId, name, and price are required' });
    }
    
    if (!carts[userId]) {
      carts[userId] = [];
    }
    
    // Check if item already exists
    const existingItem = carts[userId].find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      carts[userId].push({
        id: `item_${Date.now()}`,
        productId,
        name,
        price,
        quantity,
        addedAt: new Date().toISOString()
      });
    }
    
    res.status(201).json({
      message: 'Item added to cart',
      cart: carts[userId]
    });
  });

  // Update item quantity
  app.put('/api/cart/:userId/items/:itemId', (req, res) => {
    const { userId, itemId } = req.params;
    const { quantity } = req.body;
    
    if (!carts[userId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const item = carts[userId].find(i => i.id === itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      carts[userId] = carts[userId].filter(i => i.id !== itemId);
    } else {
      item.quantity = quantity;
    }
    
    res.json({
      message: 'Cart updated',
      cart: carts[userId]
    });
  });

  // Remove item from cart
  app.delete('/api/cart/:userId/items/:itemId', (req, res) => {
    const { userId, itemId } = req.params;
    
    if (!carts[userId]) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const initialLength = carts[userId].length;
    carts[userId] = carts[userId].filter(i => i.id !== itemId);
    
    if (carts[userId].length === initialLength) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    res.status(204).send();
  });

  // Clear cart
  app.delete('/api/cart/:userId', (req, res) => {
    const { userId } = req.params;
    carts[userId] = [];
    res.status(204).send();
  });
}
