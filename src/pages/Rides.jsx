import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rides as ridesApi } from '../services/api';
import { toast } from 'react-hot-toast';
import { 
  UserCircleIcon, 
  MapPinIcon, 
  CalendarIcon, 
  CurrencyDollarIcon,
  UsersIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    seats: '',
    priceMin: '',
    priceMax: '',
    searchQuery: '',
    sortBy: 'departureTime',
    sortDirection: 'asc'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRides();
  }, []);

  const fetchRides = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all available rides
      const response = await ridesApi.getAllRides();
      console.log('All rides response:', response);
      
      let allRides = [];
      if (response.data && response.data.data) {
        allRides = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        allRides = response.data;
      }
      
      // Filter out rides with status other than active
      allRides = allRides.filter(ride => !ride.status || ride.status === 'active');
      
      // Sort by departure time (default)
      allRides.sort((a, b) => {
        const dateA = new Date(a.departureTime || a.time || 0);
        const dateB = new Date(b.departureTime || b.time || 0);
        return dateA - dateB;
      });
      
      setRides(allRides);
    } catch (error) {
      console.error('Failed to fetch rides:', error);
      
      let errorMessage = 'Failed to load rides.';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Apply filters is done in the filteredRides variable
  };

  const handleRideClick = (rideId) => {
    navigate(`/rides/${rideId}`);
  };

  const handlePostRide = () => {
    navigate('/rides/create');
  };

  // Apply filters to rides
  const filteredRides = rides.filter(ride => {
    // Filter by seats
    if (filters.seats && (ride.availableSeats < parseInt(filters.seats) || ride.seatsAvailable < parseInt(filters.seats))) {
      return false;
    }
    
    // Filter by price
    if (filters.priceMin && ride.price < parseFloat(filters.priceMin)) {
      return false;
    }
    if (filters.priceMax && ride.price > parseFloat(filters.priceMax)) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      
      // Search in pickup and dropoff locations
      const pickup = getLocationString(ride.pickupLocation).toLowerCase();
      const dropoff = getLocationString(ride.dropoffLocation).toLowerCase();
      
      // Search in car model
      const carModel = (ride.carModel || '').toLowerCase();
      
      // Search in driver name
      let driverName = '';
      if (ride.creator) {
        if (typeof ride.creator !== 'string') {
          driverName = [
            ride.creator.firstName,
            ride.creator.lastName,
            ride.creator.name,
            ride.creator.username
          ].filter(Boolean).join(' ').toLowerCase();
        }
      }
      
      // Check if any fields contain the search query
      if (!pickup.includes(query) && 
          !dropoff.includes(query) && 
          !carModel.includes(query) && 
          !driverName.includes(query)) {
        return false;
      }
    }
    
    return true;
  }).sort((a, b) => {
    // Apply sorting
    const sortKey = filters.sortBy || 'departureTime';
    const direction = filters.sortDirection === 'desc' ? -1 : 1;
    
    if (sortKey === 'departureTime') {
      const dateA = new Date(a.departureTime || a.time || 0);
      const dateB = new Date(b.departureTime || b.time || 0);
      return (dateA - dateB) * direction;
    } else if (sortKey === 'price') {
      return ((a.price || 0) - (b.price || 0)) * direction;
    } else if (sortKey === 'seats') {
      const seatsA = a.availableSeats || a.seatsAvailable || 0;
      const seatsB = b.availableSeats || b.seatsAvailable || 0;
      return (seatsA - seatsB) * direction;
    }
    
    return 0;
  });

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date)) {
        return 'Invalid date';
      }
      
      // Format: "Mon, Mar 30, 2024 at 10:00 AM"
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
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

  // Get driver name from ride
  const getDriverName = (ride) => {
    if (!ride || !ride.creator) return 'Driver';
    
    if (typeof ride.creator === 'string') {
      return 'Driver';
    } else if (ride.creator.firstName && ride.creator.lastName) {
      return `${ride.creator.firstName} ${ride.creator.lastName}`;
    } else if (ride.creator.name) {
      return ride.creator.name;
    } else if (ride.creator.username) {
      return ride.creator.username;
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
    <div className="space-y-6">
      {/* Header and action buttons */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Rides</h1>
            <p className="mt-1 text-sm text-gray-500">
              Find and book a ride or offer your own
            </p>
          </div>
          
          <button
            onClick={handlePostRide}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            + Offer a Ride
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="searchQuery"
                  id="searchQuery"
                  className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Search by location or driver..."
                  value={filters.searchQuery}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="w-full md:w-32">
              <label htmlFor="seats" className="block text-sm font-medium text-gray-700 mb-1">
                Min Seats
              </label>
              <select
                id="seats"
                name="seats"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={filters.seats}
                onChange={handleFilterChange}
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </div>
            
            <div className="w-full md:w-36">
              <label htmlFor="priceMin" className="block text-sm font-medium text-gray-700 mb-1">
                Min Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="priceMin"
                  id="priceMin"
                  className="focus:ring-primary focus:border-primary block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Min"
                  min="0"
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="w-full md:w-36">
              <label htmlFor="priceMax" className="block text-sm font-medium text-gray-700 mb-1">
                Max Price
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  name="priceMax"
                  id="priceMax"
                  className="focus:ring-primary focus:border-primary block w-full pl-7 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Max"
                  min="0"
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
            
            <div className="w-full md:w-40">
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sortBy"
                name="sortBy"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={filters.sortBy}
                onChange={handleFilterChange}
              >
                <option value="departureTime">Departure Time</option>
                <option value="price">Price</option>
                <option value="seats">Available Seats</option>
              </select>
            </div>
            
            <div className="w-full md:w-40">
              <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">
                Direction
              </label>
              <select
                id="sortDirection"
                name="sortDirection"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                value={filters.sortDirection}
                onChange={handleFilterChange}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFilters({
                seats: '',
                priceMin: '',
                priceMax: '',
                searchQuery: '',
                sortBy: 'departureTime',
                sortDirection: 'asc'
              })}
              className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Reset Filters
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>
      
      {/* Rides list */}
      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading available rides...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-2 text-red-500">{error}</p>
            <button 
              onClick={fetchRides}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Try Again
            </button>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="text-center py-8">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">
              {filters.searchQuery || filters.seats || filters.priceMin || filters.priceMax 
                ? 'No rides match your search criteria.'
                : 'No rides available at the moment.'}
            </p>
            <button 
              onClick={() => setFilters({
                seats: '',
                priceMin: '',
                priceMax: '',
                searchQuery: '',
                sortBy: 'departureTime',
                sortDirection: 'asc'
              })}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Found {filteredRides.length} {filteredRides.length === 1 ? 'ride' : 'rides'}
            </p>
            
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRides.map((ride) => {
                const rideId = ride.id || ride._id;
                const pickup = getLocationString(ride.pickupLocation);
                const dropoff = getLocationString(ride.dropoffLocation);
                const departureTime = formatDate(ride.departureTime || ride.time);
                const driverName = getDriverName(ride);
                const price = ride.price?.toFixed(2) || '0.00';
                const seats = ride.availableSeats || ride.seatsAvailable || 0;
                
                return (
                  <div
                    key={rideId}
                    onClick={() => handleRideClick(rideId)}
                    className="border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {pickup}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            to {dropoff}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-2 bg-primary/10 text-primary font-semibold px-2 py-1 rounded-md text-sm">
                          ${price}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-center">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600">{departureTime}</p>
                      </div>
                      
                      <div className="mt-3 flex items-center">
                        <UserCircleIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-600">{driverName}</p>
                      </div>
                      
                      <div className="mt-3 flex justify-between">
                        <div className="flex items-center">
                          <UsersIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <p className="text-sm text-gray-600">{seats} seat{seats !== 1 ? 's' : ''} available</p>
                        </div>
                        
                        <Link 
                          to={`/rides/${rideId}`}
                          className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 