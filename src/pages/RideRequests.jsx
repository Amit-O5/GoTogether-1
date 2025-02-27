import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ExclamationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function RideRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's ride requests
  useEffect(() => {
    fetchRideRequests();
  }, [user]);

  const fetchRideRequests = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get all rides the user has requested to join
      const response = await ridesApi.getUserRequests();
      console.log('User ride requests:', response);
      
      let userRequests = [];
      if (response.data && response.data.data) {
        userRequests = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        userRequests = response.data;
      } else if (response.data) {
        userRequests = [response.data];
      }
      
      // Sort by most recent first
      userRequests.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.departureTime || a.time || 0);
        const dateB = new Date(b.createdAt || b.departureTime || b.time || 0);
        return dateB - dateA;
      });
      
      setRequests(userRequests);
      
    } catch (error) {
      console.error('Failed to fetch ride requests:', error);
      let errorMessage = 'Failed to load your ride requests.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || 'Server error. Please try again.';
        
        if (error.response.status === 401) {
          navigate('/login');
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle canceling a ride request
  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this ride request?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.cancelRequest(requestId);
      
      toast.success('Ride request cancelled successfully');
      
      // Update local state to remove the cancelled request
      setRequests(prevRequests => 
        prevRequests.filter(req => (req.id || req._id) !== requestId)
      );
    } catch (error) {
      console.error('Failed to cancel ride request:', error);
      
      let errorMessage = 'Failed to cancel ride request.';
      if (error.response && error.response.data) {
        errorMessage = error.response.data.message || errorMessage;
      }
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      // Format: "Mar 30, 2024 at 10:00 AM"
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString || 'No date';
    }
  };

  // Get status badge class based on status
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Get driver name from ride
  const getDriverName = (ride) => {
    if (!ride) return 'Unknown Driver';
    
    if (ride.creator) {
      if (typeof ride.creator === 'string') {
        return 'Driver';
      } else if (ride.creator.firstName && ride.creator.lastName) {
        return `${ride.creator.firstName} ${ride.creator.lastName}`;
      } else if (ride.creator.name) {
        return ride.creator.name;
      } else if (ride.creator.username) {
        return ride.creator.username;
      }
    } else if (ride.driver) {
      if (typeof ride.driver === 'string') {
        return 'Driver';
      } else if (ride.driver.firstName && ride.driver.lastName) {
        return `${ride.driver.firstName} ${ride.driver.lastName}`;
      } else if (ride.driver.name) {
        return ride.driver.name;
      } else if (ride.driver.username) {
        return ride.driver.username;
      }
    }
    
    return 'Driver';
  };

  // Get location string
  const getLocationString = (location) => {
    if (!location) return 'N/A';
    
    if (typeof location === 'string') {
      return location;
    } else if (location.coordinates && Array.isArray(location.coordinates)) {
      return `[${location.coordinates.join(', ')}]`;
    } else if (location.address) {
      return location.address;
    } else if (location.name) {
      return location.name;
    }
    
    return 'Location';
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">My Ride Requests</h2>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your ride requests
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">Loading your ride requests...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-2 text-red-500">{error}</p>
          <button 
            onClick={fetchRideRequests}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-8 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">You haven't made any ride requests yet.</p>
          <button 
            onClick={() => navigate('/rides')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Find Rides
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ride Details
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seats
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((request) => {
                const requestId = request.id || request._id;
                const ride = request.ride || request;
                const rideId = ride.id || ride._id;
                const status = request.status || 'pending';
                
                // Get ride details
                const departureTime = formatDate(ride.departureTime || ride.time);
                const driverName = getDriverName(ride);
                const seats = ride.availableSeats || ride.seatsAvailable || 0;
                const price = ride.price?.toFixed(2) || '0.00';
                
                // Get location details
                const pickup = getLocationString(ride.pickupLocation);
                const dropoff = getLocationString(ride.dropoffLocation);
                
                return (
                  <tr key={requestId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{departureTime}</div>
                      <div className="text-sm text-gray-500">{pickup} → {dropoff}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{driverName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {seats}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => navigate(`/rides/${rideId}`)}
                          className="text-primary hover:text-primary/80"
                        >
                          View
                        </button>
                        
                        {status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(request.id || request._id)}
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-800 flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-1" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 