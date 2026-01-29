// backend/utils/geocoding.js - NEW UTILITY
import axios from 'axios';

/**
 * Geocode an address to latitude/longitude using Nominatim API
 * @param {string} address - Full address to geocode
 * @returns {Promise<{latitude: number, longitude: number, address: string}>}
 */
export const geocodeAddress = async (address) => {
    try {
        console.log('🗺️ Geocoding address:', address);
        
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: address,
                format: 'json',
                limit: 1
            },
            headers: {
                'User-Agent': 'RushBasket-Delivery-App'
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            
            const location = {
                latitude: parseFloat(result.lat),
                longitude: parseFloat(result.lon),
                address: result.display_name
            };
            
            console.log('✅ Geocoding successful:', location);
            return location;
        } else {
            console.warn('⚠️ No geocoding results found for:', address);
            // Return default Kovilpatti location
            return {
                latitude: 9.1700,
                longitude: 77.8700,
                address: 'Kovilpatti, Tamil Nadu, India'
            };
        }
    } catch (error) {
        console.error('❌ Geocoding error:', error.message);
        // Return default location on error
        return {
            latitude: 9.1700,
            longitude: 77.8700,
            address: 'Kovilpatti, Tamil Nadu, India'
        };
    }
};

/**
 * Reverse geocode coordinates to address
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<string>}
 */
export const reverseGeocode = async (latitude, longitude) => {
    try {
        console.log(`🗺️ Reverse geocoding: ${latitude}, ${longitude}`);
        
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                lat: latitude,
                lon: longitude,
                format: 'json'
            },
            headers: {
                'User-Agent': 'RushBasket-Delivery-App'
            }
        });

        if (response.data && response.data.display_name) {
            console.log('✅ Reverse geocoding successful');
            return response.data.display_name;
        } else {
            return `${latitude}, ${longitude}`;
        }
    } catch (error) {
        console.error('❌ Reverse geocoding error:', error.message);
        return `${latitude}, ${longitude}`;
    }
};