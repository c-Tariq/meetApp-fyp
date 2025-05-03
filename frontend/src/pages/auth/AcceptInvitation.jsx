import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function AcceptInvitation() {
  const { token, spaceId } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const acceptInvite = async () => {
      setLoading(true);
      setError('');
      setStatus('Verifying');

      if (!token || !spaceId) {
        setStatus('Invalid');
        setError('Missing invitation details in the link.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`/api/spaces/${spaceId}/members/accept/${token}`);
        
        setStatus('Success');
        setError('');

        setTimeout(() => {
            navigate(`/spaces/${spaceId}`);
        }, 3000);

      } catch (err) {
         console.error("Accept Invitation Error:", err);
         const message = err.response?.data?.message || 'An unexpected error occurred. Please try again later.';
         setError(message);

         if (err.response?.status === 401) {
             setStatus('LoginRequired');
         } else if (err.response?.status === 400 || err.response?.status === 403 || err.response?.status === 404) {
             setStatus('Invalid'); 
         } else {
             setStatus('Error');
         }
      } finally {
        setLoading(false);
      }
    };

    acceptInvite();
  }, [token, spaceId, navigate]);

  const renderContent = () => {
    if (loading) {
      return <p className="text-center text-gray-600">Verifying your invitation...</p>;
    }

    switch (status) {
      case 'Success':
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Invitation Accepted!</h3>
            <p className="text-gray-600">You have successfully joined the space. Redirecting...</p>
            <p className="mt-4 text-sm"> If you are not redirected, please navigate to the <Link to={`/spaces/${spaceId}`} className="font-medium text-primary-600 hover:text-primary-500">space page</Link>.</p>
          </div>
        );
      case 'LoginRequired':
         return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-orange-700 mb-2">Login Required</h3>
            <p className="text-gray-600">{error}</p>
             <p className="mt-4">Please <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">log in</Link> and try the link again.</p>
          </div>
        );
      case 'Invalid':
         return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Invitation Issue</h3>
            <p className="text-gray-600">{error || 'This invitation link cannot be used.'}</p>
             <p className="mt-4">This might be because the invitation is invalid, expired, for a different user, or you are already a member. Please contact the space administrator if you believe this is an error.</p>
          </div>
        );
      case 'Error':
      default:
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Error Accepting Invitation</h3>
            <p className="text-gray-600">{error}</p>
            <p className="mt-4">Please try again later or contact support.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 card">
         {renderContent()}
      </div>
    </div>
  );
}