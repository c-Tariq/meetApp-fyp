import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';


export default function AcceptInvitation() {
  const { token } = useParams();
  const { spaceId } = useParams();
  
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying invitation...');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const acceptInvite = async () => {
      if (!token) {
        console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        setStatus('Invalid');
        setError('No invitation token provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(''); // Clear previous errors

      try {
        const response = await axios.get(`/spaces/${spaceId}/members/accept/${token}`);
        if (response.data.success) {
            console.log("xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
            setStatus('Success');
            setTimeout(() => {
                navigate('/login'); // Or navigate to the dashboard/space if appropriate
            }, 3000); // 3-second delay
        } else {
            console.log("xxxxxxxxxxxxxxxxxxxxxxxdddxxxxxxxxxxxxxxxxxxxxxxxxxxx")

            setStatus('Error');
            setError(response.data.message || 'Failed to accept invitation.');
        }
      } catch (err) {
         console.error("Accept Invitation Error:", err);
         setStatus('Error');
         if (err.response && err.response.data && err.response.data.message) {
             setError(err.response.data.message);
             if (err.response.status === 404 || err.response.status === 400) {
                 setStatus('Invalid'); 
             }
         } else {
             setError('An unexpected error occurred. Please try again later.');
         }
      } finally {
        setLoading(false);
      }
    };

    acceptInvite();
  }, [token, navigate]);

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-gray-600">Verifying your invitation...</p>;
    }

    switch (status) {
      case 'Success':
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Invitation Accepted!</h3>
            <p className="text-gray-600">You have successfully joined the space. You will be redirected shortly.</p>
            <p className="mt-4"> If you are not redirected, please <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">login here</Link>.</p>
          </div>
        );
      case 'Invalid':
      case 'Expired':
         return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Invalid or Expired Invitation</h3>
            <p className="text-gray-600">{error || 'This invitation link is either invalid or has expired.'}</p>
             <p className="mt-4">Please request a new invitation or <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">sign up</Link>.</p>
          </div>
        );
      case 'Error':
      default:
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Error Accepting Invitation</h3>
            <p className="text-gray-600">{error || 'Something went wrong while trying to accept the invitation.'}</p>
            <p className="mt-4">Please try again later.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 card"> {/* Using .card for consistent styling [cite: 293] */}
         {renderContent()}
      </div>
    </div>
  );
}