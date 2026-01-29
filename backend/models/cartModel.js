//backend/models/cartModel.js
import mongoose from 'mongoose';
const CartItemSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1, min: 1 }
}, { timestamps: true });

export const CartItem = mongoose.model('CartItem', CartItemSchema);