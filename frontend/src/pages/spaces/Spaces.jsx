import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
// Using Lucide icons as suggested, but Heroicons are fine if you prefer
// import { Plus, Trash2 } from 'lucide-react';
// Sticking with Heroicons as used in the original code
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CreateSpaceModal from '../../components/spaces/CreateSpaceModal';
import { useAuth } from '../../contexts/AuthContext';

// Simple Button component for reuse - Updated hover style
const IconButton = ({ onClick, disabled = false, children, className = '', title = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    // Updated default hover to light gray, padding adjusted, using rounded-full for icon buttons
    className={`p-1.5 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${className}`}
  >
    {children}
  </button>
);

export default function Spaces() {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const [deletingSpaceId, setDeletingSpaceId] = useState(null);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    setLoading(true); // Ensure loading is true at the start
    setError(''); // Clear previous errors
    try {
      const response = await axios.get('/api/spaces');
      console.log('Spaces response:', response.data);
      setSpaces(response.data);
    } catch (err) {
      console.error("Failed to fetch spaces:", err); // Log detailed error
      setError('Failed to fetch spaces. Please try again later.'); // User-friendly error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async (spaceData) => {
    // Add optimistic UI update or loading state if desired
    setError('');
    try {
      const response = await axios.post('/api/spaces', spaceData);
      setSpaces(currentSpaces => [...currentSpaces, response.data]); // Add new space to state
      setIsCreateModalOpen(false); // Close modal on success
    } catch (err) {
      console.error("Failed to create space:", err);
      // Provide more specific error feedback if possible from err.response.data
      setError(err.response?.data?.message || 'Failed to create space. Please check the details and try again.');
      // Optionally, keep the modal open on error:
      // setIsCreateModalOpen(true);
    }
  };

  const handleDeleteSpace = async (spaceIdToDelete) => {
    // Confirmation dialog
    if (window.confirm("Are you sure you want to delete this space? This will also delete all associated meetings, topics, documents, etc. This action cannot be undone.")) {
      setDeletingSpaceId(spaceIdToDelete); // Indicate deletion is in progress
      setError(''); // Clear previous errors
      try {
        await axios.delete(`/api/spaces/${spaceIdToDelete}`);
        // Update state by filtering out the deleted space
        setSpaces(currentSpaces => currentSpaces.filter(s => s.space_id !== spaceIdToDelete));
      } catch (err) {
        console.error("Error deleting space:", err);
        setError(err.response?.data?.message || 'Failed to delete space. Please try again.');
      } finally {
        setDeletingSpaceId(null); // Reset deletion indicator
      }
    }
  };

  // --- Loading State ---
  if (loading) {
    return (
      // White background instead of blue
      <div className="min-h-screen bg-white p-4 flex items-center justify-center">
        {/* Blue text */}
        <div className="animate-pulse text-blue-900 font-medium">Loading spaces...</div>
      </div>
    );
  }

  // --- Main Component Render ---
  return (
    // White background for the page
    <div className="min-h-screen bg-white">
      {/* Standard container */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">

        {/* Header Section */}
        <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
          {/* Header Typography */}
          <h1 className="text-2xl font-semibold text-blue-900">Spaces</h1>
          {/* Primary Button Style */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
            // Removed btn-primary, applied specific styles from guide
          >
            <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
            New Space
          </button>
        </div>

        {/* Error Message Area */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
             {/* Accent Red text color */}
            <div className="text-sm font-medium text-red-600">{error}</div>
          </div>
        )}

        {/* Spaces Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.length > 0 ? (
            spaces.map((space) => {
              const isAdmin = user?.id === space.admin_user_id;

              return (
                // Card Container with Group for Hover Effect
                <div key={space.space_id} className="relative group">
                  {/* Link wraps the card content */}
                  <Link
                    to={`/spaces/${space.space_id}`}
                    className="block rounded-lg overflow-hidden transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    // Added focus styles for accessibility
                  >
                    {/* Card Styling - Changed to blue-50 background */}
                    <div className="bg-blue-50 p-4 border border-blue-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-400 h-full">
                      {/* Header Typography for Card Title */}
                      <h2 className="text-lg font-medium text-blue-600 mb-1 truncate" title={space.space_name}>
                        {space.space_name}
                      </h2>
                      {/* Optional: Add subtle text if description exists */}
                      {/* <p className="text-sm text-gray-500">Optional description here</p> */}
                    </div>
                  </Link>

                  {/* Delete Button for Admins */}
                  {isAdmin && (
                    // Positioned top-right, revealed on group hover
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                      <IconButton
                        onClick={(e) => {
                          e.preventDefault(); // Prevent link navigation
                          e.stopPropagation(); // Prevent triggering other click events
                          handleDeleteSpace(space.space_id);
                        }}
                        disabled={deletingSpaceId === space.space_id}
                        title="Delete Space"
                        // Accent Red color for delete, light red background on hover
                        className="text-red-600 hover:bg-red-100 hover:text-red-700"
                      >
                        {/* Spinner during deletion */}
                        {deletingSpaceId === space.space_id ? (
                          // Spinner using Accent Red border
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          // Delete Icon
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </IconButton>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            // No Spaces Message - improved visibility
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10 px-4 bg-blue-50 rounded-lg border border-blue-200">
              {/* Empty state illustration could be added here */}
              <p className="text-blue-600 font-medium text-lg">No spaces found</p>
              <p className="text-gray-500 mt-2">Click "New Space" to create your first space</p>
            </div>
          )}
        </div>

        {/* Create Space Modal */}
        <CreateSpaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSpace}
          // Pass error state to modal if it can display errors
          // initialError={error && isCreateModalOpen ? error : ''}
        />
      </div>
    </div>
  );
}
