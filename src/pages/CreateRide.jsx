import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rides } from '../services/api';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function CreateRide() {
  const [formData, setFormData] = useState({
    carModel: '',
    carNumber: '',
    pickupLocation: {
      type: 'Point',
      coordinates: ['', ''], // [longitude, latitude]
    },
    dropoffLocation: {
      type: 'Point',
      coordinates: ['', ''], // [longitude, latitude]
    },
    time: '',
    seatsAvailable: '',
    price: '',
    smokingAllowed: false,
    petsAllowed: false,
    alcoholAllowed: false,
    genderPreference: 'any',
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('pickup') || name.startsWith('dropoff')) {
      const [location, coord, index] = name.split('_');
      setFormData((prev) => ({
        ...prev,
        [`${location}Location`]: {
          ...prev[`${location}Location`],
          coordinates: prev[`${location}Location`].coordinates.map((c, i) =>
            i === parseInt(index) ? value : c
          ),
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to create rides');
      return;
    }

    setLoading(true);
    try {
      await rides.create(formData);
      toast.success('Ride created successfully!');
      navigate('/my-rides');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create ride');
    } finally {
      setLoading(false);
    }
  };

  const openGoogleMaps = (type) => {
    window.open('https://www.google.com/maps', '_blank');
  };

  // Function to get current location
  const getCurrentLocation = (type) => {
    if (navigator.geolocation) {
      const loadingToast = toast.loading('Getting your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          setFormData((prev) => ({
            ...prev,
            [`${type}Location`]: {
              ...prev[`${type}Location`],
              coordinates: [longitude.toString(), latitude.toString()],
            },
          }));
          
          toast.dismiss(loadingToast);
          toast.success(`${type === 'pickup' ? 'Pickup' : 'Dropoff'} location set to your current location`);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.dismiss(loadingToast);
          toast.error('Could not get your location. Please enter coordinates manually.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="card">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Create a New Ride</h2>
            <p className="mt-2 text-gray-600">Share your journey with others</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Vehicle Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Car Model</label>
                  <input
                    type="text"
                    name="carModel"
                    required
                    className="input mt-1"
                    placeholder="e.g. Toyota Camry"
                    value={formData.carModel}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Car Number</label>
                  <input
                    type="text"
                    name="carNumber"
                    required
                    className="input mt-1"
                    placeholder="e.g. ABC 123"
                    value={formData.carNumber}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Route Details</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pickup Location</label>
                      <p className="text-xs text-gray-500 mt-0.5">Where will you start your journey?</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => getCurrentLocation('pickup')}
                        className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center"
                      >
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Use Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => openGoogleMaps('pickup')}
                        className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center"
                      >
                        Find on Google Maps →
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="text"
                        name="pickup_coordinates_0"
                        required
                        className="input"
                        placeholder="Longitude"
                        value={formData.pickupLocation.coordinates[0]}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="text"
                        name="pickup_coordinates_1"
                        required
                        className="input"
                        placeholder="Latitude"
                        value={formData.pickupLocation.coordinates[1]}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dropoff Location</label>
                      <p className="text-xs text-gray-500 mt-0.5">Where will your journey end?</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => getCurrentLocation('dropoff')}
                        className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center"
                      >
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        Use Current Location
                      </button>
                      <button
                        type="button"
                        onClick={() => openGoogleMaps('dropoff')}
                        className="text-primary hover:text-primary/80 text-sm font-medium inline-flex items-center"
                      >
                        Find on Google Maps →
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="text"
                        name="dropoff_coordinates_0"
                        required
                        className="input"
                        placeholder="Longitude"
                        value={formData.dropoffLocation.coordinates[0]}
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="text"
                        name="dropoff_coordinates_1"
                        required
                        className="input"
                        placeholder="Latitude"
                        value={formData.dropoffLocation.coordinates[1]}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Ride Details */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ride Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                  <input
                    type="datetime-local"
                    name="time"
                    required
                    className="input mt-1"
                    value={formData.time}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                  <input
                    type="number"
                    name="seatsAvailable"
                    required
                    min="1"
                    className="input mt-1"
                    placeholder="e.g. 3"
                    value={formData.seatsAvailable}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Price per Seat</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      className="input pl-7"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ride Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="smokingAllowed"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.smokingAllowed}
                      onChange={handleChange}
                    />
                    <span className="text-gray-700">Smoking allowed</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="petsAllowed"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.petsAllowed}
                      onChange={handleChange}
                    />
                    <span className="text-gray-700">Pets allowed</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="alcoholAllowed"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.alcoholAllowed}
                      onChange={handleChange}
                    />
                    <span className="text-gray-700">Alcohol allowed</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender Preference</label>
                  <select
                    name="genderPreference"
                    className="input mt-1"
                    value={formData.genderPreference}
                    onChange={handleChange}
                  >
                    <option value="any">Any</option>
                    <option value="male">Male only</option>
                    <option value="female">Female only</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-lg font-medium"
              >
                {loading ? 'Creating ride...' : 'Create Ride'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 