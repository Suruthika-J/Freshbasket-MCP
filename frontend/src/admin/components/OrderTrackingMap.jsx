// admin/src/components/OrderTrackingMap.jsx - NEW ADMIN COMPONENT
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { FiX, FiPackage, FiTruck, FiMapPin, FiRefreshCw, FiAlertCircle } from 'react-icons/fi';
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

const OrderTrackingMap = ({ isOpen, onClose, order }) => {
    const [trackingData, setTrackingData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
            
            // Auto-refresh every 10 seconds if order is in transit
            const interval = setInterval(() => {
                if (order.status === 'Shipped' || order.status === 'Processing') {
                    fetchTracking();
                }
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [isOpen, order]);

    if (!isOpen) return null;

    // Calculate map center
    const getMapCenter = () => {
        if (trackingData?.agentLocation) {
            return [trackingData.agentLocation.latitude, trackingData.agentLocation.longitude];
        }
        if (trackingData?.storeLocation) {
            return [trackingData.storeLocation.latitude, trackingData.storeLocation.longitude];
        }
        return [9.1700, 77.8700];
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
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4 flex justify-between items-center">
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
                            <FiRefreshCw className="animate-spin text-4xl text-emerald-600" />
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-96 text-red-600">
                            <FiAlertCircle className="text-6xl mb-4" />
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
                            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            Order Status: <span className="text-emerald-600">{trackingData.status}</span>
                                        </h3>
                                        {trackingData.assignedAgent && (
                                            <div className="mt-2 space-y-1">
                                                <p className="text-sm text-gray-700">
                                                    <strong>Delivery Agent:</strong> {trackingData.assignedAgent.name}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <strong>Phone:</strong> {trackingData.assignedAgent.phone}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <strong>Email:</strong> {trackingData.assignedAgent.email}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {trackingData.trackingEnabled && (
                                        <div className="flex items-center text-emerald-600">
                                            <div className="w-3 h-3 bg-emerald-600 rounded-full animate-pulse mr-2"></div>
                                            <span className="text-sm font-medium">Live Tracking Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Map */}
                            {trackingData.trackingEnabled ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-lg">
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
                                                    <div className="text-center p-2">
                                                        <FiPackage className="mx-auto text-green-600 text-2xl mb-2" />
                                                        <strong className="block mb-1">Store Location</strong>
                                                        <p className="text-sm text-gray-600">
                                                            {trackingData.storeLocation.address}
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
                                <div className="border border-gray-200 rounded-lg p-12 text-center bg-gray-50">
                                    <FiMapPin className="mx-auto text-gray-400 text-6xl mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Tracking Not Available
                                    </h3>
                                    <p className="text-gray-600">
                                        {trackingData.assignedAgent 
                                            ? 'Waiting for the delivery agent to start location sharing.'
                                            : 'This order has not been assigned to a delivery agent yet.'
                                        }
                                    </p>
                                </div>
                            )}

                            {/* Customer Details */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold text-lg mb-3 flex items-center">
                                    <FiMapPin className="mr-2 text-emerald-600" />
                                    Customer Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium text-gray-900">{trackingData.customer.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-medium text-gray-900">{trackingData.customer.phone}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-gray-600">Address</p>
                                        <p className="font-medium text-gray-900">{trackingData.customer.address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex items-center space-x-2 bg-green-50 p-3 rounded-lg border border-green-200">
                                    <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Store</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Delivery Agent</span>
                                </div>
                                <div className="flex items-center space-x-2 bg-red-50 p-3 rounded-lg border border-red-200">
                                    <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                                    <span className="text-sm font-medium text-gray-700">Customer</span>
                                </div>
                            </div>

                            {/* Location Details */}
                            {trackingData.agentLocation && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Agent Location Details
                                    </h3>
                                    <p className="text-sm text-gray-700">
                                        <strong>Coordinates:</strong> {trackingData.agentLocation.latitude.toFixed(6)}, {trackingData.agentLocation.longitude.toFixed(6)}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        <strong>Last Update:</strong> {new Date(trackingData.agentLocation.updatedAt).toLocaleString()}
                                    </p>
                                </div>
                            )}
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

export default OrderTrackingMap;