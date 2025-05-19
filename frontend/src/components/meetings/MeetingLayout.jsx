import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SectionHeader, ContentBox } from './MeetingComponents';
import AttendanceSection from './AttendanceSection';
import MainMeetingContent from './MainMeetingContent';
import TopicsSection from './TopicsSection';
import axios from 'axios';

const staticTranslations = {
  EN: {
    attendance: "Attendance",
    liveTranscription: "Transcription",
    aiSummary: "Summary",
    followUpTasks: "Follow-up Tasks",
    topics: "Topics",
    addTopic: "Add Topic",
    documents: "Documents",
    upload: "Upload",
    download: "Download",
    delete: "Delete",
    voting: "Voting",
    comments: "Comments",
  }
};

export default function MeetingLayout({
  meeting,
  attendanceList,
  attendanceLoading,
  attendanceError,
  topics,
  topicsLoading,
  topicsError,
  showAddTopicInput,
  setShowAddTopicInput,
  newTopicTitle,
  setNewTopicTitle,
  isAddingTopic,
  handleAddTopic,
  handleMarkAttendance,
  isCurrentUserSpaceAdmin,
  fetchTopics
}) {
  const navigate = useNavigate();
  const t = staticTranslations.EN;

  const handleStatusChange = async (newStatus) => {
    if (!meeting?.meeting_id || !meeting?.space_id) return;
    
    try {
      await axios.put(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/status`, {
        status: newStatus
      });
      // Refresh the meeting data to show updated status
      window.location.reload();
    } catch (err) {
      console.error("Error updating meeting status:", err);
      alert(err.response?.data?.message || 'Failed to update meeting status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    try {
      return new Date(dateString).toLocaleString('en-US', {
        dateStyle: 'medium', timeStyle: 'short'
      });
    } catch (e) {
      console.error("Error formatting date:", dateString, e);
      return 'Invalid Date';
    }
  };

  const parseTasks = (tasksString) => {
    if (!tasksString || typeof tasksString !== 'string') return [];
    return tasksString.split('\n').map((line, idx) => {
      const text = line.replace(/^-\s*/, '').trim();
      const ownerMatch = text.match(/\(@(.*?)\)\)/);
      const deadlineMatch = text.match(/\[(.*?)\]/);
      const mainText = text.replace(/\(.*?\)\)/g, '').replace(/\[.*?\]/g, '').trim();
      return {
        id: idx,
        text: mainText || 'Invalid task format',
        owner: ownerMatch ? ownerMatch[1] : 'N/A',
        deadline: deadlineMatch ? deadlineMatch[1] : 'N/A',
        checked: false
      };
    }).filter(task => task.text && task.text !== 'Invalid task format');
  };

  const meetingTasks = parseTasks(meeting?.follow_ups);

  const formatCommentTimestamp = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffSeconds = Math.round((now - date) / 1000);
      const diffMinutes = Math.round(diffSeconds / 60);
      const diffHours = Math.round(diffMinutes / 60);
      const diffDays = Math.round(diffHours / 24);

      if (diffSeconds < 60) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-US');
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50" dir={'ltr'}>
      <div className="w-full h-screen rounded-2xl overflow-hidden shadow-2xl border border-blue-200">
        <div className="p-6 bg-white flex items-center justify-between border-b border-blue-200 shadow-sm flex-wrap gap-y-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              title="Go Back"
              className="p-2 rounded text-blue-700 hover:bg-gray-100 hover:text-blue-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <h1 className="text-xl font-bold text-blue-900">{meeting?.title || 'Meeting Title'}</h1>
              {meeting?.status && (
                <div className="flex items-center gap-2">
                  {/* <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    {meeting.status}
                  </span> */}
                  {isCurrentUserSpaceAdmin && (
                    <select
                      value={meeting.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="text-xs border border-blue-200 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Concluded">Concluded</option>
                    </select>
                  )}
                </div>
              )}
              <span className="text-sm text-blue-700">{formatDate(meeting?.scheduled_time)}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
          <Link
            to={`/spaces/${meeting?.space_id}/meetings/${meeting?.meeting_id}/recording`}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors border border-blue-300 px-3 py-1 rounded-md hover:bg-blue-100"
          >
            Screen Recording
          </Link>
          </div>
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-96px)]">
          <AttendanceSection 
            t={t}
            attendanceList={attendanceList}
            attendanceLoading={attendanceLoading}
            attendanceError={attendanceError}
            isCurrentUserSpaceAdmin={isCurrentUserSpaceAdmin}
            handleMarkAttendance={handleMarkAttendance}
          />

          <MainMeetingContent 
            t={t}
            meeting={meeting}
            meetingTasks={meetingTasks}
          />
          
          <TopicsSection
            t={t} 
            meeting={meeting} 
            topics={topics}
            topicsLoading={topicsLoading}
            topicsError={topicsError}
            showAddTopicInput={showAddTopicInput}
            setShowAddTopicInput={setShowAddTopicInput}
            newTopicTitle={newTopicTitle}
            setNewTopicTitle={setNewTopicTitle}
            isAddingTopic={isAddingTopic}
            handleAddTopic={handleAddTopic}
            setTopicsError={() => {}}
            fetchTopics={fetchTopics}
            formatCommentTimestamp={formatCommentTimestamp}
            isCurrentUserSpaceAdmin={isCurrentUserSpaceAdmin}
          /> 
        </div>
      </div>
    </div>
  );
} 