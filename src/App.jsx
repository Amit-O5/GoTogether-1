import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Rides from './pages/Rides';
import CreateRide from './pages/CreateRide';
import EditRide from './pages/EditRide';
import RideDetail from './pages/RideDetail';
import Profile from './pages/Profile';
import MyRides from './pages/MyRides';
import RideRequests from './pages/RideRequests';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Rides />} />
              <Route path="/rides" element={<Rides />} />
              <Route path="/rides/:id" element={<RideDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route
                path="/rides/create"
                element={
                  <PrivateRoute>
                    <CreateRide />
                  </PrivateRoute>
                }
              />
              <Route
                path="/rides/edit/:id"
                element={
                  <PrivateRoute>
                    <EditRide />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-rides"
                element={
                  <PrivateRoute>
                    <MyRides />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ride-requests"
                element={
                  <PrivateRoute>
                    <RideRequests />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
