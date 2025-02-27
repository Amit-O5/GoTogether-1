import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rides } from '../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  UserCircleIcon, 
  CalendarIcon, 
  UsersIcon,
  MapPinIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function RideCard({ ride, onRequest }) {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Log the ride object to see its structure
  console.log('Ride object:', ride);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const handleRequestRide = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to request a ride');
      navigate('/login');
      return;
    }

    // Check if the user is trying to request their own ride
    const creatorId = ride.creator?.id || ride.creator;
    if (user && (user.id === creatorId)) {
      toast.error("You can't request your own ride!");
      return;
    }

    setLoading(true);
    try {
      // Use requestRide method as per the updated API service file
      await rides.requestRide(ride.id || ride._id);
      toast.success('Ride requested successfully!');
      if (onRequest) onRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    navigate(`/rides/${ride.id || ride._id}`);
  };

  const creatorId = ride.creator?.id || ride.creator || '';
  const creatorFirstName = ride.creator?.firstName || 'Unknown';
  const creatorLastName = ride.creator?.lastName || 'User';
  const creatorRating = ride.creator?.rating;
  const price = ride.price || 0;
  const pickupCoordinates = ride.pickupLocation?.coordinates || [0, 0];
  const dropoffCoordinates = ride.dropoffLocation?.coordinates || [0, 0];
  const departureTime = ride.departureTime || ride.time || new Date().toISOString();
  const availableSeats = ride.availableSeats || ride.seatsAvailable || 0;
  const preferences = ride.preferences || {};
  
  const isUserRide = user?.id === creatorId;
  const hasRequested = ride.passengers?.some(
    (p) => (p.user === user?.id || (p.user?.id === user?.id)) && p.status === 'pending'
  );
  const isConfirmed = ride.passengers?.some(
    (p) => (p.user === user?.id || (p.user?.id === user?.id)) && p.status === 'confirmed'
  );

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">
              {creatorFirstName[0]}
              {creatorLastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {creatorFirstName} {creatorLastName}
              </h3>
              <div className="text-sm text-gray-500">
                {creatorRating ? `★ ${creatorRating}` : 'New User'}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${parseFloat(price).toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">per seat</div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex items-start space-x-3">
            <MapPinIcon className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-500">Pickup</div>
              <div className="font-medium text-gray-900 break-words">
                {Array.isArray(pickupCoordinates) ? `[${pickupCoordinates.join(', ')}]` : pickupCoordinates}
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPinIcon className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-500">Dropoff</div>
              <div className="font-medium text-gray-900 break-words">
                {Array.isArray(dropoffCoordinates) ? `[${dropoffCoordinates.join(', ')}]` : dropoffCoordinates}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <div className="flex items-center">
            <CalendarIcon className="w-5 h-5 mr-1.5 text-gray-400" />
            {formatDate(departureTime)}
          </div>
          <div className="flex items-center">
            <UsersIcon className="w-5 h-5 mr-1.5 text-gray-400" />
            {availableSeats} seats available
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {preferences.smoking !== undefined && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              preferences.smoking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {preferences.smoking ? '🚬 Smoking allowed' : 'No smoking'}
            </span>
          )}
          {preferences.pets !== undefined && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              preferences.pets ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {preferences.pets ? '🐾 Pet friendly' : 'No pets'}
            </span>
          )}
          {preferences.gender && preferences.gender !== 'any' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              👤 {preferences.gender === 'male' ? 'Male only' : 'Female only'}
            </span>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleViewDetails}
            className="btn btn-secondary flex-1"
          >
            View Details
          </button>
          
          {isUserRide ? (
            <button 
              disabled 
              className="btn bg-gray-200 text-gray-500 cursor-not-allowed flex-1"
            >
              Your ride
            </button>
          ) : isConfirmed ? (
            <button 
              disabled 
              className="btn bg-green-100 text-green-800 cursor-not-allowed flex-1"
            >
              Confirmed ✓
            </button>
          ) : hasRequested ? (
            <button 
              disabled 
              className="btn bg-yellow-100 text-yellow-800 cursor-not-allowed flex-1"
            >
              Request pending...
            </button>
          ) : (
            <button
              onClick={handleRequestRide}
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Requesting...' : 'Request Ride'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 