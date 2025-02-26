import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { rides as ridesApi } from '../services/api';

export default function RiderDashboard() {
  const [riderRides, setRiderRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch rider's rides
  useEffect(() => {
    const fetchRiderRides = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching rider rides...');
        // Use the dedicated getRiderRides method instead of getAll with incorrect parameters
        const response = await ridesApi.getRiderRides();
        console.log('Rider rides response:', response);
        
        // Handle different response formats
        let rides = [];
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          rides = response.data.data;
          console.log('Found rides in response.data.data');
        } else if (response.data && Array.isArray(response.data)) {
          rides = response.data;
          console.log('Found rides in response.data array');
        } else if (response.data && typeof response.data === 'object') {
          // If data is an object but not an array, it might be a single ride
          rides = [response.data];
          console.log('Found a single ride object');
        } else {
          console.log('No rides found in response:', response.data);
        }
        
        console.log('Processed rides:', rides);
        
        // Filter rides to ensure only those requested by the current rider are shown
        if (user && user.id) {
          rides = rides.filter(ride => {
            // Check if the current user is in the passengers array
            return ride.passengers?.some(passenger => {
              const passengerId = typeof passenger.user === 'string' 
                ? passenger.user 
                : passenger.user?.id || passenger.user?._id;
              
              return passengerId === user.id;
            });
          });
          console.log('Rides after filtering by current rider:', rides);
        }
        
        setRiderRides(rides);
      } catch (error) {
        console.error('Failed to fetch rider rides:', error);
        let errorMessage = 'Failed to load your rides.';
        
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          
          if (error.response.status === 404) {
            errorMessage = 'The rider rides endpoint was not found. The API might not support this feature yet.';
          } else if (error.response.status === 401) {
            errorMessage = 'You are not authorized to view these rides. Please log in again.';
            // Redirect to login
            navigate('/login');
          } else if (error.response.data && error.response.data.message) {
            errorMessage = `Server error: ${error.response.data.message}`;
          }
        } else if (error.request) {
          console.error('Error request:', error.request);
          errorMessage = 'No response received from the server. Please check your internet connection.';
        } else {
          console.error('Error message:', error.message);
          errorMessage = `Error: ${error.message}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'rider') {
      fetchRiderRides();
    } else {
      navigate('/profile');
      toast.error('Only riders can access this page');
    }
  }, [user, navigate]);

  // View ride details
  const viewRideDetails = async (rideId) => {
    try {
      const response = await ridesApi.getRideById(rideId);
      console.log('Ride details:', response.data);
      
      // You could navigate to a detailed view or show a modal
      // For now, we'll just show a toast with basic info
      const ride = response.data.data || response.data;
      toast.info(`Ride from ${formatCoordinates(ride.pickupLocation)} to ${formatCoordinates(ride.dropoffLocation)}`);
    } catch (error) {
      console.error('Failed to get ride details:', error);
      toast.error('Could not load ride details');
    }
  };

  // Format coordinates for display
  const formatCoordinates = (location) => {
    if (!location || !location.coordinates) return 'Unknown location';
    const [lng, lat] = location.coordinates;
    return `[${lat.toFixed(4)}, ${lng.toFixed(4)}]`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      });
    } catch (e) {
      return dateString;
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Group rides by status for better organization
  const groupedRides = {
    upcoming: [],
    pending: [],
    past: [],
  };

  // Sort and group rides
  riderRides.forEach(ride => {
    const userPassenger = ride.passengers?.find(p => 
      (p.user === user?.id) || 
      (typeof p.user === 'object' && p.user.id === user?.id)
    );
    
    const status = userPassenger?.status || 'unknown';
    const departureTime = new Date(ride.departureTime || ride.time);
    const isPast = departureTime < new Date();
    
    if (status === 'confirmed' && !isPast) {
      groupedRides.upcoming.push(ride);
    } else if (status === 'pending') {
      groupedRides.pending.push(ride);
    } else {
      groupedRides.past.push(ride);
    }
  });

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Rides</h1>
          <button 
            onClick={() => navigate('/')}
            className="btn btn-primary"
          >
            Find New Rides
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your rides...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-red-100">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error Loading Rides</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              {error}
            </p>
            <div className="mt-6">
              <button 
                onClick={() => navigate('/')}
                className="btn btn-primary"
              >
                Find Rides
              </button>
            </div>
          </div>
        ) : riderRides.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-blue-100">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Rides Found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
              You haven't requested any rides yet. Find available rides and request to join them.
            </p>
            <div className="mt-6">
                  <button 
                    onClick={() => navigate('/')}
                className="btn btn-primary"
                  >
                    Find a Ride
                  </button>
            </div>
                </div>
              ) : (
          <div className="space-y-8">
            {/* Upcoming confirmed rides */}
            {groupedRides.upcoming.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-green-50">
                  <h2 className="text-xl font-semibold text-gray-900">Upcoming Rides</h2>
                  <p className="mt-1 text-sm text-gray-500">Your confirmed upcoming rides</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {groupedRides.upcoming.map(ride => {
                    const userPassenger = ride.passengers?.find(p => 
                      (p.user === user.id) || 
                      (typeof p.user === 'object' && p.user.id === user.id)
                    );
                    
                    return (
                      <div key={ride.id || ride._id} className="p-6 hover:bg-gray-50">
                        <div className="md:flex md:justify-between md:items-start">
                          <div>
                            <div className="text-lg font-medium text-gray-900 mb-2">
                              {formatDate(ride.departureTime || ride.time)}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                              {formatCoordinates(ride.pickupLocation)}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                              {formatCoordinates(ride.dropoffLocation)}
                            </div>
                            <div className="mt-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Confirmed
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 md:text-right">
                            <div className="text-lg font-medium text-primary mb-2">
                              ${parseFloat(ride.price || 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Driver: {ride.driver && typeof ride.driver === 'object' 
                                ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() || 'Unknown'
                                : 'Unknown'}
                            </div>
                            <button
                              onClick={() => viewRideDetails(ride.id || ride._id)}
                              className="mt-3 btn btn-secondary btn-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Pending ride requests */}
            {groupedRides.pending.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-yellow-50">
                  <h2 className="text-xl font-semibold text-gray-900">Pending Requests</h2>
                  <p className="mt-1 text-sm text-gray-500">Rides you've requested that are awaiting approval</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {groupedRides.pending.map(ride => (
                    <div key={ride.id || ride._id} className="p-6 hover:bg-gray-50">
                      <div className="md:flex md:justify-between md:items-start">
                        <div>
                          <div className="text-lg font-medium text-gray-900 mb-2">
                            {formatDate(ride.departureTime || ride.time)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                            {formatCoordinates(ride.pickupLocation)}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                            {formatCoordinates(ride.dropoffLocation)}
                          </div>
                          <div className="mt-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Pending Approval
                            </span>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:text-right">
                          <div className="text-lg font-medium text-primary mb-2">
                            ${parseFloat(ride.price || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Driver: {ride.driver && typeof ride.driver === 'object' 
                              ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() || 'Unknown'
                              : 'Unknown'}
                          </div>
                          <button
                            onClick={() => viewRideDetails(ride.id || ride._id)}
                            className="mt-3 btn btn-secondary btn-sm"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Past rides history */}
            {groupedRides.past.length > 0 && (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900">Past Rides</h2>
                  <p className="mt-1 text-sm text-gray-500">Your ride history</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {groupedRides.past.map(ride => {
                        const userPassenger = ride.passengers?.find(p => 
                          (p.user === user.id) || 
                          (typeof p.user === 'object' && p.user.id === user.id)
                        );
                        
                        const status = userPassenger?.status || 'unknown';
                        
                        return (
                      <div key={ride.id || ride._id} className="p-6 hover:bg-gray-50">
                        <div className="md:flex md:justify-between md:items-start">
                          <div>
                            <div className="text-lg font-medium text-gray-900 mb-2">
                                {formatDate(ride.departureTime || ride.time)}
                              </div>
                            <div className="flex items-center text-sm text-gray-500 mb-1">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                  {formatCoordinates(ride.pickupLocation)}
                                </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                                  {formatCoordinates(ride.dropoffLocation)}
                                </div>
                            <div className="mt-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(status)}`}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 md:text-right">
                            <div className="text-lg font-medium text-primary mb-2">
                              ${parseFloat(ride.price || 0).toFixed(2)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Driver: {ride.driver && typeof ride.driver === 'object' 
                                ? `${ride.driver.firstName || ''} ${ride.driver.lastName || ''}`.trim() || 'Unknown'
                                : 'Unknown'}
                            </div>
                              <button
                                onClick={() => viewRideDetails(ride.id || ride._id)}
                              className="mt-3 btn btn-secondary btn-sm"
                              >
                                View Details
                              </button>
                          </div>
                        </div>
                      </div>
                        );
                      })}
                </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
} 