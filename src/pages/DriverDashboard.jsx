import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

export default function DriverDashboard() {
  const [driverRides, setDriverRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedRideId, setSelectedRideId] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch driver's rides
  useEffect(() => {
    const fetchDriverRides = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching driver rides...');
        // Use the dedicated getDriverRides method instead of getAll
        const response = await ridesApi.getDriverRides();
        console.log('Driver rides response:', response);
        
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
        
        // Filter rides to ensure only those created by the current driver are shown
        // This is a safeguard in case the backend doesn't filter properly
        if (user && user.id) {
          rides = rides.filter(ride => {
            // Account for different formats the driver might be stored in
            const driverId = typeof ride.driver === 'string' 
              ? ride.driver 
              : ride.driver?.id || ride.driver?._id;
            
            console.log(`Comparing ride driver ${driverId} with current user ${user.id}`);
            return driverId === user.id;
          });
          console.log('Rides after filtering by current driver:', rides);
        }
        
        setDriverRides(rides);
        
        // If we have rides, select the first one by default
        if (rides.length > 0) {
          setSelectedRide(rides[0]);
          setSelectedRideId(rides[0].id || rides[0]._id);
          fetchPendingRequests(rides[0].id || rides[0]._id);
        }
      } catch (error) {
        console.error('Failed to fetch driver rides:', error);
        let errorMessage = 'Failed to load your rides.';
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          
          if (error.response.status === 404) {
            errorMessage = 'The driver rides endpoint was not found. The API might not support this feature yet.';
          } else if (error.response.status === 401) {
            errorMessage = 'You are not authorized to view these rides. Please log in again.';
            // Redirect to login
            navigate('/login');
          } else if (error.response.data && error.response.data.message) {
            errorMessage = `Server error: ${error.response.data.message}`;
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('Error request:', error.request);
          errorMessage = 'No response received from the server. Please check your internet connection.';
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error message:', error.message);
          errorMessage = `Error: ${error.message}`;
        }
        
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'driver') {
      fetchDriverRides();
    } else {
      navigate('/profile');
      toast.error('Only drivers can access this page');
    }
  }, [user, navigate]);

  // Fetch pending requests for a selected ride
  const fetchPendingRequests = async (rideId) => {
    if (!rideId) return;
    
    try {
      setRequestsLoading(true);
      console.log(`Fetching requests for ride ${rideId}...`);
      
      // Get the ride details which should include the passengers array
      const response = await ridesApi.getRideById(rideId);
      console.log('Ride details response:', response);
      
      // Handle different response formats
      let requests = [];
      if (response.data && response.data.data && response.data.data.passengers) {
        requests = response.data.data.passengers;
        console.log('Found passengers in response.data.data.passengers');
      } else if (response.data && response.data.passengers) {
        requests = response.data.passengers;
        console.log('Found passengers in response.data.passengers');
      } else if (response.data && Array.isArray(response.data)) {
        requests = response.data;
        console.log('Found requests in response.data array');
      } else {
        console.log('No passengers found in response:', response.data);
      }
      
      console.log('Processed requests:', requests);
      setPendingRequests(requests);
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      let errorMessage = 'Failed to load ride requests.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      }
      
      toast.error(errorMessage);
      setPendingRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Handle ride selection
  const handleRideSelect = (ride) => {
    const rideId = ride.id || ride._id;
    console.log("Selecting ride with ID:", rideId);
    
    // Check if this ride is already selected
    if (rideId === selectedRideId) {
      console.log("This ride is already selected");
      return; // Don't need to update state if the same ride is clicked
    }
    
    // Update both the selected ride object and its ID
    setSelectedRide({...ride});
    setSelectedRideId(rideId);
    fetchPendingRequests(rideId);
  };

  // Handle request approval/rejection
  const handleRequestAction = async (requestId, status) => {
    if (!selectedRide) return;
    
    try {
      const rideId = selectedRide.id || selectedRide._id;
      console.log(`Approving/rejecting request: rideId=${rideId}, passengerId=${requestId}, status=${status}`);
      
      const response = await ridesApi.approveRequest(rideId, requestId, status);
      console.log('Approval response:', response);
      
      // Update the UI
      setPendingRequests(prevRequests => 
        prevRequests.map(req => {
          const reqId = getUserId(req);
          return reqId === requestId ? { ...req, status } : req;
        })
      );
      
      toast.success(`Request ${status === 'confirmed' ? 'approved' : 'rejected'} successfully`);
      
      // Refresh the requests list
      fetchPendingRequests(rideId);
      
      // Also refresh the rides list to update available seats
      try {
        // Use getDriverRides here as well for consistency
        const ridesResponse = await ridesApi.getDriverRides();
        if (ridesResponse.data) {
          let rides = [];
          if (ridesResponse.data.data && Array.isArray(ridesResponse.data.data)) {
            rides = ridesResponse.data.data;
          } else if (Array.isArray(ridesResponse.data)) {
            rides = ridesResponse.data;
          } else if (typeof ridesResponse.data === 'object') {
            rides = [ridesResponse.data];
          }
          
          // Filter rides to ensure only those created by the current driver are shown
          if (user && user.id) {
            rides = rides.filter(ride => {
              const driverId = typeof ride.driver === 'string' 
                ? ride.driver 
                : ride.driver?.id || ride.driver?._id;
              
              return driverId === user.id;
            });
          }
          
          setDriverRides(rides);
          
          // Update the selected ride
          const updatedSelectedRide = rides.find(r => {
            const rId = r.id || r._id;
            return rId === selectedRideId;
          });
          
          if (updatedSelectedRide) {
            setSelectedRide(updatedSelectedRide);
            // Make sure selectedRideId stays in sync
            setSelectedRideId(updatedSelectedRide.id || updatedSelectedRide._id);
          }
        }
      } catch (refreshError) {
        console.error('Failed to refresh rides list:', refreshError);
        // Continue without refreshing the list
      }
    } catch (error) {
      console.error(`Failed to ${status} request:`, error);
      let errorMessage = `Failed to ${status === 'confirmed' ? 'approve' : 'reject'} request.`;
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = `Error: ${error.response.data.message}`;
      }
      
      toast.error(errorMessage);
    }
  };

  // Get user ID from a request object
  const getUserId = (request) => {
    // Handle different formats of request objects
    if (typeof request.user === 'string') {
      return request.user; // If user is just the ID string
    } else if (request.user && request.user._id) {
      return request.user._id; // If user is an object with _id
    } else if (request.user && request.user.id) {
      return request.user.id; // If user is an object with id
    } else if (request._id) {
      return request._id; // If the request itself has _id
    } else if (request.id) {
      return request.id; // If the request itself has id
    }
    return null; // Fallback
  };

  // Get user name from a request object
  const getUserName = (request) => {
    // Try to get first name
    const firstName = 
      request.userDetails?.firstName || 
      (request.user && typeof request.user === 'object' ? request.user.firstName : null) || 
      'Unknown';
    
    // Try to get last name
    const lastName = 
      request.userDetails?.lastName || 
      (request.user && typeof request.user === 'object' ? request.user.lastName : null) || 
      'User';
    
    return `${firstName} ${lastName}`;
  };

  // Get user initial from a request object
  const getUserInitial = (request) => {
    const firstName = 
      request.userDetails?.firstName || 
      (request.user && typeof request.user === 'object' ? request.user.firstName : null);
    
    return firstName ? firstName[0] : 'U';
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

  // Get pending requests count for a ride
  const getPendingRequestsCount = (ride) => {
    if (!ride.passengers || !Array.isArray(ride.passengers)) return 0;
    return ride.passengers.filter(p => p.status === 'pending').length;
  };

  useEffect(() => {
    // Log when selectedRide changes
    if (selectedRide) {
      console.log('Selected ride changed:', selectedRide.id || selectedRide._id);
    }
  }, [selectedRide]);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Driver Dashboard</h1>
        
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
                onClick={() => navigate('/rides/create')}
                className="btn btn-primary"
              >
                Create a New Ride
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Rides List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Your Rides</h2>
                  <p className="mt-1 text-sm text-gray-500">Select a ride to manage requests</p>
                </div>
                
                <div className="divide-y divide-gray-200">
                  {driverRides.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-gray-500">No rides found</p>
                      <button 
                        onClick={() => navigate('/rides/create')}
                        className="mt-4 btn btn-primary"
                      >
                        Create a Ride
                      </button>
                    </div>
                  ) : (
                    driverRides.map((ride) => {
                      // Get unique IDs for comparison
                      const rideId = ride.id || ride._id;
                      const isSelected = rideId === selectedRideId;
                      
                      return (
                        <div 
                          key={rideId} 
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-gray-50 border-l-4 border-primary' : ''
                          }`}
                          onClick={() => handleRideSelect(ride)}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {formatDate(ride.departureTime || ride.time)}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {ride.availableSeats || ride.seatsAvailable || 0} seats available
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ${parseFloat(ride.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                              Pickup: {ride.pickupLocation?.coordinates ? 
                                `[${ride.pickupLocation.coordinates.join(', ')}]` : 
                                'Not specified'}
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                              Dropoff: {ride.dropoffLocation?.coordinates ? 
                                `[${ride.dropoffLocation.coordinates.join(', ')}]` : 
                                'Not specified'}
                            </div>
                          </div>
                          {ride.passengers && ride.passengers.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-primary">
                                {getPendingRequestsCount(ride)} pending requests
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Requests Panel */}
            <div className="lg:col-span-2">
              {selectedRide ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Ride Requests
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Manage passenger requests for your ride on {formatDate(selectedRide.departureTime || selectedRide.time)}
                    </p>
                  </div>
                  
                  {requestsLoading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading requests...</p>
                    </div>
                  ) : (
                    <div className="p-6">
                      {pendingRequests.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No pending requests for this ride</p>
                          <p className="mt-2 text-sm text-gray-400">
                            Share your ride details with others to get requests
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {pendingRequests.map((request) => (
                            <div 
                              key={getUserId(request) || Math.random().toString()} 
                              className="border border-gray-200 rounded-lg p-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
                                    {getUserInitial(request)}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-gray-900">
                                      {getUserName(request)}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                      Requested {request.requestedAt ? formatDate(request.requestedAt) : 'recently'}
                                    </p>
                                  </div>
                                </div>
                                <div>
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    request.status === 'pending' 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : request.status === 'confirmed' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                  }`}>
                                    {request.status || 'pending'}
                                  </span>
                                </div>
                              </div>
                              
                              {request.status === 'pending' && (
                                <div className="mt-4 flex space-x-3">
                                  <button
                                    onClick={() => handleRequestAction(
                                      getUserId(request), 
                                      'confirmed'
                                    )}
                                    className="btn btn-primary py-2 px-4"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleRequestAction(
                                      getUserId(request), 
                                      'rejected'
                                    )}
                                    className="btn btn-secondary py-2 px-4"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Select a Ride</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                    Choose a ride from the list to view and manage passenger requests.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 