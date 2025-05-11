import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { PlusIcon, UserPlusIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline';
import CreateMeetingModal from '../../components/meetings/CreateMeetingModal';
import InviteMembersModal from '../../components/spaces/InviteMembersModal';
import { useAuth } from '../../contexts/AuthContext';

// Simple Button component for reuse (copied from Spaces.jsx for consistency)
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

export default function SpaceDetail() {
  const { spaceId } = useParams();
  const { user } = useAuth();
  const [space, setSpace] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreateMeetingModalOpen, setIsCreateMeetingModalOpen] = useState(false);
  const [isInviteMembersModalOpen, setIsInviteMembersModalOpen] = useState(false);
  const [deletingMeetingId, setDeletingMeetingId] = useState(null);

  useEffect(() => {
    fetchSpaceData();
  }, [spaceId]);

  const fetchSpaceData = async () => {
    try {
      const [spaceRes, meetingsRes, membersRes] = await Promise.all([
        axios.get(`/api/spaces/${spaceId}`),
        axios.get(`/api/spaces/${spaceId}/meetings`),
        axios.get(`/api/spaces/${spaceId}/members`),
      ]);
      setSpace(spaceRes.data);

      // --- Sort meetings by status ---
      const statusOrder = {
        'Scheduled': 1,
        'Ongoing': 2, // Assuming 'Ongoing' or similar exists
        'In Progress': 2, // Assuming 'In Progress' or similar exists
        'Completed': 3,
        'Cancelled': 4,
        // Add other statuses here if needed, assigning them a higher number
      };
      const sortedMeetings = meetingsRes.data.sort((a, b) => {
        const orderA = statusOrder[a.status] || 99; // Default to end if status unknown
        const orderB = statusOrder[b.status] || 99;
        // Optional: Add secondary sort by date if statuses are the same
        if (orderA === orderB) {
            return new Date(a.scheduled_time) - new Date(b.scheduled_time); // Earlier meetings first
        }
        return orderA - orderB;
      });
      // -----------------------------

      setMeetings(sortedMeetings); // Set the sorted array
      setMembers(membersRes.data);
    } catch (err) {
      setError('Failed to fetch space data');
      console.error("Error fetching space data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (meetingData) => {
    try {
      const response = await axios.post(`/api/spaces/${spaceId}/meetings`, meetingData);
      setMeetings([...meetings, response.data]);
      setIsCreateMeetingModalOpen(false);
      setSuccess('Meeting created successfully');
    } catch (err) {
      setError('Failed to create meeting');
    }
  };

  const handleDeleteMeeting = async (meetingIdToDelete) => {
    if (window.confirm("Are you sure you want to delete this meeting? This will also delete associated topics, comments, documents, etc. This action cannot be undone.")) {
      setDeletingMeetingId(meetingIdToDelete);
      setError('');
      setSuccess('');
      try {
        await axios.delete(`/api/spaces/${spaceId}/meetings/${meetingIdToDelete}`);
        setMeetings(currentMeetings => currentMeetings.filter(m => m.meeting_id !== meetingIdToDelete));
        setSuccess('Meeting deleted successfully.');
      } catch (err) {
        console.error("Error deleting meeting:", err);
        setError(err.response?.data?.message || 'Failed to delete meeting.');
        setSuccess('');
      } finally {
        setDeletingMeetingId(null);
      }
    }
  };

  const handleInviteMembers = async (email) => {
    try {
      // First check if the user exists
      const response = await axios.post(`/api/spaces/${spaceId}/members/invite`, { email });
      setIsInviteMembersModalOpen(false);
      setSuccess('Invitation sent successfully');
      setError('');
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // User not found, but we can still send an invitation
        try {
          // You might need a different endpoint for inviting non-existent users
          const inviteResponse = await axios.post(`/api/spaces/${spaceId}/members/invite-new`, { email });
          setIsInviteMembersModalOpen(false);
          setSuccess('Invitation sent to new user');
          setError('');
        } catch (inviteErr) {
          setError('Failed to invite new user: ' + (inviteErr.response?.data?.message || 'Unknown error'));
          setSuccess('');
        }
      } else {
        setError('Failed to invite member: ' + (err.response?.data?.message || 'Unknown error'));
        setSuccess('');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="animate-pulse text-blue-600">Loading space...</div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="text-red-600">Space not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-6 sm:px-8 lg:px-8">
        <div className="px-4 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-blue-600">{space.name}</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setIsInviteMembersModalOpen(true)}
                className="bg-blue-50 border border-blue-600 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-md shadow-sm inline-flex items-center transition-colors"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Invite Members
              </button>
              <button
                onClick={() => setIsCreateMeetingModalOpen(true)}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md shadow-sm inline-flex items-center transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Meeting
              </button>
            </div>
          </div>

          {success && (
            <div className="rounded-md bg-green-50 p-4 mb-6 border border-green-200">
              <div className="text-sm text-green-600">{success}</div>
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-4 mb-6 border border-red-200">
              <div className="text-sm text-red-600">{error}</div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-100 min-h-[600px] ">
                <h2 className="text-lg font-medium text-blue-900 mb-4">Meetings</h2>
                <div className="space-y-4">
                  {meetings.length === 0 ? (
                    <p className="text-gray-500">No meetings scheduled yet.</p>
                  ) : (
                    meetings.map((meeting) => {
                      const isSpaceAdmin = user && space && user.id === space.admin_user_id;
                      return (
                        <div key={meeting.meeting_id} className="relative group">
                          <Link
                            to={`/spaces/${spaceId}/meetings/${meeting.meeting_id}`}
                            className="block hover:shadow-md transition-shadow rounded-lg"
                          >
                            <div className="bg-white p-4 rounded-lg hover:border-blue-600 border-2 border-transparent flex justify-between items-start">
                              <div>
                                <h3 className="text-lg font-medium text-blue-600 mb-1">
                                  {meeting.title}
                                </h3>
                                <div className="text-sm text-gray-500">
                                  {new Date(meeting.scheduled_time).toLocaleString()}
                                </div>
                              </div>
                              <div className="mt-1 flex-shrink-0 ml-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    meeting.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' :
                                    meeting.status === 'Ongoing' || meeting.status === 'In Progress' ? 'bg-green-100 text-green-600' :
                                    meeting.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                                    meeting.status === 'Cancelled' ? 'bg-red-100 text-red-600' :
                                    'bg-amber-100 text-amber-600' // Default/Unknown status
                                  }`}>
                                  {meeting.status || 'Unknown'}
                                </span>
                              </div>
                            </div>
                          </Link>
                          {isSpaceAdmin && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <IconButton
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteMeeting(meeting.meeting_id);
                                }}
                                disabled={deletingMeetingId === meeting.meeting_id}
                                title="Delete Meeting"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                {deletingMeetingId === meeting.meeting_id ? (
                                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <TrashIcon className="h-4 w-4" />
                                )}
                              </IconButton>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-blue-50 rounded-lg shadow-sm p-6 border border-blue-100 min-h-[600px]">
                <h2 className="text-lg font-medium text-blue-900 mb-4">Members</h2>
                <div className="space-y-4">
                  {members.map((member) => {
                    // Check if this member is the admin of the space
                    const isSpaceAdmin = space && member.user_id === space.admin_user_id;

                    return (
                      <div key={member.user_id} className="flex items-center space-x-3"> 
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-blue-600">
                            {member.member_name}
                            {isSpaceAdmin && <span className="ml-1 text-xs text-teal-600 font-normal">(Admin)</span>}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <CreateMeetingModal
          isOpen={isCreateMeetingModalOpen}
          onClose={() => setIsCreateMeetingModalOpen(false)}
          onSubmit={handleCreateMeeting}
        />

        <InviteMembersModal
          isOpen={isInviteMembersModalOpen}
          onClose={() => setIsInviteMembersModalOpen(false)}
          onSubmit={handleInviteMembers}
        />
      </div>
    </div>
  );
}