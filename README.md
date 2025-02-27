# GoTogether

<div align="center">
  <img src="https://github.com/vipulbeniwal01/GoTogether/blob/main/public/favicon.ico" alt="GoTogether Logo" width="180">
  <p><em>Plan journeys together. Travel as one.</em></p>
</div>

## 🌟 Overview

GoTogether is a modern web application designed to streamline group travel planning and coordination. Built with React 18 and Vite, this platform offers an intuitive interface for creating shared itineraries, managing travel logistics, and collaborating with fellow travelers in real-time.

> **⚠️ IMPORTANT NOTE:** The backend server for this project is not publicly available. This repository contains only the client-side code and is intended for demonstration purposes or for use with your own compatible backend implementation.

## ✨ Key Features

### 🚗 Ride Sharing
- **Offer Rides**: Drivers can create and offer rides with detailed information
- **Find Rides**: Riders can search and filter available rides based on location, time, and preferences
- **Booking Management**: Track the status of ride requests and bookings in a dedicated dashboard
- **Request System**: Seamless ride request and approval workflow for both drivers and riders

### 📍 Location & Mapping
- **Map Integration**: Visualize pickup and dropoff points with interactive maps powered by React Leaflet
- **Route Optimization**: Find the most efficient routes between locations
- **Location-Based Matching**: Connect riders with nearby drivers for optimal convenience

### 👥 User Profiles & Management
- **Role-Based Access**: Separate interfaces and capabilities for riders and drivers
- **Profile Management**: Update personal information, preferences, and vehicle details
- **Booking History**: View past, current, and upcoming rides in one place
- **Reviews & Ratings**: Build trust with driver and rider ratings

### 🔔 Notifications & Communication
- **Status Updates**: Real-time notifications for ride request approvals, rejections, and changes
- **In-App Alerts**: Toast notifications for important events and actions
- **Email Confirmations**: Receive booking confirmations and updates via email

### 📱 Responsive Experience
- **Mobile-First Design**: Seamless experience across all devices
- **Offline Support**: Access critical ride information even without an internet connection
- **Intuitive Interface**: Clean, modern UI built with TailwindCSS and HeadlessUI components

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/gotogether-client.git
cd gotogether-client

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:5173` to see the application running.

## 🔧 Configuration

Copy the `.env.example` file to `.env` and adjust the variables as needed:

```bash
cp .env.example .env
```

## 📱 Deployment to Vercel

This project is configured for seamless deployment on Vercel:

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Log in to Vercel (https://vercel.com)
3. Click "New Project" and import your repository
4. Select the "Vite" framework preset (should be auto-detected)
5. Configure any environment variables in the Vercel dashboard
6. Click "Deploy"

Vercel will automatically build and deploy your application whenever you push changes to your repository.

### Manual Deployment

You can also deploy using the Vercel CLI:

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## 📲 Feature Highlights

### My Bookings
The My Bookings page provides a comprehensive overview of all ride requests and their current status:

- **For Riders**: View all requested rides with status indicators (pending, confirmed, rejected)
- **For Drivers**: Manage passenger requests with options to accept or reject
- **Rich Information**: See pickup/dropoff locations, departure times, and passenger/driver details
- **Status Tracking**: Visual indicators show the current status of each booking

### Driver Dashboard
A dedicated dashboard for drivers to manage their offered rides:

- **Ride Management**: Create, edit, and cancel offered rides
- **Passenger Requests**: Review and respond to ride requests
- **Capacity Tracking**: Monitor available seats and bookings
- **Schedule Overview**: Calendar view of upcoming and past rides

### Rider Experience
Tailored features for ride seekers:

- **Ride Search**: Find available rides based on location, date, and preferences
- **Booking Workflow**: Simple request process with clear status updates
- **Driver Information**: View driver profiles, ratings, and vehicle information
- **Route Visualization**: Map view of pickup and dropoff locations

## 🧰 Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: TailwindCSS for responsive design
- **State Management**: React Context API and SWR for data fetching
- **Routing**: React Router v7
- **UI Components**: HeadlessUI and HeroIcons
- **Maps**: React Leaflet for interactive mapping
- **Notifications**: React Hot Toast

## 📋 Project Structure

```
src/
├── assets/        # Static assets and images
├── components/    # Reusable React components
├── contexts/      # React context providers
├── hooks/         # Custom React hooks
├── layouts/       # Page layout components
├── pages/         # Main application pages
├── services/      # API service integrations
├── styles/        # Global styles and Tailwind utilities
└── utils/         # Helper functions and utilities
```

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
