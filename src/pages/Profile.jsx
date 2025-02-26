import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="card">
          {/* Profile Header */}
          <div className="flex items-center space-x-6 pb-8 border-b border-gray-200">
            <div className="h-24 w-24 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-semibold">
              {user?.firstName[0]}
              {user?.lastName[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-lg text-gray-500 mt-1">{user?.role === 'driver' ? 'Driver' : 'Rider'}</p>
            </div>
          </div>

          {/* Profile Details */}
          <div className="mt-8 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
                    <p className="mt-1 text-lg text-gray-900">
                      {user?.firstName} {user?.lastName}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email Address</h3>
                    <p className="mt-1 text-lg text-gray-900">{user?.email}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                    <p className="mt-1 text-lg text-gray-900 capitalize">{user?.role}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="mt-1 text-lg">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {user?.role === 'driver' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Driver Information</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Rides</h3>
                      <p className="mt-1 text-lg text-gray-900">0 rides</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                      <p className="mt-1 text-lg text-gray-900">New Driver</p>
                    </div>
                  </div>
                  <div className="mt-6">
                    <Link 
                      to="/driver/dashboard" 
                      className="btn btn-primary w-full md:w-auto"
                    >
                      Go to Driver Dashboard
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {user?.role === 'rider' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Rider Information</h2>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Trips</h3>
                      <p className="mt-1 text-lg text-gray-900">0 trips</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Rating</h3>
                      <p className="mt-1 text-lg text-gray-900">New Rider</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 