import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import BilingualMeeting from '../../components/meetings/BilingualMeeting';

export default function MeetingDetail() {
  const { spaceId, meetingId } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMeetingData();
  }, [meetingId]);

  const fetchMeetingData = async () => {
    try {
      const response = await axios.get(`/api/spaces/${spaceId}/meetings/${meetingId}`);
      setMeeting(response.data);
    } catch (err) {
      setError('Failed to fetch meeting data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMeeting = async (updatedMeeting) => {
    try {
      const response = await axios.put(`/api/spaces/${spaceId}/meetings/${meetingId}`, updatedMeeting);
      setMeeting(response.data);
    } catch (err) {
      setError('Failed to update meeting');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="animate-pulse">Loading meeting...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="text-red-600">Meeting not found</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    );
  }

  return <BilingualMeeting meeting={meeting} onUpdateMeeting={handleUpdateMeeting} />;
}
