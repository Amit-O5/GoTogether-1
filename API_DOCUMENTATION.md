# GoTogether API Documentation

## Base URL
- Development: `http://localhost:4000`
- Production: `[Your production URL]`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### 1. Authentication APIs

#### 1.1 Register User
- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **Description**: Register a new user (driver/rider)

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "yourpassword",
  "role": "rider"  // "rider" or "driver"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "rider"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Error message here"
}
```

#### 1.2 Login User
- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **Description**: Authenticate user and get JWT token

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "rider"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 2. Ride Management APIs

#### 2.1 Create Ride
- **Endpoint**: `POST /api/rides/createRide`
- **Access**: Protected (Driver only)
- **Description**: Create a new ride offering

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "carModel": "Honda Civic",
  "carNumber": "ABC123",
  "pickupLocation": {
    "type": "Point",
    "coordinates": [-73.935242, 40.730610]  // [longitude, latitude]
  },
  "dropoffLocation": {
    "type": "Point",
    "coordinates": [-71.058880, 42.360082]  // [longitude, latitude]
  },
  "time": "2024-03-30T10:00:00.000Z",
  "seatsAvailable": 3,
  "price": 15.5,
  "smokingAllowed": false,
  "petsAllowed": true,
  "alcoholAllowed": false,
  "genderPreference": "any"  // "any", "male", or "female"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "driver": "driver_id",
    "pickupLocation": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610]
    },
    "dropoffLocation": {
      "type": "Point",
      "coordinates": [-71.058880, 42.360082]
    },
    "departureTime": "2024-03-30T10:00:00.000Z",
    "availableSeats": 3,
    "price": 15.5,
    "status": "active",
    "preferences": {
      "smoking": false,
      "pets": true,
      "alcohol": false,
      "gender": "any"
    },
    "passengers": [],
    "createdAt": "2024-02-26T04:02:34.000Z",
    "updatedAt": "2024-02-26T04:02:34.000Z"
  }
}
```

#### 2.2 Get All Rides
- **Endpoint**: `GET /api/rides/getRides`
- **Access**: Public
- **Description**: Get all available rides

**Query Parameters (optional):**
```
from: string (comma-separated coordinates)
to: string (comma-separated coordinates)
date: string (ISO date)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ride_id",
      "driver": {
        "id": "driver_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "status": "active",
      "preferences": {
        "smoking": false,
        "pets": true,
        "alcohol": false,
        "gender": "any"
      },
      "passengers": []
    }
  ]
}
```

#### 2.3 Get Best Matching Rides
- **Endpoint**: `GET /api/rides/bestRides`
- **Access**: Public
- **Description**: Get rides based on location proximity

**Query Parameters:**
```
pickupLat: number (latitude)
pickupLng: number (longitude)
dropoffLat: number (latitude)
dropoffLng: number (longitude)
maxDistance?: number (optional, defaults to 5000 meters, max 20000)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "ride_id",
      "driver": {
        "id": "driver_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "pickupDistance": 100,
      "dropoffDistance": 150,
      "totalDistance": 250
    }
  ]
}
```

#### 2.4 Get User Ride Requests
- **Endpoint**: `GET /api/rides/myRequests`
- **Access**: Protected (Any authenticated user)
- **Description**: Get all rides where the user has made a request

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": "ride_id",
      "driver": {
        "id": "driver_id",
        "firstName": "John",
        "lastName": "Doe",
        "rating": 4.5,
        "carModel": "Honda Civic",
        "carNumber": "ABC123"
      },
      "pickupLocation": {
        "type": "Point",
        "coordinates": [-73.935242, 40.730610]
      },
      "dropoffLocation": {
        "type": "Point",
        "coordinates": [-71.058880, 42.360082]
      },
      "departureTime": "2024-03-30T10:00:00.000Z",
      "availableSeats": 3,
      "price": 15.5,
      "status": "active",
      "preferences": {
        "smoking": false,
        "pets": true,
        "alcohol": false,
        "gender": "any"
      },
      "passengers": [
        {
          "user": "user_id",
          "status": "pending"
        }
      ],
      "userRequestStatus": "pending"
    }
  ]
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "No ride requests found for this user"
}
```

#### 2.5 Get Ride by ID
- **Endpoint**: `GET /api/rides/:id`
- **Access**: Public
- **Description**: Get details of a specific ride by its ID

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "67b0e6c10a30e235f6d10aee",
    "driver": {
      "id": "67b0e3f50a30e235f6d10ad6",
      "firstName": "Vipul",
      "lastName": "Beniwal",
      "rating": 0
    },
    "pickupLocation": {
      "type": "Point",
      "coordinates": [-0.127758, 51.507351]
    },
    "dropoffLocation": {
      "type": "Point",
      "coordinates": [-0.076132, 51.508481]
    },
    "departureTime": "2024-03-20T08:00:00.000Z",
    "availableSeats": 1,
    "price": 15.5,
    "status": "active",
    "carModel": "tesla",
    "carNumber": "12216863",
    "preferences": {
      "smoking": false,
      "pets": true,
      "gender": "male"
    },
    "passengers": [
      {
        "user": "67b0e3f50a30e235f6d10ad6",
        "status": "confirmed"
      }
    ],
    "createdAt": "2025-02-15T19:10:57.986Z",
    "updatedAt": "2025-02-26T10:27:48.260Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ride not found"
}
```

#### 2.6 Request Ride
- **Endpoint**: `PUT /api/rides/:id/request`
- **Access**: Protected (Rider only)
- **Description**: Request to join a ride

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "driver": "driver_id",
    "passengers": [
      {
        "user": "user_id",
        "status": "pending"
      }
    ],
    "availableSeats": 3,
    "status": "active"
  }
}
```

#### 2.7 Approve/Reject Ride Request
- **Endpoint**: `PUT /api/rides/:id/approval`
- **Access**: Protected (Driver only)
- **Description**: Driver can approve or reject ride requests

**Request Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Request Body:**
```json
{
  "passengerId": "user_id",
  "status": "confirmed"  // "confirmed" or "rejected"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "ride_id",
    "driver": "driver_id",
    "passengers": [
      {
        "user": "user_id",
        "status": "confirmed"
      }
    ],
    "availableSeats": 2,
    "status": "active"
  }
}
```

## Error Responses

### Common Error Formats

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation error details"
}
```

**Not Found Error (404):**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Server Error (500):**
```json
{
  "success": false,
  "message": "Server error"
}
```

## Notes

1. All timestamps are in ISO 8601 format
2. Coordinates are in [longitude, latitude] format for GeoJSON compatibility
3. Distance values in the Best Rides API are in meters
4. The maxDistance parameter in Best Rides API is capped at 20km (20000 meters)
5. Ride status can be: "active", "completed", "cancelled", or "busy"
6. Passenger request status can be: "pending", "confirmed", or "rejected" 