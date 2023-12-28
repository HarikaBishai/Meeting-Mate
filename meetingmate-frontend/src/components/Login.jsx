import React, { useEffect, useState } from 'react';

function Login() {
  const [isLoading, setLoading] = useState(true);

  // Function to check if the user is already authenticated
  const checkAuthentication = async () => {
    try {
      const response = await fetch('http://localhost:3001/auth/isAuthenticated', {
        credentials: 'include', // Necessary for cookies to be sent
      });
      const data = await response.json();

      if (data.isAuthenticated) {
        // If the user is authenticated, redirect to the dashboard
        window.location.href = '/dashboard';
      } else {
        setLoading(false); // Show the login button if not authenticated
      }
    } 
    catch (error) {
      console.error('Error checking authentication:', error);
      // Redirect to the backend login route if the check fails
      // window.location.href = 'http://localhost:3001/auth/google';
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleLogin = () => {
    // Redirects the user to the backend login route
    window.location.href = 'http://localhost:3001/auth/google'; // Update with your actual backend URL

    // Check authentication after a short delay to give time for redirection and login
    setTimeout(() => {
      checkAuthentication();
    }, 3000); // Adjust the delay as needed based on your auth flow's typical speed
  };

  if (isLoading) {
    return <div>Loading...</div>; // Show loading state while checking auth
  }

  return (
    <div className="login-container">
      <h2>Welcome to MeetingMate</h2>
      <button onClick={handleLogin} className="login-button">Log in with Google</button>
    </div>
  );
}

export default Login;
