import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// import BilingualMeeting from '../../components/meetings/BilingualMeeting'; // Old import
import MeetingLayout from '../../components/meetings/MeetingLayout'; // New import
import { useAuth } from '../../contexts/AuthContext';

export default function MeetingDetail() {
  const { spaceId, meetingId } = useParams();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState('');

  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  
  const isCurrentUserSpaceAdmin = user && meeting && user.id === meeting.admin_user_id;

  const fetchMeetingData = async () => {
    try {
      const response = await axios.get(`/api/spaces/${spaceId}/meetings/${meetingId}`);
      setMeeting(response.data);
    } catch (err) {
      setError('Failed to fetch meeting data');
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    if (!meeting || !meeting.space_id || !meeting.meeting_id) return;
    setAttendanceLoading(true);
    setAttendanceError('');
    try {
      const response = await axios.get(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/attendance`);
      setAttendanceList(response.data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendanceError('Failed to load attendance.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchTopics = async () => {
    if (!meeting || !meeting.space_id || !meeting.meeting_id) return;
    setTopicsLoading(true);
    setTopicsError('');
    try {
      const response = await axios.get(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics`);
      setTopics(response.data);
    } catch (err) {
      console.error("Error fetching topics:", err);
      setTopicsError('Failed to load topics.');
    } finally {
      setTopicsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMeetingData();
  }, [spaceId, meetingId]);

  useEffect(() => {
    if (meeting && meeting.meeting_id) {
      fetchAttendance();
      fetchTopics();
    }
  }, [meeting]);

  useEffect(() => {
    if (!attendanceLoading && !topicsLoading && meeting) {
      setLoading(false);
    }
  }, [attendanceLoading, topicsLoading, meeting]);

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !meeting?.meeting_id || !meeting?.space_id) return;
    
    setIsAddingTopic(true);
    setTopicsError('');
    try {
      await axios.post(
        `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics`,
        { topic_title: newTopicTitle.trim() }
      );
      setNewTopicTitle('');
      setShowAddTopicInput(false);
      fetchTopics();
    } catch (err) {
      console.error("Error adding topic:", err);
      setTopicsError(err.response?.data?.message || 'Failed to add topic.');
    } finally {
      setIsAddingTopic(false);
    }
  };

  const handleMarkAttendance = async (targetUserId, newStatus) => {
    if (!meeting?.meeting_id || !meeting?.space_id || targetUserId === undefined) return;

    const userIndex = attendanceList.findIndex(a => a.user_id === targetUserId);
    if (userIndex === -1) return;

    const previousStatus = attendanceList[userIndex].is_present;
    
    setAttendanceList(currentList => 
        currentList.map((item, index) => 
            index === userIndex ? { ...item, is_present: newStatus } : item
        )
    );
    setAttendanceError('');
    
    try {
        await axios.post(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/attendance`, { 
            isPresent: newStatus,
            targetUserId: targetUserId 
        });
    } catch (err) {
        console.error("Error marking attendance:", err);
        setAttendanceError(err.response?.data?.message || 'Failed to update attendance.');
        setAttendanceList(currentList => 
            currentList.map((item, index) => 
                index === userIndex ? { ...item, is_present: previousStatus } : item
            )
        );
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

  return <MeetingLayout 
            meeting={meeting} 
            attendanceList={attendanceList}
            attendanceLoading={attendanceLoading}
            attendanceError={attendanceError}
            topics={topics}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            showAddTopicInput={showAddTopicInput}
            setShowAddTopicInput={setShowAddTopicInput}
            newTopicTitle={newTopicTitle}
            setNewTopicTitle={setNewTopicTitle}
            isAddingTopic={isAddingTopic}
            handleAddTopic={handleAddTopic}
            handleMarkAttendance={handleMarkAttendance}
            isCurrentUserSpaceAdmin={isCurrentUserSpaceAdmin}
            fetchTopics={fetchTopics}
          />;
}
