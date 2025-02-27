import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  PencilIcon, 
  TrashIcon, 
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function MyRides() {
  const [myRides, setMyRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch user's rides
  useEffect(() => {
    fetchMyRides();
  }, [user]);

  const fetchMyRides = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching user rides...');
      const response = await ridesApi.getUserRides();
      console.log('User rides response:', response);
      
      // Handle different response formats
      let rides = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        rides = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        rides = response.data;
      } else if (response.data && typeof response.data === 'object') {
        rides = [response.data];
      }
      
      setMyRides(rides);
      
      // If we have rides, select the first one by default
      if (rides.length > 0) {
        setSelectedRide(rides[0]);
        setSelectedRideId(rides[0].id || rides[0]._id);
        fetchRideDetails(rides[0].id || rides[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch user rides:', error);
      let errorMessage = 'Failed to load your rides.';
      
      if (error.response) {
        console.error('Error response:', error.response.data);
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

  // Fetch ride details and passengers
  const fetchRideDetails = async (rideId) => {
    if (!rideId) return;
    
    try {
      setRequestsLoading(true);
      
      const response = await ridesApi.getRideById(rideId);
      console.log('Ride details response:', response);
      
      // Get ride details and update the selected ride
      const rideDetails = response.data.data || response.data;
      setSelectedRide(rideDetails);
      
      // Extract passengers
      const passengers = rideDetails.passengers || [];
      setPendingRequests(passengers);
      
    } catch (error) {
      console.error('Failed to fetch ride details:', error);
      let errorMessage = 'Failed to load ride details.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Handle ride selection
  const handleRideSelect = (ride) => {
    const rideId = ride.id || ride._id;
    
    // Check if this ride is already selected
    if (rideId === selectedRideId) {
      return; // Don't need to update state if the same ride is clicked
    }
    
    // Update both the selected ride object and its ID
    setSelectedRide(ride);
    setSelectedRideId(rideId);
    fetchRideDetails(rideId);
  };

  // Handle request approval/rejection
  const handleRequestAction = async (requestId, status) => {
    if (!selectedRide) return;
    
    try {
      setActionLoading(true);
      const rideId = selectedRide.id || selectedRide._id;
      
      await ridesApi.approveRequest(rideId, requestId, status);
      
      toast.success(`Request ${status === 'confirmed' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh the ride details to update passengers list
      fetchRideDetails(rideId);
      // Also refresh the rides list
      fetchMyRides();
    } catch (error) {
      console.error(`Failed to ${status} request:`, error);
      let errorMessage = `Failed to ${status === 'confirmed' ? 'approve' : 'reject'} request.`;
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle updating a ride
  const handleEditRide = (rideId) => {
    // Navigate to edit ride page 
    navigate(`/rides/edit/${rideId}`);
  };

  // Handle canceling a ride
  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride? All passengers will be notified.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.cancelRide(rideId);
      toast.success('Ride cancelled successfully');
      fetchMyRides();
    } catch (error) {
      console.error('Failed to cancel ride:', error);
      toast.error(error.response?.data?.message || 'Failed to cancel ride');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle completing a ride
  const handleCompleteRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to mark this ride as completed?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await ridesApi.completeRide(rideId);
      toast.success('Ride marked as completed');
      fetchMyRides();
    } catch (error) {
      console.error('Failed to complete ride:', error);
      toast.error(error.response?.data?.message || 'Failed to complete ride');
    } finally {
      setActionLoading(false);
    }
  };

  // Utility functions to handle different data formats

  // Get user ID from request object
  const getUserId = (request) => {
    if (typeof request.user === 'string') {
      return request.user;
    } else if (request.user && (request.user.id || request.user._id)) {
      return request.user.id || request.user._id;
    } else if (request.userId) {
      return request.userId;
    } else if (request.id || request._id) {
      return request.id || request._id;
    }
    return null;
  };

  // Get user name from request object
  const getUserName = (request) => {
    if (request.user && typeof request.user !== 'string') {
      if (request.user.firstName && request.user.lastName) {
        return `${request.user.firstName} ${request.user.lastName}`;
      } else if (request.user.name) {
        return request.user.name;
      } else if (request.user.username) {
        return request.user.username;
      }
    } else if (request.name) {
      return request.name;
    } else if (request.userName) {
      return request.userName;
    }
    return 'Unknown User';
  };

  // Get user initial for avatar
  const getUserInitial = (request) => {
    const name = getUserName(request);
    return name.charAt(0).toUpperCase();
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

  // Get pending requests count for a ride
  const getPendingRequestsCount = (ride) => {
    if (!ride || !ride.passengers) return 0;
    
    return ride.passengers.filter(p => p.status === 'pending').length;
  };

  // Get status color based on ride status
  const getStatusColor = (status) => {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Function to get a formatted location string
  const getLocationString = (location) => {
    if (!location) return 'N/A';
    
    // First priority: Check if there's an address
    if (location.address) {
      return location.address;
    }
    
    // Second priority: Check if there's a name
    if (location.name) {
      return location.name;
    }
    
    // Third priority: Check for coordinates
    if (location.coordinates && Array.isArray(location.coordinates)) {
      // Don't display raw coordinates to the user, show a more friendly message
      return 'Location coordinates available';
    }
    
    // Fourth priority: If location is just a string
    if (typeof location === 'string') {
      return location;
    }
    
    return 'N/A';
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - List of rides */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-lg shadow p-6 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">My Offered Rides</h2>
              <button
                onClick={() => navigate('/rides/create')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary whitespace-nowrap"
              >
                + New Ride
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading your rides...</p>
              </div>
            ) : error ? (
              <div className="text-center py-4">
                <p className="text-red-500">{error}</p>
              </div>
            ) : myRides.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">You haven't offered any rides yet.</p>
                <button
                  onClick={() => navigate('/rides/create')}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Offer a New Ride
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {myRides.map((ride) => {
                  const rideId = ride.id || ride._id;
                  const isSelected = rideId === selectedRideId;
                  const pendingCount = getPendingRequestsCount(ride);
                  
                  // Extract pickup/dropoff locations
                  const pickup = ride.pickupLocation?.coordinates || ['Unknown', 'Unknown'];
                  const dropoff = ride.dropoffLocation?.coordinates || ['Unknown', 'Unknown'];
                  
                  // Format for display (simplified for now)
                  const pickupDisplay = getLocationString(ride.pickupLocation);
                  const dropoffDisplay = getLocationString(ride.dropoffLocation);
                  
                  return (
                    <div
                      key={rideId}
                      onClick={() => handleRideSelect(ride)}
                      className={`p-4 rounded-lg border cursor-pointer transition ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {formatDate(ride.departureTime || ride.time)}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ride.status)}`}>
                              {ride.status || 'active'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {ride.availableSeats || ride.seatsAvailable} seats available
                          </p>
                          <div className="mt-2 flex items-center text-sm text-gray-500">
                            <span className="truncate max-w-full">{pickupDisplay} → {dropoffDisplay}</span>
                          </div>
                        </div>
                        
                        {pendingCount > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2 shrink-0">
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Ride details and passenger requests */}
        <div className="lg:col-span-8">
          {selectedRide ? (
            <div className="bg-white rounded-lg shadow divide-y divide-gray-200 h-full">
              {/* Ride details section */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <h2 className="text-xl font-semibold">Ride Details</h2>
                  {selectedRide.status === 'active' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Edit Ride"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleCancelRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Cancel Ride"
                      >
                        <TrashIcon className="h-5 w-5 text-red-500" />
                      </button>
                      <button
                        onClick={() => handleCompleteRide(selectedRide.id || selectedRide._id)}
                        disabled={actionLoading}
                        className="inline-flex items-center p-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        title="Mark as Completed"
                      >
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Departure</h3>
                    <p className="mt-1 text-lg font-medium">
                      {formatDate(selectedRide.departureTime || selectedRide.time)}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Price</h3>
                    <p className="mt-1 text-lg font-medium">
                      ${selectedRide.price?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Available Seats</h3>
                    <p className="mt-1 text-lg font-medium">
                      {selectedRide.availableSeats || selectedRide.seatsAvailable || 0}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className={`mt-1 inline-block px-2 py-0.5 rounded-md text-sm font-medium ${getStatusColor(selectedRide.status)}`}>
                      {selectedRide.status || 'active'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Car Details</h3>
                    <p className="mt-1 text-md">
                      {selectedRide.carModel || 'Not specified'} - {selectedRide.carNumber || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Preferences</h3>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedRide.preferences?.smoking !== undefined && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedRide.preferences.smoking 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRide.preferences.smoking ? 'Smoking allowed' : 'No smoking'}
                        </span>
                      )}
                      {selectedRide.preferences?.pets !== undefined && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedRide.preferences.pets 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRide.preferences.pets ? 'Pets allowed' : 'No pets'}
                        </span>
                      )}
                      {selectedRide.preferences?.alcohol !== undefined && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedRide.preferences.alcohol 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedRide.preferences.alcohol ? 'Alcohol allowed' : 'No alcohol'}
                        </span>
                      )}
                      {selectedRide.preferences?.gender && selectedRide.preferences.gender !== 'any' && (
                        <span className="px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                          {selectedRide.preferences.gender === 'male' ? 'Male passengers only' : 'Female passengers only'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-500">Pickup Location</h3>
                  <p className="mt-1 text-md break-words">
                    {getLocationString(selectedRide.pickupLocation)}
                    {selectedRide.pickupLocation?.coordinates && (
                      <span className="block text-xs text-gray-500 mt-1 break-all">
                        Coordinates: [{selectedRide.pickupLocation.coordinates.join(', ')}]
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="mt-3">
                  <h3 className="text-sm font-medium text-gray-500">Dropoff Location</h3>
                  <p className="mt-1 text-md break-words">
                    {getLocationString(selectedRide.dropoffLocation)}
                    {selectedRide.dropoffLocation?.coordinates && (
                      <span className="block text-xs text-gray-500 mt-1 break-all">
                        Coordinates: [{selectedRide.dropoffLocation.coordinates.join(', ')}]
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              {/* Passenger requests section */}
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Passenger Requests</h2>
                
                {requestsLoading ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading requests...</p>
                  </div>
                ) : pendingRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No passenger requests yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => {
                      const userId = getUserId(request);
                      const name = getUserName(request);
                      const status = request.status || 'pending';
                      const initial = getUserInitial(request);
                      
                      return (
                        <div 
                          key={userId}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg flex-wrap gap-3"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">
                              {initial}
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <div className="mt-1">
                                {status === 'confirmed' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    <CheckCircleIcon className="mr-1 h-3 w-3 text-green-600" />
                                    Confirmed
                                  </span>
                                )}
                                {status === 'rejected' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                                    <XCircleIcon className="mr-1 h-3 w-3 text-red-600" />
                                    Rejected
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                                    <ClockIcon className="mr-1 h-3 w-3 text-yellow-600" />
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {status === 'pending' && selectedRide.status === 'active' && (
                            <div className="flex space-x-2 flex-shrink-0">
                              <button
                                onClick={() => handleRequestAction(userId, 'confirmed')}
                                disabled={actionLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRequestAction(userId, 'rejected')}
                                disabled={actionLoading}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 md:p-16 text-center">
              <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No ride selected</h3>
              <p className="mt-1 text-gray-500">
                {myRides.length > 0 
                  ? 'Select a ride from the list to see details and passenger requests'
                  : 'Offer a ride to get started!'}
              </p>
              
              {myRides.length === 0 && (
                <button
                  onClick={() => navigate('/rides/create')}
                  className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Offer a New Ride
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 