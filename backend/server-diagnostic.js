//backend/server-diagnostic.js
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import { connectDB } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

app.get('/', (req, res) => {
    res.json({ message: 'Diagnostic server running' });
});

// Test each route file individually
const testRoutes = async () => {
    const routeTests = [
        { name: 'userRoute', path: './routes/userRoute.js', mount: '/api/user' },
        { name: 'productRoute', path: './routes/productRoute.js', mount: '/api/items' },
        { name: 'cartRoute', path: './routes/cartRoute.js', mount: '/api/cart' },
        { name: 'orderRoute', path: './routes/orderRoute.js', mount: '/api/orders' },
        { name: 'adminRoute', path: './routes/adminRoute.js', mount: '/api/admin' }
    ];

    for (const route of routeTests) {
        try {
            console.log(`Testing ${route.name}...`);
            const { default: router } = await import(route.path);
            app.use(route.mount, router);
            console.log(`✅ ${route.name} loaded successfully`);
        } catch (error) {
            console.error(`❌ ${route.name} FAILED:`, error.message);
            console.error(`   This route file contains the malformed pattern!`);
            break; // Stop at the first failed route
        }
    }
};

testRoutes().then(() => {
    console.log('Route testing completed. Starting server...');
    
    app.listen(port, () => {
        console.log(`Diagnostic server started on port ${port}`);
    });
}).catch(error => {
    console.error('Route testing failed:', error);
});