import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rides as ridesApi, users as usersApi, ratings as ratingsApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon, 
  MapPinIcon, 
  ClockIcon, 
  CurrencyDollarIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

export default function RideDetail() {
  const { id } = useParams();
  const [ride, setRide] = useState(null);
  const [driver, setDriver] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestLoading, setRequestLoading] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRideDetails();
  }, [id]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ride details
      const response = await ridesApi.getRideById(id);
      const rideData = response.data.data || response.data;
      setRide(rideData);
      
      // If the ride has a creator/driver, get their details
      if (rideData.creator) {
        const driverId = typeof rideData.creator === 'string' ? rideData.creator : rideData.creator.id || rideData.creator._id;
        
        try {
          const driverResponse = await usersApi.getUserById(driverId);
          const driverData = driverResponse.data.data || driverResponse.data;
          setDriver(driverData);
        } catch (driverError) {
          console.error('Failed to fetch driver details:', driverError);
          // Continue even if we can't fetch driver details
        }
      }
      
      // Check if the current user has requested this ride
      if (user) {
        // Look for the current user in the passengers array
        if (rideData.passengers && Array.isArray(rideData.passengers)) {
          const currentUserRequest = rideData.passengers.find(passenger => {
            if (typeof passenger.user === 'string') {
              return passenger.user === user.id;
            } else if (passenger.user) {
              return (passenger.user.id || passenger.user._id) === user.id;
            }
            return false;
          });
          
          if (currentUserRequest) {
            setRequestStatus(currentUserRequest.status);
          } else {
            setRequestStatus(null);
          }
        }
      }
      
    } catch (error) {
      console.error('Failed to fetch ride details:', error);
      
      let errorMessage = 'Failed to load ride details.';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Ride not found.';
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = async () => {
    if (!user) {
      toast.error('Please log in to request a ride');
      navigate('/login');
      return;
    }
    
    try {
      setRequestLoading(true);
      
      // Call the API to request the ride
      await ridesApi.requestRide(id);
      
      toast.success('Ride requested successfully!');
      setRequestStatus('pending');
      
      // Refresh ride details to update available seats
      fetchRideDetails();
    } catch (error) {
      console.error('Failed to request ride:', error);
      
      let errorMessage = 'Failed to request ride.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!user) {
      toast.error('Please log in to cancel a ride request');
      navigate('/login');
      return;
    }
    
    try {
      setRequestLoading(true);
      
      // Call the API to cancel the ride request
      await ridesApi.cancelRequest(id);
      
      toast.success('Ride request cancelled');
      setRequestStatus(null);
      
      // Refresh ride details to update available seats
      fetchRideDetails();
    } catch (error) {
      console.error('Failed to cancel ride request:', error);
      
      let errorMessage = 'Failed to cancel ride request.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSubmitRating = async () => {
    if (!user) {
      toast.error('Please log in to submit a rating');
      navigate('/login');
      return;
    }
    
    if (ratingValue === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      setIsSubmittingRating(true);
      
      // Determine if we're rating a ride or a user (driver)
      if (driver) {
        const driverId = driver.id || driver._id;
        
        await ratingsApi.rateUser({
          userId: driverId,
          rating: ratingValue,
          comment: ratingComment,
          rideId: id // Associate with this ride
        });
        
        toast.success('Rating submitted successfully!');
        setRatingValue(0);
        setRatingComment('');
      } else {
        toast.error('Cannot submit rating: driver information is missing');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      
      let errorMessage = 'Failed to submit rating.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
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

  const getDriverName = () => {
    if (!driver) return 'Driver';
    
    if (driver.firstName && driver.lastName) {
      return `${driver.firstName} ${driver.lastName}`;
    } else if (driver.name) {
      return driver.name;
    } else if (driver.username) {
      return driver.username;
    }
    
    return 'Driver';
  };

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

  // Check if the current user is the driver of this ride
  const isCurrentUserDriver = () => {
    if (!user || !ride) return false;
    
    const driverId = typeof ride.creator === 'string' 
      ? ride.creator 
      : (ride.creator?.id || ride.creator?._id);
    
    return driverId === user.id;
  };

  // Check if the ride is completed
  const isRideCompleted = () => {
    return ride && ride.status === 'completed';
  };

  // Check if the ride is cancelled
  const isRideCancelled = () => {
    return ride && ride.status === 'cancelled';
  };

  // Check if the user can request this ride
  const canRequestRide = () => {
    if (!user) return false;
    if (isCurrentUserDriver()) return false;
    if (requestStatus) return false;
    if (isRideCancelled()) return false;
    if (isRideCompleted()) return false;
    
    // Check if there are available seats
    return ride && (ride.availableSeats > 0 || ride.seatsAvailable > 0);
  };

  // Check if the user can rate this ride
  const canRateRide = () => {
    if (!user) return false;
    if (isCurrentUserDriver()) return false;
    
    // User can rate only if they were a confirmed passenger on a completed ride
    return isRideCompleted() && requestStatus === 'confirmed';
  };

  return (
    <div className="bg-white shadow rounded-lg">
      {loading ? (
        <div className="p-10 text-center">
          <p className="text-gray-500">Loading ride details...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-red-500">{error}</p>
          <button 
            onClick={() => navigate('/rides')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Rides
          </button>
        </div>
      ) : ride ? (
        <div>
          {/* Ride status banner */}
          {ride.status && ride.status !== 'active' && (
            <div className={`p-4 ${
              ride.status === 'completed' ? 'bg-green-50 text-green-800' : 
              ride.status === 'cancelled' ? 'bg-red-50 text-red-800' : 
              'bg-yellow-50 text-yellow-800'
            }`}>
              <div className="flex items-center justify-center">
                {ride.status === 'completed' ? (
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                ) : ride.status === 'cancelled' ? (
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                )}
                <p className="text-sm font-medium">
                  This ride is {ride.status}
                </p>
              </div>
            </div>
          )}
          
          {/* Ride details */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ride from {getLocationString(ride.pickupLocation)}
                </h1>
                <p className="mt-1 text-lg text-gray-600">
                  To {getLocationString(ride.dropoffLocation)}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 flex items-center">
                <div className="flex-shrink-0 mr-3">
                  {driver && driver.profileImage ? (
                    <img
                      className="h-12 w-12 rounded-full object-cover"
                      src={driver.profileImage}
                      alt={getDriverName()}
                    />
                  ) : (
                    <UserCircleIcon className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Driver</p>
                  <p className="text-lg font-medium text-gray-900">{getDriverName()}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="border-r border-gray-200 pr-4">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Departure Time</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {formatDate(ride.departureTime || ride.time)}
                </p>
              </div>
              
              <div className="border-r border-gray-200 pr-4">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Price</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  ${ride.price?.toFixed(2) || '0.00'}
                </p>
              </div>
              
              <div className="border-r border-gray-200 pr-4">
                <div className="flex items-center">
                  <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Available Seats</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {ride.availableSeats || ride.seatsAvailable || 0}
                </p>
              </div>
              
              <div>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-500">Distance</span>
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {ride.distance ? `${ride.distance} km` : 'Not specified'}
                </p>
              </div>
            </div>
            
            {/* Car details */}
            {(ride.carModel || ride.carNumber) && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900">Car Details</h2>
                <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  {ride.carModel && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Car Model</p>
                      <p className="mt-1 text-md">{ride.carModel}</p>
                    </div>
                  )}
                  
                  {ride.carNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">License Plate</p>
                      <p className="mt-1 text-md">{ride.carNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Preferences */}
            {ride.preferences && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ride.preferences.smoking !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ride.preferences.smoking 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ride.preferences.smoking ? 'Smoking allowed' : 'No smoking'}
                    </span>
                  )}
                  
                  {ride.preferences.pets !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ride.preferences.pets 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ride.preferences.pets ? 'Pets allowed' : 'No pets'}
                    </span>
                  )}
                  
                  {ride.preferences.music !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ride.preferences.music 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ride.preferences.music ? 'Music allowed' : 'No music'}
                    </span>
                  )}
                  
                  {ride.preferences.alcohol !== undefined && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      ride.preferences.alcohol 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {ride.preferences.alcohol ? 'Alcohol allowed' : 'No alcohol'}
                    </span>
                  )}
                  
                  {ride.preferences.gender && ride.preferences.gender !== 'any' && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {ride.preferences.gender === 'male' ? 'Male passengers only' : 'Female passengers only'}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Additional notes */}
            {ride.additionalNotes && (
              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-start">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Additional Notes</h2>
                    <p className="mt-2 text-gray-700">{ride.additionalNotes}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="mt-8 border-t border-gray-200 pt-6">
              {isCurrentUserDriver() ? (
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    You are the driver of this ride. Go to "My Rides" to manage it.
                  </p>
                  <button
                    onClick={() => navigate('/my-rides')}
                    className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    Manage My Rides
                  </button>
                </div>
              ) : requestStatus ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-md ${
                    requestStatus === 'confirmed' ? 'bg-green-50' : 
                    requestStatus === 'rejected' ? 'bg-red-50' : 
                    'bg-yellow-50'
                  }`}>
                    <p className={`text-sm ${
                      requestStatus === 'confirmed' ? 'text-green-800' : 
                      requestStatus === 'rejected' ? 'text-red-800' : 
                      'text-yellow-800'
                    }`}>
                      {requestStatus === 'confirmed' 
                        ? 'Your ride request has been confirmed!' 
                        : requestStatus === 'rejected'
                        ? 'Your ride request was rejected.'
                        : 'Your ride request is pending approval from the driver.'}
                    </p>
                  </div>
                  
                  {requestStatus === 'pending' && (
                    <button
                      onClick={handleCancelRequest}
                      disabled={requestLoading}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      {requestLoading ? 'Cancelling...' : 'Cancel Request'}
                    </button>
                  )}
                </div>
              ) : canRequestRide() ? (
                <button
                  onClick={handleRequestRide}
                  disabled={requestLoading}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {requestLoading ? 'Requesting...' : 'Request This Ride'}
                </button>
              ) : (
                !user ? (
                  <div className="bg-yellow-50 p-4 rounded-md">
                    <p className="text-sm text-yellow-800">
                      Please log in to request this ride.
                    </p>
                    <button
                      onClick={() => navigate('/login')}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      Log In
                    </button>
                  </div>
                ) : (isRideCancelled() || isRideCompleted()) ? (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600">
                      This ride is no longer available for booking.
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md">
                    <p className="text-sm text-red-800">
                      No seats available for this ride.
                    </p>
                  </div>
                )
              )}
            </div>
            
            {/* Rating section */}
            {canRateRide() && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h2 className="text-lg font-medium text-gray-900">Rate Your Experience</h2>
                <div className="mt-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`${
                          ratingValue >= star ? 'text-yellow-400' : 'text-gray-300'
                        } hover:text-yellow-400 focus:outline-none`}
                        onClick={() => setRatingValue(star)}
                      >
                        <StarIcon className="h-7 w-7 fill-current" />
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                      Comments (optional)
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="comment"
                        name="comment"
                        rows={3}
                        className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Share your experience with this driver..."
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={handleSubmitRating}
                      disabled={isSubmittingRating || ratingValue === 0}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmittingRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center">
          <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
          <p className="mt-4 text-red-500">Ride not found.</p>
          <button 
            onClick={() => navigate('/rides')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Back to Rides
          </button>
        </div>
      )}
    </div>
  );
} 