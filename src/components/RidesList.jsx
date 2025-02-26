import { useState, useEffect } from 'react';
import RideCard from './RideCard';
import { rides as ridesApi } from '../services/api';
import useSWR from 'swr';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { MapPinIcon } from '@heroicons/react/24/outline';

export default function RidesList() {
  const [searchParams, setSearchParams] = useState({
    pickupLat: '',
    pickupLng: '',
    dropoffLat: '',
    dropoffLng: '',
  });

  // Add state for validation popup
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  
  // Add loading state for search button
  const [isSearching, setIsSearching] = useState(false);

  // Add fetcher function to properly handle the API response
  const fetcher = async () => {
    console.log('Fetching rides...');
    const response = await ridesApi.getAll();
    console.log('API Response:', response);
    console.log('API Response Data Structure:', JSON.stringify(response.data, null, 2));
    return response;
  };

  // Helper function to extract rides from any response format
  const extractRidesFromResponse = (response) => {
    if (!response || !response.data) return [];
    
    console.log('Response data type:', typeof response.data);
    
    // Direct array
    if (Array.isArray(response.data)) {
      console.log('Response data is an array');
      return response.data;
    }
    
    // Standard API format with data property
    if (response.data.data) {
      console.log('Response has data property');
      if (Array.isArray(response.data.data)) {
        return response.data.data;
      }
      if (response.data.data.rides && Array.isArray(response.data.data.rides)) {
        return response.data.data.rides;
      }
    }
    
    // API format with rides property
    if (response.data.rides && Array.isArray(response.data.rides)) {
      console.log('Response has rides property');
      return response.data.rides;
    }
    
    // Try to find any array property in the response
    const keys = Object.keys(response.data);
    for (const key of keys) {
      if (Array.isArray(response.data[key])) {
        console.log(`Found array property: ${key}`);
        return response.data[key];
      }
    }
    
    console.log('No rides found in response');
    return [];
  };

  const { data: response, error, mutate } = useSWR(
    'allRides',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      onSuccess: (data) => {
        console.log('SWR success:', data);
      },
      onError: (err) => {
        console.error('SWR error:', err);
      }
    }
  );

  // Add effect to log when response changes
  useEffect(() => {
    console.log('Response updated:', response);
  }, [response]);

  // Add direct API call on component mount to check endpoint
  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        console.log('Directly checking API endpoint...');
        // Try both endpoints to see which one works
        const originalEndpoint = await axios.get('http://localhost:4000/api/rides/getRides');
        console.log('Original endpoint response:', originalEndpoint);
        console.log('Original endpoint rides:', extractRidesFromResponse(originalEndpoint));
        
        const newEndpoint = await axios.get('http://localhost:4000/api/rides');
        console.log('New endpoint response:', newEndpoint);
        console.log('New endpoint rides:', extractRidesFromResponse(newEndpoint));
      } catch (error) {
        console.error('Direct API call error:', error);
      }
    };
    
    checkEndpoint();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Check if any coordinates are missing
    const missingCoordinates = [];
    if (!searchParams.pickupLat) missingCoordinates.push('Pickup Latitude');
    if (!searchParams.pickupLng) missingCoordinates.push('Pickup Longitude');
    if (!searchParams.dropoffLat) missingCoordinates.push('Dropoff Latitude');
    if (!searchParams.dropoffLng) missingCoordinates.push('Dropoff Longitude');
    
    if (missingCoordinates.length > 0) {
      // Show validation popup with missing coordinates
      const message = `Please enter all coordinates: ${missingCoordinates.join(', ')}`;
      setValidationMessage(message);
      setShowValidationPopup(true);
      
      // Also show a toast notification
      toast.error(message);
      
      return;
    }
    
    setIsSearching(true);
    try {
      console.log('Searching with params:', searchParams);
      const response = await ridesApi.getBest(searchParams);
      console.log('Search response:', response);
      mutate(response, false);
      toast.success('Search completed successfully');
    } catch (error) {
      console.error('Failed to search rides:', error);
      toast.error('Failed to search rides. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSearchParams((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to check if a field is empty
  const isFieldEmpty = (fieldName) => {
    return searchParams[fieldName] === '';
  };

  // Function to get input class based on validation
  const getInputClass = (fieldName) => {
    return `input w-full ${isFieldEmpty(fieldName) ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`;
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
          
          if (type === 'pickup') {
            setSearchParams((prev) => ({
              ...prev,
              pickupLat: latitude.toString(),
              pickupLng: longitude.toString(),
            }));
            toast.dismiss(loadingToast);
            toast.success('Pickup location set to your current location');
          } else if (type === 'dropoff') {
            setSearchParams((prev) => ({
              ...prev,
              dropoffLat: latitude.toString(),
              dropoffLng: longitude.toString(),
            }));
            toast.dismiss(loadingToast);
            toast.success('Dropoff location set to your current location');
          }
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

  if (error) {
    console.error('Error loading rides:', error);
    return (
      <div className="text-center text-red-500 p-4">
        Failed to load rides. Please try again later.
      </div>
    );
  }

  if (!response) {
    return (
      <div className="text-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading rides...</p>
      </div>
    );
  }

  // Extract rides from the response using the helper function
  const rides = response ? extractRidesFromResponse(response) : [];
  
  console.log('Rides to display:', rides);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Find Available Rides</h1>
          <p className="mt-2 text-gray-600">Search for rides that match your route</p>
        </div>
      </div>

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-red-600 mb-2">Missing Information</h3>
            <p className="text-gray-700 mb-4">{validationMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowValidationPopup(false)}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Search Form */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Search Criteria</h2>
              <p className="mt-1 text-sm text-gray-500">Enter your pickup and dropoff locations to find matching rides</p>
            </div>
            
            <form onSubmit={handleSearch} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pickup Location */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Pickup Location</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Where would you like to be picked up?</p>
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
                        Find on Google Maps
                        <span className="ml-1">→</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        name="pickupLng"
                        className={getInputClass('pickupLng')}
                        value={searchParams.pickupLng}
                        onChange={handleChange}
                        step="any"
                        placeholder="e.g. -74.0060"
                        required
                      />
                      {isFieldEmpty('pickupLng') && (
                        <p className="mt-1 text-xs text-red-500">Required</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        name="pickupLat"
                        className={getInputClass('pickupLat')}
                        value={searchParams.pickupLat}
                        onChange={handleChange}
                        step="any"
                        placeholder="e.g. 40.7128"
                        required
                      />
                      {isFieldEmpty('pickupLat') && (
                        <p className="mt-1 text-xs text-red-500">Required</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropoff Location */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Dropoff Location</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Where would you like to go?</p>
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
                        Find on Google Maps
                        <span className="ml-1">→</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        name="dropoffLng"
                        className={getInputClass('dropoffLng')}
                        value={searchParams.dropoffLng}
                        onChange={handleChange}
                        step="any"
                        placeholder="e.g. -118.2437"
                        required
                      />
                      {isFieldEmpty('dropoffLng') && (
                        <p className="mt-1 text-xs text-red-500">Required</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        name="dropoffLat"
                        className={getInputClass('dropoffLat')}
                        value={searchParams.dropoffLat}
                        onChange={handleChange}
                        step="any"
                        placeholder="e.g. 34.0522"
                        required
                      />
                      {isFieldEmpty('dropoffLat') && (
                        <p className="mt-1 text-xs text-red-500">Required</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  type="submit"
                  className="btn btn-primary w-full sm:w-auto px-8 py-3 text-base font-medium"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⟳</span>
                      Searching...
                    </>
                  ) : (
                    'Search Available Rides'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Rides</h2>
            
            {rides.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-8 text-center">
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No rides found</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
                  Try adjusting your search parameters or check back later for new ride offerings.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rides.map((ride) => (
                  <RideCard
                    key={ride._id}
                    ride={ride}
                    onRequest={() => mutate()}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 