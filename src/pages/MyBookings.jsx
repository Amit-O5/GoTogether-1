import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { rides as ridesApi } from '../services/api';
import { 
  MapPinIcon, 
  ClockIcon, 
  UserIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  XCircleIcon 
} from '@heroicons/react/24/outline';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching bookings...');
        
        let response;
        
        // Using the myRequests endpoint for riders
        if (user.role === 'rider') {
          response = await ridesApi.getMyRequests();
          console.log('Rider bookings response:', response);
        } else if (user.role === 'driver') {
          // For drivers, still use the driver rides endpoint
          response = await ridesApi.getDriverRides();
          console.log('Driver bookings response:', response);
        }
        
        // Handle different response formats
        let rides = [];
        if (response?.data?.data && Array.isArray(response.data.data)) {
          rides = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          rides = response.data;
        } else if (response?.data && typeof response.data === 'object') {
          rides = [response.data];
        }
        
        console.log('Processed rides:', rides);
        setBookings(rides);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
        let errorMessage = 'Failed to load your bookings.';
        
        if (error.response) {
          if (error.response.status === 401) {
            errorMessage = 'You are not authorized. Please log in again.';
            navigate('/login');
          } else if (error.response.status === 404) {
            // No bookings found - this is not an error
            setBookings([]);
            setLoading(false);
            return;
          } else if (error.response.data && error.response.data.message) {
            errorMessage = `Server error: ${error.response.data.message}`;
          }
        } else if (error.request) {
          errorMessage = 'No response received from the server. Please check your internet connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchBookings();
    } else {
      navigate('/login');
      toast.error('Please log in to view your bookings');
    }
  }, [user, navigate]);

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
    switch (status?.toLowerCase()) {
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

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ExclamationCircleIcon className="h-4 w-4 text-yellow-500" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Get user request status (for riders)
  const getStatusText = (ride) => {
    // For the myRequests endpoint, userRequestStatus is directly provided
    if (ride.userRequestStatus) return ride.userRequestStatus;
    
    // Fallback to the old method
    if (!ride.passengers || ride.passengers.length === 0) return 'Unknown';
    
    const passenger = ride.passengers.find(p => {
      const pId = typeof p.user === 'string' ? p.user : p.user?.id || p.user?._id;
      return pId === user.id;
    });
    
    return passenger?.status || 'Pending';
  };

  // Handle approve rider request (for drivers)
  const handleApproveRequest = async (rideId, passengerId) => {
    try {
      await ridesApi.approveRequest(rideId, passengerId, 'confirmed');
      toast.success('Request approved successfully!');
      // Refresh bookings
      const response = await ridesApi.getDriverRides();
      const rides = response?.data?.data || response?.data || [];
      setBookings(rides);
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve request');
    }
  };

  // Handle reject rider request (for drivers)
  const handleRejectRequest = async (rideId, passengerId) => {
    try {
      await ridesApi.approveRequest(rideId, passengerId, 'rejected');
      toast.success('Request rejected');
      // Refresh bookings
      const response = await ridesApi.getDriverRides();
      const rides = response?.data?.data || response?.data || [];
      setBookings(rides);
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject request');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center border-b border-gray-200 pb-5 mb-5">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900">My Bookings</h1>
            <p className="mt-2 text-sm text-gray-700">
              {user?.role === 'rider' 
                ? 'Your requested rides and their current status.' 
                : 'Your rides and passenger booking requests.'}
            </p>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-6 mt-6">
            <p className="font-medium">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg shadow-sm">
            <div className="bg-white p-6 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <MapPinIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {user?.role === 'rider' 
                ? 'You have not requested any rides yet. Browse available rides and request a seat!' 
                : 'You have not created any rides yet or have no booking requests.'}
            </p>
            {user?.role === 'rider' ? (
              <button
                onClick={() => navigate('/rides')}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors"
              >
                Find Rides
              </button>
            ) : (
              <button
                onClick={() => navigate('/rides/create')}
                className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 transition-colors"
              >
                Create a Ride
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-1 lg:grid-cols-1">
            {bookings.map((ride) => (
              <div key={ride._id || ride.id} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Ride on {formatDate(ride.departureTime)}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                      {ride.availableSeats || ride.seatsAvailable} seat(s) available
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(user?.role === 'rider' ? getStatusText(ride) : ride.status)}`}>
                    {getStatusIcon(user?.role === 'rider' ? getStatusText(ride) : ride.status)}
                    {user?.role === 'rider' ? getStatusText(ride) : (ride.status || 'Active')}
                  </span>
                </div>
                
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Locations section */}
                    <div className="sm:col-span-3">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="bg-green-100 p-1.5 rounded-full">
                              <MapPinIcon className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Pickup Location</h4>
                            <p className="mt-1 text-sm text-gray-900">{ride.pickupLocation?.address || formatCoordinates(ride.pickupLocation)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="bg-red-100 p-1.5 rounded-full">
                              <MapPinIcon className="h-5 w-5 text-red-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Dropoff Location</h4>
                            <p className="mt-1 text-sm text-gray-900">{ride.dropoffLocation?.address || formatCoordinates(ride.dropoffLocation)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="bg-blue-100 p-1.5 rounded-full">
                              <ClockIcon className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Departure Time</h4>
                            <p className="mt-1 text-sm text-gray-900">{formatDate(ride.departureTime)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Driver/Passenger details section */}
                    <div className="sm:col-span-3">
                      {user?.role === 'rider' && ride.driver && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Driver Details</h4>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
                                {ride.driver.firstName?.[0] || 'D'}
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {ride.driver.firstName} {ride.driver.lastName}
                              </p>
                              {ride.driver.rating !== undefined && (
                                <p className="text-sm text-gray-500">
                                  Rating: {ride.driver.rating.toFixed(1)} ★
                                </p>
                              )}
                            </div>
                          </div>
                          {ride.carModel && ride.carNumber && (
                            <div className="border-t border-gray-200 pt-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Car:</span> {ride.carModel}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Plate:</span> {ride.carNumber}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {user?.role === 'driver' && ride.passengers && ride.passengers.length > 0 && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 mb-3">Passenger Requests</h4>
                          <div className="space-y-4">
                            {ride.passengers.map((passenger) => {
                              const passengerId = typeof passenger.user === 'string' 
                                ? passenger.user 
                                : passenger.user?.id || passenger.user?._id;
                              
                              const passengerName = passenger.user?.firstName 
                                ? `${passenger.user.firstName} ${passenger.user.lastName || ''}`
                                : 'Anonymous User';
                                
                              return (
                                <div key={passengerId} className="flex items-start justify-between border-b border-gray-200 pb-3">
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                                      <UserIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{passengerName}</p>
                                      <span className={`inline-flex rounded-full px-2 text-xs font-medium leading-5 ${getStatusBadgeClass(passenger.status)}`}>
                                        {passenger.status || 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {passenger.status === 'pending' && (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleApproveRequest(ride._id || ride.id, passengerId)}
                                        className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 transition-colors"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => handleRejectRequest(ride._id || ride.id, passengerId)}
                                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {user?.role === 'driver' && (!ride.passengers || ride.passengers.length === 0) && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="text-center py-4">
                            <UserIcon className="h-8 w-8 text-gray-400 mx-auto" />
                            <p className="mt-2 text-sm text-gray-500">No passenger requests yet</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 