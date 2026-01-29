// frontend/src/components/UserOrderTracking.jsx - COMPLETE COMPONENT
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { FiX, FiPackage, FiTruck, FiMapPin, FiRefreshCw } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
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

const agentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
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

const UserOrderTracking = ({ isOpen, onClose, order }) => {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Fetch tracking data
    const fetchTracking = async () => {
        if (!order || !order._id) return;

        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:4000/api/orders/${order._id}/track`
            );

            if (response.data.success) {
                setTrackingData(response.data);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching tracking:', err);
            setError('Failed to load tracking information');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && order) {
            fetchTracking();

            // Auto-refresh every 10 seconds if order is in transit and auto-refresh is enabled
            const interval = setInterval(() => {
                if (autoRefresh && (order.status === 'Shipped' || order.status === 'Processing')) {
                    fetchTracking();
                }
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [isOpen, order, autoRefresh]);

    if (!isOpen) return null;

    // Calculate map center and bounds
    const getMapCenter = () => {
        if (trackingData?.agentLocation) {
            return [trackingData.agentLocation.latitude, trackingData.agentLocation.longitude];
        }
        if (trackingData?.storeLocation) {
            return [trackingData.storeLocation.latitude, trackingData.storeLocation.longitude];
        }
        return [9.1700, 77.8700]; // Default Kovilpatti
    };

    // Build route line
    const getRouteLine = () => {
        const points = [];
        
        if (trackingData?.storeLocation) {
            points.push([
                trackingData.storeLocation.latitude,
                trackingData.storeLocation.longitude
            ]);
        }
        
        if (trackingData?.agentLocation) {
            points.push([
                trackingData.agentLocation.latitude,
                trackingData.agentLocation.longitude
            ]);
        }
        
        if (trackingData?.deliveryLocation) {
            points.push([
                trackingData.deliveryLocation.latitude,
                trackingData.deliveryLocation.longitude
            ]);
        }
        
        return points;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold">Track Order</h2>
                        <p className="text-sm text-green-100">Order ID: {order?.orderId}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchTracking}
                            disabled={loading}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                            title="Refresh tracking"
                        >
                            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 text-2xl"
                        >
                            <FiX />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading && !trackingData ? (
                        <div className="flex items-center justify-center h-96">
                            <FiRefreshCw className="animate-spin text-4xl text-green-600" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-96 text-red-600">
                            <p className="text-lg font-medium">{error}</p>
                            <button
                                onClick={fetchTracking}
                                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Retry
                            </button>
                        </div>
                    ) : trackingData ? (
                        <div className="space-y-6">
                            {/* Status Info */}
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            Order Status: {trackingData.status}
                                        </h3>
                                        {trackingData.assignedAgent && (
                                            <p className="text-sm text-gray-600 mt-1">
                                                Delivery Agent: {trackingData.assignedAgent.name}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {trackingData.trackingEnabled && (
                                            <div className="flex items-center text-green-600">
                                                <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse mr-2"></div>
                                                <span className="text-sm font-medium">Live Tracking</span>
                                            </div>
                                        )}
                                        {/* Auto-refresh toggle */}
                                        {(order.status === 'Shipped' || order.status === 'Processing') && (
                                            <button
                                                onClick={() => setAutoRefresh(!autoRefresh)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    autoRefresh
                                                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                                            >
                                                {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Map */}
                            {trackingData.trackingEnabled ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <MapContainer
                                        center={getMapCenter()}
                                        zoom={13}
                                        style={{ height: '500px', width: '100%' }}
                                        scrollWheelZoom={true}
                                    >
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />

                                        {/* Store Marker */}
                                        {trackingData.storeLocation && (
                                            <Marker
                                                position={[
                                                    trackingData.storeLocation.latitude,
                                                    trackingData.storeLocation.longitude
                                                ]}
                                                icon={storeIcon}
                                            >
                                                <Popup>
                                                    <div className="text-center">
                                                        <FiPackage className="mx-auto text-green-600 text-2xl mb-2" />
                                                        <strong>Store Location</strong>
                                                        <p className="text-sm">
                                                            {trackingData.storeLocation.address}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* Agent Marker */}
                                        {trackingData.agentLocation && (
                                            <Marker
                                                position={[
                                                    trackingData.agentLocation.latitude,
                                                    trackingData.agentLocation.longitude
                                                ]}
                                                icon={agentIcon}
                                            >
                                                <Popup>
                                                    <div className="text-center">
                                                        <FiTruck className="mx-auto text-blue-600 text-2xl mb-2" />
                                                        <strong>Delivery Agent</strong>
                                                        <p className="text-sm">
                                                            {trackingData.assignedAgent?.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Last updated: {new Date(trackingData.agentLocation.updatedAt).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* Customer Marker */}
                                        {trackingData.deliveryLocation && (
                                            <Marker
                                                position={[
                                                    trackingData.deliveryLocation.latitude,
                                                    trackingData.deliveryLocation.longitude
                                                ]}
                                                icon={customerIcon}
                                            >
                                                <Popup>
                                                    <div className="text-center">
                                                        <FiMapPin className="mx-auto text-red-600 text-2xl mb-2" />
                                                        <strong>Delivery Address</strong>
                                                        <p className="text-sm">
                                                            {trackingData.customer.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {trackingData.customer.address}
                                                        </p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        )}

                                        {/* Route Line */}
                                        {getRouteLine().length > 1 && (
                                            <Polyline
                                                positions={getRouteLine()}
                                                color="#10b981"
                                                weight={4}
                                                opacity={0.7}
                                                dashArray="10, 10"
                                            />
                                        )}
                                    </MapContainer>
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-lg p-12 text-center">
                                    <FiMapPin className="mx-auto text-gray-400 text-6xl mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Tracking Not Available
                                    </h3>
                                    <p className="text-gray-600">
                                        Live tracking will be available once your order is assigned to a delivery agent.
                                    </p>
                                </div>
                            )}

                            {/* Legend */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg">
                                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                                    <span className="text-sm font-medium">Store</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg">
                                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm font-medium">Delivery Agent</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-red-50 p-3 rounded-lg">
                                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                                    <span className="text-sm font-medium">Your Location</span>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserOrderTracking;