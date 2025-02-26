import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

export const rides = {
  // 2.1 Create Ride - POST /api/rides/createRide
  create: (data) => api.post('/rides/createRide', data),
  
  // 2.2 Get All Rides - GET /api/rides/getRides
  getAll: (params = {}) => api.get('/rides/getRides', { params }),
  
  // 2.3 Get Best Matching Rides - GET /api/rides/bestRides
  getBest: (params) => api.get('/rides/bestRides', { 
    params: {
      pickupLat: params.pickupLat,
      pickupLng: params.pickupLng,
      dropoffLat: params.dropoffLat,
      dropoffLng: params.dropoffLng,
      maxDistance: params.maxDistance
    } 
  }),
  
  // 2.4 Get Ride by ID - GET /api/rides/:id
  getRideById: (rideId) => api.get(`/rides/${rideId}`),
  
  // 2.4 Get User Ride Requests - GET /api/rides/myRequests
  getMyRequests: () => api.get('/rides/myRequests'),
  
  // 2.5 Request Ride - PUT /api/rides/:id/request
  request: (rideId) => api.put(`/rides/${rideId}/request`),
  
  // 2.6 Approve/Reject Ride Request - PUT /api/rides/:id/approval
  approveRequest: (rideId, passengerId, status) => 
    api.put(`/rides/${rideId}/approval`, { 
      passengerId, 
      status // "confirmed" or "rejected"
    }),
  
  // Custom methods for the driver dashboard
  // Get rides created by the current driver
  getDriverRides: async () => {
    console.log('Getting rides for current driver...');
    // We'll use the general getRides endpoint with a driver filter
    // The backend should filter based on the authenticated user's token
    try {
      // Explicitly set the 'onlyMine' parameter to true to filter by the current user's token
      const response = await api.get('/rides/getRides', { 
        params: { 
          driver: true,
          onlyMine: true
        } 
      });
      console.log('Driver rides response:', response);
      return response;
    } catch (error) {
      console.error('Failed to get driver rides:', error);
      throw error;
    }
  },
  
  // Custom method for the rider dashboard
  // Get rides requested by the current rider
  getRiderRides: async () => {
    console.log('Getting rides for current rider...');
    // We'll use the general getRides endpoint with a rider filter
    // The backend should filter based on the authenticated user's token
    try {
      const response = await api.get('/rides/getRides', { 
        params: { 
          rider: true,
          onlyMine: true
        } 
      });
      console.log('Rider rides response:', response);
      return response;
    } catch (error) {
      console.error('Failed to get rider rides:', error);
      throw error;
    }
  },
  
  // Get pending requests for a ride - uses the Get Ride by ID endpoint
  getPendingRequests: async (rideId) => {
    console.log(`Getting pending requests for ride ${rideId}...`);
    try {
      // Use the documented Get Ride by ID endpoint
      const response = await api.get(`/rides/${rideId}`);
      console.log('Ride details for pending requests:', response);
      
      // Extract and return the passengers array
      const ride = response.data.data || response.data;
      const passengers = ride.passengers || [];
      
      console.log('Extracted passengers:', passengers);
      return { data: passengers };
    } catch (error) {
      console.error(`Failed to get pending requests for ride ${rideId}:`, error);
      throw error;
    }
  }
};

export default api; 