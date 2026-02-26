// backend/controllers/farmerController.js
import { Product } from '../models/productModel.js';
import SubOrder from '../models/SubOrderModel.js';
import mongoose from 'mongoose';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

// Helper to get date range based on filter
const getDateRange = (filter) => {
    const now = new Date();
    switch (filter) {
        case 'today':
            return { start: startOfDay(now), end: endOfDay(now) };
        case 'week':
            return { start: startOfWeek(now), end: endOfWeek(now) };
        case 'month':
            return { start: startOfMonth(now), end: endOfMonth(now) };
        default:
            return { start: startOfMonth(now), end: endOfMonth(now) };
    }
};

// 1. GET /api/farmer/analytics/summary
export const getFarmerSummary = async (req, res) => {
    try {
        const farmerId = req.user._id.toString();
        const { filter = 'month' } = req.query;
        const { start, end } = getDateRange(filter);

        // Previous period range for comparison
        const diff = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - diff);
        const prevEnd = new Date(end.getTime() - diff);

        // Current period stats
        const currentStats = await SubOrder.aggregate([
            {
                $match: {
                    'vendor.vendorId': farmerId,
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$subtotal' }, // Using subtotal for farmer's share
                    completedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Previous period stats for comparison
        const prevStats = await SubOrder.aggregate([
            {
                $match: {
                    'vendor.vendorId': farmerId,
                    createdAt: { $gte: prevStart, $lte: prevEnd }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$subtotal' }
                }
            }
        ]);

        // Total products listed (all time)
        const totalProducts = await Product.countDocuments({ farmerId });

        const current = currentStats[0] || { totalOrders: 0, totalRevenue: 0, completedOrders: 0 };
        const previous = prevStats[0] || { totalOrders: 0, totalRevenue: 0 };

        // Calculate percentage changes
        const calculateChange = (curr, prev) => {
            if (prev === 0) return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };

        res.status(200).json({
            success: true,
            summary: {
                totalOrders: {
                    value: current.totalOrders,
                    change: calculateChange(current.totalOrders, previous.totalOrders)
                },
                totalRevenue: {
                    value: current.totalRevenue,
                    change: calculateChange(current.totalRevenue, previous.totalRevenue)
                },
                completedOrders: {
                    value: current.completedOrders,
                    // No comparison for completed since it's a subset
                },
                totalProducts: {
                    value: totalProducts
                }
            }
        });
    } catch (error) {
        console.error('Error in getFarmerSummary:', error);
        res.status(500).json({ success: false, message: 'Server error fetching analytics' });
    }
};

// 2. GET /api/farmer/analytics/sales
export const getFarmerSalesPerformance = async (req, res) => {
    try {
        const farmerId = req.user._id.toString();
        const { filter = 'month' } = req.query;
        const { start, end } = getDateRange(filter);

        // Group by day for the trend charts
        const salesTrend = await SubOrder.aggregate([
            {
                $match: {
                    'vendor.vendorId': farmerId,
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    revenue: { $sum: "$subtotal" },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Format data for Recharts
        const chartData = salesTrend.map(item => ({
            date: item._id,
            revenue: item.revenue,
            orders: item.orders
        }));

        res.status(200).json({
            success: true,
            chartData
        });
    } catch (error) {
        console.error('Error in getFarmerSalesPerformance:', error);
        res.status(500).json({ success: false, message: 'Server error fetching sales analytics' });
    }
};

// 3. GET /api/farmer/analytics/products
export const getFarmerProductAnalytics = async (req, res) => {
    try {
        const farmerId = req.user._id.toString();

        // 1. Top Selling Products (from SubOrders)
        const topSelling = await SubOrder.aggregate([
            { $match: { 'vendor.vendorId': farmerId, status: 'delivered' } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // 2. Out of Stock / Low Stock Products
        const lowStockThreshold = 5;
        const inventoryStatus = await Product.find({
            farmerId,
            stock: { $lte: lowStockThreshold }
        })
            .select('name stock price unit')
            .sort({ stock: 1 });

        res.status(200).json({
            success: true,
            topSelling,
            inventoryStatus
        });
    } catch (error) {
        console.error('Error in getFarmerProductAnalytics:', error);
        res.status(500).json({ success: false, message: 'Server error fetching product analytics' });
    }
};

// 4. GET /api/farmer/analytics/order-status
export const getFarmerOrderStatusDistribution = async (req, res) => {
    try {
        const farmerId = req.user._id.toString();

        const statusDistribution = await SubOrder.aggregate([
            { $match: { 'vendor.vendorId': farmerId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Add deliveryType distribution for deeper insight
        const deliveryDistribution = await SubOrder.aggregate([
            { $match: { 'vendor.vendorId': farmerId } },
            {
                $group: {
                    _id: "$deliveryType",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            statusDistribution,
            deliveryDistribution
        });
    } catch (error) {
        console.error('Error in getFarmerOrderStatusDistribution:', error);
        res.status(500).json({ success: false, message: 'Server error fetching status analytics' });
    }
};
