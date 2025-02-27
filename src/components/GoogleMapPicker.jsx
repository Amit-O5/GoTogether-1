import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 37.7749, // San Francisco as default
  lng: -122.4194
};

/**
 * GoogleMapPicker component for selecting locations on Google Maps
 * 
 * @param {Object} props Component props
 * @param {Object} props.initialPosition Initial map position {lat, lng}
 * @param {Function} props.onLocationSelect Callback when location is selected
 * @param {string} props.type Type of location picker ('pickup' or 'dropoff')
 */
function GoogleMapPicker({ initialPosition, onLocationSelect, type }) {
  const [position, setPosition] = useState(initialPosition || defaultCenter);
  const [map, setMap] = useState(null);
  const { isLoaded, loadError } = useGoogleMaps();
  
  // Try to get user's current location on component mount if no initialPosition is provided
  useEffect(() => {
    if (!initialPosition && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setPosition(currentPosition);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Fallback to default if geolocation fails
          setPosition(defaultCenter);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [initialPosition]);
  
  // Update position when initialPosition changes
  useEffect(() => {
    if (initialPosition && initialPosition.lat && initialPosition.lng) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);
  
  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);
  
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);
  
  const handleMapClick = (event) => {
    const newPosition = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    
    setPosition(newPosition);
    
    if (onLocationSelect) {
      onLocationSelect(newPosition, type);
    }
  };
  
  if (loadError) {
    return <div className="p-4 text-center text-red-500">Map cannot be loaded right now, sorry.</div>
  }
  
  if (!isLoaded) {
    return <div className="p-4 text-center">Loading maps...</div>
  }
  
  return (
    <div className="h-full w-full">
      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800 text-sm">
        <p className="font-medium">How to select a location:</p>
        <ul className="mt-1 list-disc list-inside">
          <li>Tap anywhere on the map to select that location</li>
          <li>You can zoom in/out for more precision</li>
        </ul>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={position}
        zoom={14}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
      >
        <Marker 
          position={position} 
          draggable={true}
          onDragEnd={(e) => {
            const newPosition = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            };
            setPosition(newPosition);
            if (onLocationSelect) {
              onLocationSelect(newPosition, type);
            }
          }}
        />
      </GoogleMap>
    </div>
  );
}

export default GoogleMapPicker; 