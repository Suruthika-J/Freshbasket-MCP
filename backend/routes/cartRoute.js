/*
File: routes/cart.routes.js
*/
import express from 'express';
import {
    getCart,
    addToCart,
    updateCartItem,
    deleteCartItem,
    clearCart
} from '../controllers/cartController.js';
import authMiddleware from '../middleware/auth.js';

const cartRouter = express.Router();
cartRouter.use(authMiddleware);

cartRouter.get('/', getCart);
cartRouter.post('/', addToCart);
cartRouter.put('/:id', updateCartItem);
cartRouter.delete('/:id', deleteCartItem);
cartRouter.post('/clear', clearCart);

export default cartRouter;
