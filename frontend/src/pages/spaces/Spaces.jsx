import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import CreateSpaceModal from '../../components/spaces/CreateSpaceModal';
import { useAuth } from '../../contexts/AuthContext';

// Simple Button component for reuse
const IconButton = ({ onClick, disabled = false, children, className = '', title = '' }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`p-1.5 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
    try {
      const response = await axios.get('/api/spaces');
      console.log('Spaces response:', response.data);
      setSpaces(response.data);
    } catch (err) {
      setError('Failed to fetch spaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async (spaceData) => {
    try {
      const response = await axios.post('/api/spaces', spaceData);
      setSpaces([...spaces, response.data]);
      setIsCreateModalOpen(false);
    } catch (err) {
      setError('Failed to create space');
    }
  };

  const handleDeleteSpace = async (spaceIdToDelete) => {
    if (window.confirm("Are you sure you want to delete this space? This will also delete all associated meetings, topics, documents, etc. This cannot be undone.")) {
      setDeletingSpaceId(spaceIdToDelete);
      setError('');
      try {
        await axios.delete(`/api/spaces/${spaceIdToDelete}`);
        setSpaces(currentSpaces => currentSpaces.filter(s => s.space_id !== spaceIdToDelete));
      } catch (err) {
        console.error("Error deleting space:", err);
        setError(err.response?.data?.message || 'Failed to delete space.');
      } finally {
        setDeletingSpaceId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse">Loading spaces...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Spaces</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Space
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => {
            const isAdmin = user?.id === space.admin_user_id;
            
            return (
              <div key={space.space_id} className="relative group">
                <Link
                  to={`/spaces/${space.space_id}`}
                  className="block hover:shadow-lg transition-shadow rounded-lg"
                >
                  <div className="card h-full hover:border-primary-500 border-2 border-transparent">
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      {space.space_name}
                    </h2>
                  </div>
                </Link>
                {isAdmin && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <IconButton
                      onClick={(e) => { 
                        e.stopPropagation();
                        handleDeleteSpace(space.space_id); 
                      }}
                      disabled={deletingSpaceId === space.space_id}
                      title="Delete Space"
                      className="text-red-500 hover:text-red-700 hover:bg-red-100"
                    >
                      {deletingSpaceId === space.space_id ? (
                        <div className="w-4 h-4 border-1 border-red-500 border-t-transparent rounded-full animate-spin"></div> 
                      ) : (
                        <TrashIcon className="h-4 w-4" />
                      )}
                    </IconButton>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <CreateSpaceModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateSpace}
        />
      </div>
    </div>
  );
}
