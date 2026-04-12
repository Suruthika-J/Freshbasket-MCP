// frontend/src/page/DeliveryDashboard.jsx - COMPLETE WITH TRACKING (Part 1)
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiPhone, FiMail, FiLogOut, FiRefreshCw, FiNavigation } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import 'leaflet/dist/leaflet.css';

// ✅ Get API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons
const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const DeliveryDashboard = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [agentInfo, setAgentInfo] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // NEW: Location tracking state - PERSISTENT ACROSS REFRESHES
    const [isSharing, setIsSharing] = useState(() => {
        // Check localStorage for persistent sharing state
        const saved = localStorage.getItem('locationSharingActive');
        return saved === 'true';
    });
    const [currentLocation, setCurrentLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [activeOrderId, setActiveOrderId] = useState(() => {
        // Check which order is actively being tracked
        return localStorage.getItem('activeTrackingOrderId') || null;
    });

    useEffect(() => {
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsedData = JSON.parse(userData);
                setAgentInfo(parsedData);
            } catch (error) {
                console.error('Error parsing user data:', error);
            }
        }
    }, []);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('authToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    };

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');

            if (!token) {
                toast.error('Please login again');
                navigate('/login');
                return;
            }

            const response = await axios.get(
                `${API_BASE_URL}/api/sub-orders/delivery-agent`,
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                // Backend returns { success: true, count: X, subOrders: [...] }
                setOrders(response.data.subOrders);
            }
        } catch (error) {
            console.error('Fetch orders error:', error);
            if (error.response?.status === 401) {
                toast.error('Session expired. Please login again');
                handleLogout();
            } else {
                toast.error('Failed to load orders');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    // NEW: Auto-resume location sharing on component mount if previously active
    useEffect(() => {
        if (isSharing && activeOrderId) {
            // Find the active order and resume sharing
            const activeOrder = orders.find(order => order._id === activeOrderId);
            if (activeOrder && (activeOrder.deliveryStatus === 'PICKED_UP' || activeOrder.deliveryStatus === 'ASSIGNED')) {
                console.log('Resuming location sharing for order:', activeOrderId);
                startLocationSharing(activeOrder);
            } else {
                // Order is no longer active, stop sharing
                stopLocationSharing();
            }
        }
    }, [orders, isSharing, activeOrderId]);

    const handleLogout = () => {
        // NEW: Stop location sharing on logout
        stopLocationSharing();

        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        window.dispatchEvent(new Event('authStateChanged'));
        navigate('/login');
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        setActionLoading(true);
        try {
            // Updated to PATCH /api/sub-orders/:id/status
            const response = await axios.patch(
                `${API_BASE_URL}/api/sub-orders/${orderId}/status`,
                { deliveryStatus: newStatus },
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                toast.success(`Order marked as ${newStatus}`);
                fetchOrders();
                setIsModalOpen(false);
            }
        } catch (error) {
            console.error('Update status error:', error);
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(false);
        }
    };

    const updatePaymentStatus = async (orderId, paymentStatus) => {
        setActionLoading(true);
        try {
            const response = await axios.patch(
                `${API_BASE_URL}/api/sub-orders/${orderId}/payment-status`,
                { paymentStatus },
                { headers: getAuthHeaders() }
            );

            if (response.data.success) {
                toast.success(`Payment marked as ${paymentStatus}`);
                fetchOrders();
                // Update selected order locally
                if (selectedOrder) {
                    setSelectedOrder(prev => ({
                        ...prev,
                        paymentStatus: paymentStatus,
                        parentOrder: prev.parentOrder ? { ...prev.parentOrder, paymentStatus: paymentStatus } : prev.parentOrder
                    }));
                }
            }
        } catch (error) {
            console.error('Update payment status error:', error);
            toast.error(error.response?.data?.message || 'Failed to update payment status');
        } finally {
            setActionLoading(false);
        }
    };

    // NEW: Location sharing functions with improved error handling
    const requestLocationPermission = async () => {
        if (!navigator.permissions) {
            return true; // Assume permission if not supported
        }

        try {
            const result = await navigator.permissions.query({ name: 'geolocation' });
            return result.state === 'granted';
        } catch (error) {
            console.warn('Permission query not supported:', error);
            return true;
        }
    };

    const startLocationSharing = async (order = selectedOrder) => {
        if (!navigator.geolocation) {
            setLocationError('Geolocation is not supported by your browser. Please update your browser or enable location services.');
            toast.error('Geolocation not supported');
            return;
        }

        // Check permissions first
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            setLocationError('Location permission is required. Please enable location access in your browser settings and try again.');
            toast.error('Location permission denied. Please enable location access.');
            return;
        }

        setIsSharing(true);
        setLocationError(null);

        // NEW: Persist sharing state and active order
        localStorage.setItem('locationSharingActive', 'true');
        if (order) {
            setActiveOrderId(order._id);
            localStorage.setItem('activeTrackingOrderId', order._id);
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000, // Increased timeout
            maximumAge: 30000 // Allow cached positions up to 30 seconds
        };

        const successCallback = (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            setCurrentLocation({ latitude, longitude, accuracy });

            // Update location for active order
            if (order || activeOrderId) {
                const orderId = order ? order._id : activeOrderId;
                updateAgentLocation(orderId, latitude, longitude);
            }
        };

        const errorCallback = (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = '';

            switch (error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location permissions in your browser settings and refresh the page.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable. Please check your GPS settings.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Retrying with lower accuracy...';
                    // Fallback: Try without high accuracy
                    setTimeout(() => {
                        if (isSharing) {
                            navigator.geolocation.watchPosition(
                                successCallback,
                                (fallbackError) => {
                                    console.error('Fallback geolocation error:', fallbackError);
                                    setLocationError('Unable to get location even with reduced accuracy. Please check your device settings.');
                                    toast.error('Location sharing failed');
                                    stopLocationSharing();
                                },
                                { ...options, enableHighAccuracy: false }
                            );
                        }
                    }, 1000);
                    return;
                default:
                    errorMessage = 'An unknown error occurred while retrieving location.';
                    break;
            }

            setLocationError(errorMessage);
            toast.error(errorMessage);
            stopLocationSharing();
        };

        // Get initial position first
        navigator.geolocation.getCurrentPosition(
            (position) => {
                successCallback(position);
                // Then start watching for continuous updates
                const watchId = navigator.geolocation.watchPosition(successCallback, errorCallback, options);
                window.locationWatchId = watchId;
            },
            errorCallback,
            options
        );
    };

    const stopLocationSharing = () => {
        if (window.locationWatchId) {
            navigator.geolocation.clearWatch(window.locationWatchId);
            window.locationWatchId = null;
        }
        setIsSharing(false);
        setCurrentLocation(null);
        setLocationError(null);
        setActiveOrderId(null);

        // NEW: Clear persistent state
        localStorage.removeItem('locationSharingActive');
        localStorage.removeItem('activeTrackingOrderId');

        toast.info('Location sharing stopped');
    };

    const updateAgentLocation = async (subOrderId, latitude, longitude) => {
        try {
            await axios.post(
                `${API_BASE_URL}/api/sub-orders/agent/update-location`,
                {
                    subOrderId,
                    latitude,
                    longitude
                },
                { headers: getAuthHeaders() }
            );
        } catch (error) {
            console.error('Location update error:', error);
        }
    };

    // Auto-update location every 5 seconds when sharing
    useEffect(() => {
        if (isSharing && (selectedOrder || activeOrderId) && currentLocation) {
            const orderId = selectedOrder ? selectedOrder._id : activeOrderId;
            const interval = setInterval(() => {
                updateAgentLocation(
                    orderId,
                    currentLocation.latitude,
                    currentLocation.longitude
                );
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [isSharing, selectedOrder, activeOrderId, currentLocation]);

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'Processing':
                return 'bg-blue-100 text-blue-800';
            case 'Shipped':
                return 'bg-purple-100 text-purple-800';
            case 'Delivered':
                return 'bg-green-100 text-green-800';
            case 'Cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate order statistics
    const stats = {
        total: orders.length,
        pending: orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length,
        shipped: orders.filter(o => o.status === 'Shipped').length,
        delivered: orders.filter(o => o.status === 'Delivered').length
    };

    // Get map center
    const getMapCenter = () => {
        if (currentLocation) {
            return [currentLocation.latitude, currentLocation.longitude];
        }
        return [9.1700, 77.8700]; // Default Kovilpatti
    };

    // Build route line
    const getRouteLine = () => {
        const points = [];

        // Store location
        points.push([9.1700, 77.8700]);

        // Current location
        if (currentLocation) {
            points.push([currentLocation.latitude, currentLocation.longitude]);
        }

        // Delivery location (if geocoded)
        if (selectedOrder?.deliveryLocation) {
            points.push([
                selectedOrder.deliveryLocation.latitude,
                selectedOrder.deliveryLocation.longitude
            ]);
        }

        return points;
    };

    // Continue in Part 2...
    // frontend/src/page/DeliveryDashboard.jsx - COMPLETE (Part 2 - JSX Return)

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className="bg-white/20 p-2.5 sm:p-3 rounded-full backdrop-blur-sm">
                                <FiTruck className="text-2xl sm:text-3xl" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold">Delivery Dashboard</h1>
                                <p className="text-blue-100 text-sm sm:text-base">Welcome, {agentInfo?.name || 'Agent'}</p>
                            </div>
                        </div>
                        <div className="delivery-header-actions flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                            <button
                                onClick={fetchOrders}
                                disabled={loading}
                                className="flex items-center px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm text-sm font-medium flex-1 sm:flex-none justify-center"
                            >
                                <FiRefreshCw className={`mr-2 w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors text-sm font-medium flex-1 sm:flex-none justify-center"
                            >
                                <FiLogOut className="mr-2 w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
                {/* Agent Info Card */}
                <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center">
                        <FiPackage className="mr-2 text-blue-600" />
                        Agent Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="flex items-center">
                            <FiMail className="text-gray-400 mr-3 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-gray-600">Email</p>
                                <p className="font-medium text-sm truncate">{agentInfo?.email || 'N/A'}</p>
                            </div>
                        </div>
                        {agentInfo?.phone && (
                            <div className="flex items-center">
                                <FiPhone className="text-gray-400 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-xs text-gray-600">Phone</p>
                                    <p className="font-medium text-sm">{agentInfo.phone}</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center">
                            <FiClock className="text-gray-400 mr-3 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-600">Role</p>
                                <p className="font-medium text-sm capitalize">{agentInfo?.role || 'Delivery Agent'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Total Orders</p>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="bg-blue-100 p-2 sm:p-3 rounded-full">
                                <FiPackage className="text-blue-600 text-lg sm:text-2xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Pending</p>
                                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.pending}</p>
                            </div>
                            <div className="bg-yellow-100 p-2 sm:p-3 rounded-full">
                                <FiClock className="text-yellow-600 text-lg sm:text-2xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Shipped</p>
                                <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.shipped}</p>
                            </div>
                            <div className="bg-purple-100 p-2 sm:p-3 rounded-full">
                                <FiTruck className="text-purple-600 text-lg sm:text-2xl" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-600 text-xs sm:text-sm">Delivered</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.delivered}</p>
                            </div>
                            <div className="bg-green-100 p-2 sm:p-3 rounded-full">
                                <FiCheckCircle className="text-green-600 text-lg sm:text-2xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-white rounded-lg shadow-md">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Assigned Orders</h2>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your delivery orders</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <FiRefreshCw className="animate-spin text-4xl text-blue-600" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <FiPackage className="mx-auto text-5xl sm:text-6xl text-gray-300 mb-4" />
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
                                No Orders Assigned
                            </h3>
                            <p className="text-gray-500 text-sm sm:text-base">
                                You don't have any orders assigned yet
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50">
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-blue-600">
                                                {order.subOrderId}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <div className="text-xs sm:text-sm font-medium text-gray-900">
                                                    {order.parentOrder?.customer?.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {order.parentOrder?.customer?.phone || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                                ₹{order.total?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${order.deliveryStatus === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                                                    order.deliveryStatus === 'PICKED_UP' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.deliveryStatus || 'ASSIGNED'}
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                <button
                                                    onClick={() => viewOrderDetails(order)}
                                                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Details Modal with Map */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    stopLocationSharing();
                    setSelectedOrder(null);
                }}
                title={`Order Details: ${selectedOrder?.orderId}`}
                size="xl"
            >
                {selectedOrder && (
                    <>
                        {/* Location Sharing Controls */}
                        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <FiNavigation className="text-green-600 text-2xl" />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Live Location Sharing
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {isSharing
                                                ? `Sharing location for ${activeOrderId === selectedOrder?._id ? 'this order' : 'active order'} until manually stopped`
                                                : 'Share your location to enable real-time tracking'
                                            }
                                        </p>
                                        {isSharing && activeOrderId && (
                                            <p className="text-xs text-green-600 font-medium mt-1">
                                                🔄 Auto-sharing active - persists across page refreshes
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={isSharing ? stopLocationSharing : () => startLocationSharing(selectedOrder)}
                                    disabled={false}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isSharing
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isSharing ? (
                                        <>
                                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                            Stop Sharing
                                        </>
                                    ) : (
                                        <>
                                            <FiNavigation />
                                            Start Sharing
                                        </>
                                    )}
                                </button>
                            </div>
                            {locationError && (
                                <p className="mt-2 text-sm text-red-600">{locationError}</p>
                            )}
                            {currentLocation && (
                                <p className="mt-2 text-xs text-gray-500">
                                    Current: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                    {currentLocation.accuracy && ` (±${Math.round(currentLocation.accuracy)}m)`}
                                </p>
                            )}
                        </div>

                        {/* Map */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
                            <MapContainer
                                center={getMapCenter()}
                                zoom={13}
                                style={{ height: '400px', width: '100%' }}
                                scrollWheelZoom={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />

                                {/* Store Marker */}
                                <Marker position={[9.1700, 77.8700]} icon={storeIcon}>
                                    <Popup>
                                        <div className="text-center">
                                            <strong>Store Location</strong>
                                            <p className="text-sm">Kovilpatti, Tamil Nadu</p>
                                        </div>
                                    </Popup>
                                </Marker>

                                {/* Current Location Marker */}
                                {currentLocation && (
                                    <Marker
                                        position={[currentLocation.latitude, currentLocation.longitude]}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <strong>Your Current Location</strong>
                                                <p className="text-xs text-gray-500">
                                                    Live tracking enabled
                                                </p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Customer Marker */}
                                {selectedOrder.deliveryLocation && (
                                    <Marker
                                        position={[
                                            selectedOrder.deliveryLocation.latitude,
                                            selectedOrder.deliveryLocation.longitude
                                        ]}
                                        icon={customerIcon}
                                    >
                                        <Popup>
                                            <div className="text-center">
                                                <strong>Delivery Address</strong>
                                                <p className="text-sm">{selectedOrder.customer?.name}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Route Line */}
                                {getRouteLine().length > 1 && (
                                    <Polyline
                                        positions={getRouteLine()}
                                        color="#3b82f6"
                                        weight={4}
                                        opacity={0.7}
                                        dashArray="10, 10"
                                    />
                                )}
                            </MapContainer>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-lg mb-3 flex items-center">
                                <FiMapPin className="mr-2 text-blue-600" />
                                Customer Information
                            </h3>
                            <div className="space-y-2">
                                <p><strong>Name:</strong> {selectedOrder.parentOrder?.customer?.name || 'N/A'}</p>
                                <p><strong>Phone:</strong> {selectedOrder.parentOrder?.customer?.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> {selectedOrder.parentOrder?.customer?.email || 'N/A'}</p>
                                <p><strong>Address:</strong> {selectedOrder.parentOrder?.customer?.address || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-semibold text-lg mb-3 flex items-center">
                                <FiPackage className="mr-2 text-blue-600" />
                                Order Items
                            </h3>
                            <div className="space-y-2">
                                {selectedOrder.items?.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <div className="flex items-center space-x-3">
                                            {item.imageUrl && (
                                                <img
                                                    src={`${API_BASE_URL}${item.imageUrl}`}
                                                    alt={item.name}
                                                    className="w-12 h-12 object-cover rounded"
                                                />
                                            )}
                                            <div>
                                                <p className="font-medium">{item.name}</p>
                                                <p className="text-sm text-gray-600">
                                                    ₹{item.price.toFixed(2)} × {item.quantity}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="font-semibold">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-semibold text-lg">Order Summary</h3>
                                {(selectedOrder.parentOrder?.paymentStatus !== 'Paid' && selectedOrder.paymentStatus !== 'Paid') ? (
                                    <button
                                        onClick={() => updatePaymentStatus(selectedOrder._id, 'Paid')}
                                        disabled={actionLoading}
                                        className="px-4 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
                                    >
                                        <FiCheckCircle size={14} />
                                        Mark as Paid
                                    </button>
                                ) : (
                                    <span className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-100 px-3 py-1 rounded-lg">
                                        <FiCheckCircle size={14} /> PAID
                                    </span>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="font-medium">{selectedOrder.parentOrder?.paymentMethod || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Payment Status:</span>
                                    <span className={`font-medium ${(selectedOrder.parentOrder?.paymentStatus === 'Paid' || selectedOrder.paymentStatus === 'Paid') ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedOrder.parentOrder?.paymentStatus || selectedOrder.paymentStatus || 'Unpaid'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
                                    <span>Total Amount:</span>
                                    <span className="text-blue-600">₹{selectedOrder.total?.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Status Update Buttons */}
                        {
                            selectedOrder.deliveryStatus !== 'DELIVERED' && selectedOrder.status !== 'cancelled' && (
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    {/* Only allow PICKED_UP if currently ASSIGNED */}
                                    {selectedOrder.deliveryStatus === 'ASSIGNED' && (
                                        <button
                                            onClick={() => updateOrderStatus(selectedOrder._id, 'PICKED_UP')}
                                            disabled={actionLoading}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            {actionLoading ? 'Updating...' : 'Mark as Picked Up'}
                                        </button>
                                    )}

                                    {/* Only allow DELIVERED if currently PICKED_UP */}
                                    {selectedOrder.deliveryStatus === 'PICKED_UP' && (
                                        <button
                                            onClick={() => updateOrderStatus(selectedOrder._id, 'DELIVERED')}
                                            disabled={actionLoading}
                                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
                                        >
                                            <FiCheckCircle className="mr-2" />
                                            {actionLoading ? 'Updating...' : 'Mark as Delivered'}
                                        </button>
                                    )}
                                </div>
                            )
                        }
                    </>
                )}
            </Modal >
        </div >
    );
};

export default DeliveryDashboard;
