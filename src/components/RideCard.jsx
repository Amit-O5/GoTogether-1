import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rides } from '../services/api';
import { toast } from 'react-hot-toast';

export default function RideCard({ ride, onRequest }) {
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

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
      return;
    }

    setLoading(true);
    try {
      await rides.request(ride.id || ride._id);
      toast.success('Ride requested successfully!');
      if (onRequest) onRequest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  const driverId = ride.driver?.id || '';
  const driverFirstName = ride.driver?.firstName || 'Unknown';
  const driverLastName = ride.driver?.lastName || 'Driver';
  const driverRating = ride.driver?.rating;
  const price = ride.price || 0;
  const pickupCoordinates = ride.pickupLocation?.coordinates || [0, 0];
  const dropoffCoordinates = ride.dropoffLocation?.coordinates || [0, 0];
  const departureTime = ride.departureTime || ride.time || new Date().toISOString();
  const availableSeats = ride.availableSeats || ride.seatsAvailable || 0;
  const preferences = ride.preferences || {
    smoking: ride.smokingAllowed || false,
    pets: ride.petsAllowed || false,
    gender: ride.genderPreference || 'any',
  };
  
  const isUserRide = user?.id === driverId;
  const hasRequested = ride.passengers?.some(
    (p) => p.user === user?.id && p.status === 'pending'
  );
  const isConfirmed = ride.passengers?.some(
    (p) => p.user === user?.id && p.status === 'confirmed'
  );

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold flex-shrink-0">
              {driverFirstName[0]}
              {driverLastName[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {driverFirstName} {driverLastName}
              </h3>
              <div className="text-sm text-gray-500">
                {driverRating ? `★ ${driverRating}` : 'New Driver'}
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
            <div className="w-4 h-4 rounded-full bg-green-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-500">Pickup</div>
              <div className="font-medium text-gray-900 break-words">
                [{pickupCoordinates.join(', ')}]
              </div>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-4 h-4 rounded-full bg-red-500 mt-1 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-500">Dropoff</div>
              <div className="font-medium text-gray-900 break-words">
                [{dropoffCoordinates.join(', ')}]
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
          <div className="flex items-center">
            <i className="far fa-calendar mr-1"></i> {formatDate(departureTime)}
          </div>
          <div className="flex items-center">
            <i className="fas fa-user mr-1"></i> {availableSeats} seats available
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {preferences.smoking && (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              🚬 Smoking allowed
            </span>
          )}
          {preferences.pets && (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              🐾 Pet friendly
            </span>
          )}
          {preferences.gender !== 'any' && (
            <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              👤 {preferences.gender} only
            </span>
          )}
        </div>

        <div className="mt-6">
          {isUserRide ? (
            <button disabled className="btn btn-secondary w-full opacity-50">
              Your ride
            </button>
          ) : isConfirmed ? (
            <button disabled className="btn btn-secondary w-full opacity-50">
              Confirmed ✓
            </button>
          ) : hasRequested ? (
            <button disabled className="btn btn-secondary w-full opacity-50">
              Request pending...
            </button>
          ) : (
            <button
              onClick={handleRequestRide}
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Requesting...' : 'Request Ride'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 