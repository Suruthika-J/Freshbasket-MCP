// backend/utils/locationUtils.js - COMPLETE GEOCODING UTILITIES
import axios from 'axios';

/**
 * Convert address to coordinates using OpenStreetMap Nominatim API
 * @param {string} address - Full address to geocode
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
export const geocodeAddress = async (address) => {
    try {
        // Nominatim API endpoint
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1,
                countrycodes: 'in', // Restrict to India
                addressdetails: 1
            },
            headers: {
                'User-Agent': 'RushBasket-Delivery-App/1.0'
            },
            timeout: 10000 // 10 second timeout
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            console.log('✅ Geocoding successful:', {
                input: address,
                output: result.display_name,
                coords: [result.lat, result.lon]
            });
            
            return {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                address: result.display_name
            };
        } else {
            // Fallback to approximate coordinates if no result
            console.warn('⚠️ Geocoding failed, using default coordinates for:', address);
            return {
                latitude: 9.1700,
                longitude: 77.8700,
                address: address
            };
        }
    } catch (error) {
        console.error('❌ Geocoding error:', error.message);
        // Return default coordinates on error
        return {
            latitude: 9.1700,
            longitude: 77.8700,
            address: address
        };
    }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimals
};

/**
 * Convert degrees to radians
 */
const toRad = (value) => {
    return (value * Math.PI) / 180;
};

/**
 * Validate coordinates
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {boolean}
 */
export const isValidCoordinates = (latitude, longitude) => {
    return (
        typeof latitude === 'number' &&
        typeof longitude === 'number' &&
        latitude >= -90 && latitude <= 90 &&
        longitude >= -180 && longitude <= 180
    );
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (latitude, longitude) => {
    const latDir = latitude >= 0 ? 'N' : 'S';
    const lonDir = longitude >= 0 ? 'E' : 'W';
    
    return `${Math.abs(latitude).toFixed(4)}°${latDir}, ${Math.abs(longitude).toFixed(4)}°${lonDir}`;
};