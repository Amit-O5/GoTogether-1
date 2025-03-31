import { Link } from 'react-router-dom';
import carImage from '../assets/car.svg';
import { 
  FaCar, FaShieldAlt, FaUserFriends, FaMoneyBillWave, FaLeaf, FaHandshake,
  FaMapMarkedAlt, FaCarSide, FaStar, FaArrowLeft, FaArrowRight 
} from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Reusable component for feature cards
const FeatureCard = ({ icon, title, description }) => (
  <div className="p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-500 hover:scale-105 min-h-[280px] sm:min-h-[320px] flex-1 border border-gray-100">
    <div className="flex flex-col items-center text-center">
      <div className="bg-[#4c48ec]/10 p-3 sm:p-4 rounded-2xl mb-4 sm:mb-6">
        {icon}
      </div>
      <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-[#010D3E]">{title}</h3>
      <p className="text-base sm:text-lg text-[#010D3E]/80 leading-relaxed flex-grow">{description}</p>
    </div>
  </div>
);

//Reusable
const HowItWorksStep = ({ icon, title, description }) => (
  <div className="group w-full max-w-md mx-auto p-6 sm:p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transform transition-all duration-500 hover:scale-105 border border-gray-100 relative overflow-hidden">
    {/* Background gradient effect */}
    <div className="absolute inset-0 bg-gradient-to-br from-[#4c48ec]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

    <div className="flex flex-col items-center text-center gap-3 sm:gap-4 relative z-10">
      {/* Icon container with animation */}
      <div className="bg-gradient-to-br from-[#4c48ec]/10 to-[#3b39d1]/10 p-4 sm:p-6 rounded-2xl mb-2 transform transition-transform duration-500 group-hover:scale-110">
        <div className="text-[#4c48ec] transform transition-transform duration-500 group-hover:scale-110">
          {icon}
        </div>
      </div>

      {/* Title with gradient text */}
      <h3 className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-[#4c48ec] to-[#3b39d1] bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Description with improved readability */}
      <p className="text-base sm:text-lg text-[#010D3E]/80 leading-relaxed flex-grow max-w-sm">
        {description}
      </p>
    </div>
  </div>
);

export const Landing = () => {
  // Feature list for the carousel
  const features = [
    {
      icon: <FaCar className="text-4xl text-[#4c48ec]" />,
      title: "Share Rides",
      description: "Find travel companions and split costs on your journeys. Make your trips more affordable and enjoyable."
    },
    {
      icon: <FaShieldAlt className="text-4xl text-[#4c48ec]" />,
      title: "Safe & Secure",
      description: "Travel with confidence using our verified user system and secure payment processing."
    },
    {
      icon: <FaUserFriends className="text-4xl text-[#4c48ec]" />,
      title: "Community Driven",
      description: "Join a friendly community of travelers. Rate and review your experience after each ride."
    },
    {
      icon: <FaMoneyBillWave className="text-4xl text-[#4c48ec]" />,
      title: "Cost Effective",
      description: "Save money on your travels by sharing expenses with fellow travelers."
    },
    {
      icon: <FaLeaf className="text-4xl text-[#4c48ec]" />,
      title: "Eco-Friendly",
      description: "Reduce your carbon footprint by sharing rides and contributing to a greener environment."
    },
    {
      icon: <FaHandshake className="text-4xl text-[#4c48ec]" />,
      title: "Reliable Partners",
      description: "Connect with verified and trustworthy travel companions for a worry-free journey."
    }
  ];

  // Steps for "How It Works"
  const howItWorks = [
    {
      icon: <FaMapMarkedAlt className="text-4xl text-[#4c48ec]" />,
      title: "Plan Your Journey",
      description: "Enter your destination and travel dates to find available rides or post your own journey."
    },
    {
      icon: <FaUserFriends className="text-4xl text-[#4c48ec]" />,
      title: "Connect with Travelers",
      description: "Browse through profiles, check reviews, and connect with compatible travel companions."
    },
    {
      icon: <FaCarSide className="text-4xl text-[#4c48ec]" />,
      title: "Share the Ride",
      description: "Confirm your booking, meet your travel buddies, and split the costs fairly."
    },
    {
      icon: <FaStar className="text-4xl text-[#4c48ec]" />,
      title: "Rate & Review",
      description: "After your journey, rate your experience and help build a trusted community."
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Modified carousel logic to create a smooth forward-only loop
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        // When we reach the end, smoothly transition back to the beginning
        if (nextIndex >= features.length) {
          return 0;
        }
        return nextIndex;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Calculate the transform value for smooth transition
  const getTransformValue = () => {
    // Different card widths for different screen sizes
    const cardWidth = window.innerWidth < 640 ? 100 : // Full width on mobile
                     window.innerWidth < 1024 ? 50 : // Half width on tablet
                     33.33; // One-third width on desktop
    
    const totalWidth = features.length * cardWidth;
    const currentPosition = currentIndex * cardWidth;
    
    // If we're at the end, smoothly transition back to the beginning
    if (currentIndex >= features.length - (window.innerWidth < 640 ? 1 : 
                                        window.innerWidth < 1024 ? 2 : 3)) {
      return `translateX(-${totalWidth - (window.innerWidth < 640 ? cardWidth : 
                                        window.innerWidth < 1024 ? cardWidth * 2 : 
                                        cardWidth * 3)}%)`;
    }
    
    return `translateX(-${currentPosition}%)`;
  };

  // Quick action buttons for logged-in users
  const quickActions = [
    {
      icon: <FaMapMarkedAlt className="h-6 w-6" />,
      title: "Find a Ride",
      description: "Search for available rides",
      action: () => navigate('/rides'),
      color: "bg-indigo-500"
    },
    {
      icon: <FaCarSide className="h-6 w-6" />,
      title: "Offer a Ride",
      description: "Share your journey",
      action: () => navigate('/rides/create'),
      color: "bg-green-500"
    },
    {
      icon: <FaUserFriends className="h-6 w-6" />,
      title: "My Rides",
      description: "View your rides",
      action: () => navigate('/my-rides'),
      color: "bg-blue-500"
    }
  ];

  return (
    <section className="min-h-screen bg-white relative overflow-hidden h-full w-full">
      <div className="absolute inset-0 bg-[#4c48ec]/5" />
      <div className="container px-4 sm:px-6 lg:px-20 max-w-full h-full flex flex-col items-center flex-grow">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 relative w-full h-full flex-grow py-8 sm:py-12 lg:py-0">
          <div className="w-full lg:w-[500px] z-10 relative text-center lg:text-left">
            {isAuthenticated ? (
              <>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-[#010D3E] mt-4 sm:mt-6">
                  Welcome back, {user?.firstName || 'Traveler'}!
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-[#010D3E] tracking-tight mt-4 sm:mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Ready for your next journey? Find a ride or share your own with the community.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className={`${action.color} text-white p-4 rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 flex flex-col items-center text-center`}
                    >
                      <div className="p-3 bg-white/20 rounded-full mb-2">
                        {action.icon}
                      </div>
                      <h3 className="font-semibold">{action.title}</h3>
                      <p className="text-sm text-white/80 mt-1">{action.description}</p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-[#010D3E] mt-4 sm:mt-6">
                  Welcome to GoTogether
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-[#010D3E] tracking-tight mt-4 sm:mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Share rides, reduce costs, and make new connections. Join our community of travelers making transportation more sustainable and social.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center mt-6 sm:mt-8 lg:mt-10">
                  <Link
                    to="/register"
                    className="w-full sm:w-auto bg-[#4c48ec] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold inline-flex items-center justify-center tracking-tight hover:bg-[#3b39d1] transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
                    aria-label="Get Started with GoTogether"
                  >
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="w-full sm:w-auto bg-white text-[#4c48ec] px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold inline-flex items-center justify-center tracking-tight gap-2 hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl border border-[#4c48ec]/20 text-sm sm:text-base"
                    aria-label="Sign In to GoTogether"
                  >
                    <span>Sign In</span>
                    <FaArrowRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </Link>
                </div>
              </>
            )}
          </div>
          <div className="w-full sm:w-[90%] lg:w-[55%] mx-auto relative flex justify-center items-center min-h-[300px] sm:min-h-[400px] h-full">
            <img
              src={carImage}
              alt="Illustrative car graphic"
              className="w-full h-auto object-contain max-w-[400px] sm:max-w-[500px] lg:max-w-[700px] drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Features Carousel Section */}
      {!isAuthenticated && (
        <div className="mt-20 sm:mt-24 lg:mt-40 px-4">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 text-[#010D3E]">
            Why Choose GoTogether?
          </h2>
          <p className="text-center text-lg sm:text-xl text-[#010D3E]/80 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto px-4">
            Experience the future of shared transportation
          </p>
          <div className="max-w-7xl mx-auto relative">
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-1000 ease-in-out"
                style={{ transform: getTransformValue() }}
              >
                {features.map((feature, index) => (
                  <div key={index} className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-4">
                    <FeatureCard 
                      icon={feature.icon} 
                      title={feature.title} 
                      description={feature.description} 
                    />
                  </div>
                ))}
                {/* Duplicate first few cards for smooth loop */}
                {features.slice(0, window.innerWidth < 640 ? 1 : 
                                  window.innerWidth < 1024 ? 2 : 3).map((feature, index) => (
                  <div key={`duplicate-${index}`} className="w-full sm:w-1/2 lg:w-1/3 flex-shrink-0 px-2 sm:px-4">
                    <FeatureCard 
                      icon={feature.icon} 
                      title={feature.title} 
                      description={feature.description} 
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Dot Navigation */}
            <div className="flex justify-center mt-6 sm:mt-8 gap-2 sm:gap-3">
              {Array.from({ length: features.length }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`View slide ${index + 1}`}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                    currentIndex === index 
                      ? 'bg-[#4c48ec] w-6 sm:w-8' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* How It Works Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <div className="mt-20 sm:mt-24 lg:mt-40 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-[#4c48ec]/5 to-transparent rounded-3xl -mx-4 -my-8" />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center mb-3 sm:mb-4 bg-gradient-to-r from-[#4c48ec] to-[#3b39d1] bg-clip-text text-transparent">
              How GoTogether Works
            </h2>
            <p className="text-center text-lg sm:text-xl text-[#010D3E]/80 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto px-4">
              Get started with GoTogether in four simple steps
            </p>
            <div className="max-w-6xl mx-auto px-2 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {howItWorks.map((step, index) => (
                <HowItWorksStep
                  key={index}
                  icon={step.icon}
                  title={step.title}
                  description={step.description}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CTA Footer Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-[#4c48ec] text-white py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">Ready to Start Sharing?</h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-white/90">Join thousands of travelers making their journeys more sustainable and social.</p>
            <Link
              to="/register"
              className="inline-block bg-white text-[#4c48ec] px-6 sm:px-8 lg:px-10 py-3 sm:py-4 rounded-xl font-semibold hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Join Now - It's Free!
            </Link>
          </div>
        </div>
      )}
    </section>
  );
};

export default Landing;
