import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ScreenRecorder from './ScreenRecorder';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Download, Trash2, Copy, X, Plus, FileText, MessageSquare, Send, ChevronDown, ChevronUp, UploadCloud, Paperclip, CheckSquare, ThumbsUp, Save, Ban, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Utility Components
const SectionHeader = ({ title, children }) => (
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-semibold text-lg text-blue-900">{title}</h2>
    {children}
  </div>
);

const ContentBox = ({ children, dir }) => (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-[250px] overflow-y-auto [&::-webkit-scrollbar]:hidden" dir={dir}>
    {children}
  </div>
);

// Updated IconButton to handle onClick, disabled, title, and add styling
const IconButton = ({ icon, color = 'gray', onClick, disabled, title }) => (
  <button
    type="button" // Add type="button" to prevent potential form submission issues
    onClick={onClick} 
    disabled={disabled} 
    title={title} 
    className={`p-1 rounded text-${color}-500 hover:bg-gray-100 hover:text-${color === 'gray' ? 'red-500' : color}-700 transition disabled:opacity-50 disabled:cursor-not-allowed`}
  >
    {icon}
  </button>
);

// --- Poll Option Component ---
function PollOption({ option, results, totalVotes, userVoteOptionId, pollId, topicId, meetingId, spaceId, onVote, disabled, isSpaceAdmin, onOptionDeleted }) {
  const isSelected = userVoteOptionId === option.option_id;
  const votesForOption = results?.find(r => r.option_id === option.option_id)?.vote_count || 0;
  const percentage = totalVotes > 0 ? ((votesForOption / totalVotes) * 100).toFixed(0) : 0;
  const [isDeletingOption, setIsDeletingOption] = useState(false);

  const handleDeleteOption = async (e) => {
      e.stopPropagation(); // Prevent voting when clicking delete
      e.preventDefault();

      if (!window.confirm(`Are you sure you want to delete the option: "${option.option_text}"? This may affect existing votes.`)) return;

      setIsDeletingOption(true);
      try {
          await axios.delete(`/api/spaces/${spaceId}/meetings/${meetingId}/topics/${topicId}/polls/${pollId}/options/${option.option_id}`);
          if (onOptionDeleted) {
              onOptionDeleted(option.option_id); // Notify parent (Poll component) to refetch
          }
      } catch (err) {
          console.error("Error deleting poll option:", err);
          alert(err.response?.data?.message || 'Failed to delete option.'); // Simple alert for now
          setIsDeletingOption(false); 
      } 
  };

  return (
    <div className="relative group">
    <button
      onClick={() => onVote(option.option_id)}
          disabled={disabled || isDeletingOption}
          className={`w-full p-2 text-left text-sm rounded-md border mb-2 transition ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-gray-300 bg-white hover:bg-gray-50'} ${isDeletingOption ? 'opacity-50 cursor-not-allowed' : ''} disabled:opacity-70 disabled:cursor-not-allowed relative pl-6`}
    >
      <div className="flex justify-between items-center z-10 relative">
        <span className={`${isSelected ? 'font-semibold text-blue-800' : 'text-gray-700'}`}>{option.option_text}</span>
        {results && (
           <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-gray-500'}`}>{votesForOption} vote{votesForOption !== 1 ? 's' : ''} ({percentage}%)</span> 
        )}
      </div>
      {results && (
         <div 
            className="absolute top-0 left-0 h-full bg-blue-200 rounded-md transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
         ></div> 
      )}
    </button>

        {/* Delete Option Button - Absolutely positioned, visible on hover */}
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <IconButton
                icon={<X className="w-3 h-3"/>}
                color="red"
                onClick={handleDeleteOption}
                disabled={isDeletingOption}
                title="Delete Option"
            />
        </div> 
    </div>
  );
}
// --- End Poll Option Component ---

// --- Poll Component ---
function Poll({ poll, meeting, onVoteSuccess, isSpaceAdmin, onPollDeleted }) {
  const [options, setOptions] = useState([]);
  const [results, setResults] = useState(null); // null initially, array when loaded
  const [userVoteOptionId, setUserVoteOptionId] = useState(null); // null if not voted, option_id if voted
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isVoting, setIsVoting] = useState(false);
  
  // State for adding new options
  const [newOptionText, setNewOptionText] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [addOptionError, setAddOptionError] = useState('');

  const apiUrlBase = `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${poll.topic_id}/polls/${poll.poll_id}`;

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [optionsRes, resultsRes, voteStatusRes] = await Promise.all([
        axios.get(`${apiUrlBase}/options`), 
        axios.get(`${apiUrlBase}/aggregated-results`), 
        axios.get(`${apiUrlBase}/vote-status`) // Assuming this exists now
      ]);
      setOptions(optionsRes.data);
      setResults(resultsRes.data);
      if (voteStatusRes.data?.hasVoted && voteStatusRes.data?.optionId) {
          setUserVoteOptionId(voteStatusRes.data.optionId);
      } else {
          setUserVoteOptionId(null); 
      }
      
    } catch (err) {
      console.error(`Error fetching data for poll ${poll.poll_id}:`, err);
      setError('Failed to load poll details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [poll.poll_id, meeting.space_id, meeting.meeting_id]);

  const handleVote = async (optionId) => {
      if (userVoteOptionId) return; // Already voted
      
      setIsVoting(true);
      setError('');
      try {
          await axios.post(`${apiUrlBase}/vote`, { optionId });
          await fetchData(); // Refetch results and vote status
          if(onVoteSuccess) onVoteSuccess(); 
      } catch (err) {
          console.error("Error casting vote:", err);
          setError(err.response?.data?.message || 'Failed to cast vote.');
      } finally {
          setIsVoting(false);
      }
  };

  const totalVotes = results?.reduce((sum, r) => sum + r.vote_count, 0) || 0;
  const hasVoted = userVoteOptionId !== null;

  const handleAddOption = async () => {
    if (!newOptionText.trim() || !meeting?.space_id || !meeting?.meeting_id || !poll.topic_id) return;

    setIsAddingOption(true);
    setAddOptionError('');
    try {
      await axios.post(
        `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${poll.topic_id}/polls/${poll.poll_id}/options`,
        { optionText: newOptionText.trim() }
      );
      setNewOptionText('');
      fetchData();
    } catch (err) {
      console.error("Error adding option:", err);
      setAddOptionError(err.response?.data?.message || 'Failed to add option.');
    } finally {
      setIsAddingOption(false);
    }
  };

  const [isDeletingPoll, setIsDeletingPoll] = useState(false);
  const [deletePollError, setDeletePollError] = useState('');

  const handleDeletePoll = async () => {
      if (!window.confirm(`Are you sure you want to delete the poll: "${poll.question}"? This will delete all options and votes.`)) return;
      
      setIsDeletingPoll(true);
      setDeletePollError('');
      try {
          // Use the same apiUrlBase but with DELETE method
          await axios.delete(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${poll.topic_id}/polls/${poll.poll_id}`);
          if (onPollDeleted) {
              onPollDeleted(poll.poll_id); // Notify parent to remove poll from list
          }
          // Component might unmount, no need to reset state here if parent removes it
      } catch (err) {
          console.error("Error deleting poll:", err);
          setDeletePollError(err.response?.data?.message || 'Failed to delete poll.');
          setIsDeletingPoll(false); // Allow retry on error
      }
  };

  // Handler to refresh data when an option is deleted
  const handleOptionDeleted = (deletedOptionId) => {
      fetchData(); // Refetch all poll data
  };

  return (
    <div className="mb-4 p-3 border border-gray-200 rounded bg-gray-50 relative group">
      <p className="text-sm font-semibold text-gray-800 mb-2 pr-6">{poll.question}</p>
      {/* Delete Poll Button - Always rendered, visible on hover */} 
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <IconButton
              icon={<Trash2 className="w-3 h-3"/>}
              color="red"
              onClick={handleDeletePoll}
              disabled={isDeletingPoll}
              title="Delete Poll"
          />
      </div>
      {/* Display delete error */}
      {deletePollError && (
          <p className="text-xs text-red-600 mb-2">Error: {deletePollError}</p>
      )}
      {loading ? (
        <p className="text-xs text-gray-500">Loading options...</p>
      ) : error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : (
        <div>
          {options.map(option => (
            <PollOption 
              key={option.option_id}
              option={option}
              results={results}
              totalVotes={totalVotes}
              userVoteOptionId={userVoteOptionId}
              pollId={poll.poll_id}
              topicId={poll.topic_id}
              meetingId={meeting.meeting_id}
              spaceId={meeting.space_id}
              onVote={handleVote}
              disabled={hasVoted || isVoting || isDeletingPoll}
              isSpaceAdmin={isSpaceAdmin}
              onOptionDeleted={handleOptionDeleted}
            />
          ))}
          {/* --- Add Option Form --- */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <input 
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Add an option..."
                className="flex-grow p-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                disabled={isAddingOption || hasVoted} // Maybe allow adding options even if voted?
              />
              <button
                onClick={handleAddOption} // Changed from inline arrow function
                disabled={!newOptionText.trim() || isAddingOption || hasVoted}
                className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAddingOption ? 'Adding...' : <Plus className="w-4 h-4"/>}
              </button>
            </div>
            {addOptionError && <p className="text-xs text-red-600 mt-1">{addOptionError}</p>}
          </div>
          {/* --- End Add Option Form --- */}
          
          {hasVoted && (
               <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ThumbsUp className="w-3 h-3"/> Your vote has been recorded.</p> 
           )}
           {isVoting && (
                <p className="text-xs text-blue-600 mt-1">Casting vote...</p>
           )}
           {error && !isVoting && (
               <p className="text-xs text-red-600 mt-1">{error}</p> 
           )}
        </div>
      )}
    </div>
  );
}
// --- End Poll Component ---

// --- Topic Item Component ---
function TopicItem({ topic, language, t, meeting, onTopicUpdated, onTopicDeleted, formatCommentTimestamp, isSpaceAdmin }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [polls, setPolls] = useState([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(topic.topic_title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [topicError, setTopicError] = useState('');

  // State for creating polls
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [isCreatingPoll, setIsCreatingPoll] = useState(false);
  const [createPollError, setCreatePollError] = useState('');

  // State for topic comments
  const [topicComments, setTopicComments] = useState([]);
  const [topicCommentsLoading, setTopicCommentsLoading] = useState(false); 
  const [topicCommentsError, setTopicCommentsError] = useState('');
  const [newTopicComment, setNewTopicComment] = useState('');
  const [isPostingTopicComment, setIsPostingTopicComment] = useState(false);

  // State for deleting documents
  const [deletingDocId, setDeletingDocId] = useState(null); // Track which doc is being deleted
  const [deleteDocError, setDeleteDocError] = useState('');

  // State for deleting comments
  const [deletingCommentId, setDeletingCommentId] = useState(null);
  const [deleteCommentError, setDeleteCommentError] = useState('');

  const fetchDocuments = async () => {
    if (!meeting?.space_id || !meeting?.meeting_id || !topic?.topic_id) return;
    setDocsLoading(true);
    setDocsError('');
    try {
      const response = await axios.get(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/documents`);
      setDocuments(response.data);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocsError('Failed to load documents.');
    } finally {
      setDocsLoading(false);
    }
  };

  // Fetch documents when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchDocuments();
    }
  }, [isExpanded, topic.topic_id, meeting.meeting_id, meeting.space_id]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadError(''); // Clear previous upload errors
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !meeting?.space_id || !meeting?.meeting_id || !topic?.topic_id) return;

    setIsUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('file', selectedFile); // Key 'file' must match multer config

    try {
      await axios.post(
        `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setSelectedFile(null); // Clear file input
      document.getElementById(`file-input-${topic.topic_id}`).value = null; // Reset file input visually
      fetchDocuments(); // Refresh document list
    } catch (err) {
      console.error("Error uploading document:", err);
      setUploadError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  // Fetch polls
  const fetchPolls = async () => {
    if (!meeting?.space_id || !meeting?.meeting_id || !topic?.topic_id) return;
    setPollsLoading(true);
    setPollsError('');
    try {
      const response = await axios.get(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/polls`);
      setPolls(response.data);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setPollsError('Failed to load polls.');
    } finally {
      setPollsLoading(false);
    }
  };

  // Fetch topic comments
  const fetchTopicComments = async () => {
    if (!meeting?.space_id || !meeting?.meeting_id || !topic?.topic_id) return;
    setTopicCommentsLoading(true);
    setTopicCommentsError('');
    try {
      const response = await axios.get(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/comments`);
      setTopicComments(response.data);
      setDeleteCommentError(''); // Clear delete error on refresh
    } catch (err) {
      console.error("Error fetching topic comments:", err);
      setTopicCommentsError('Failed to load comments for this topic.');
    } finally {
      setTopicCommentsLoading(false);
    }
  };

  const handleAddTopicComment = async (e) => {
    e.preventDefault();
    if (!newTopicComment.trim() || !meeting?.space_id || !meeting?.meeting_id || !topic?.topic_id) return;

    setIsPostingTopicComment(true);
    setTopicCommentsError('');
    try {
      await axios.post(
        `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/comments`,
        { content: newTopicComment.trim() } // Backend expects 'content'
      );
      setNewTopicComment(''); // Clear input
      fetchTopicComments(); // Refresh comment list
    } catch (err) {
      console.error("Error adding topic comment:", err);
      setTopicCommentsError(err.response?.data?.message || 'Failed to add comment.');
    } finally {
      setIsPostingTopicComment(false);
    }
  };

  // Fetch data when expanded
  useEffect(() => {
    if (isExpanded) {
      fetchPolls(); 
      fetchDocuments(); 
      fetchTopicComments(); // Fetch comments when topic expands
    }
  }, [isExpanded, topic.topic_id, meeting.meeting_id, meeting.space_id]); 

  // --- Edit/Delete Topic Handlers ---
  const handleEditClick = () => {
      setEditedTitle(topic.topic_title); // Reset edit field
      setIsEditing(true);
      setTopicError('');
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setTopicError('');
  };

  const handleSaveEdit = async () => {
      if (!editedTitle.trim()) {
          setTopicError("Title cannot be empty.");
          return;
      }
      if (editedTitle.trim() === topic.topic_title) {
          setIsEditing(false); // No change, just exit edit mode
          return;
      }
      
      setIsSaving(true);
      setTopicError('');
      try {
          await axios.patch(
              `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}`,
              { topic_title: editedTitle.trim() }
          );
          setIsEditing(false);
          onTopicUpdated(); // Callback to refresh topic list in parent
      } catch (err) {
          console.error("Error updating topic:", err);
          setTopicError(err.response?.data?.message || 'Failed to save topic.');
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteClick = async () => {
      // Simple confirm, consider a modal for better UX
      if (window.confirm(`Are you sure you want to delete the topic: "${topic.topic_title}"? This cannot be undone.`)) {
          setIsDeleting(true);
          setTopicError('');
          try {
              await axios.delete(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}`);
              onTopicDeleted(); // Callback to refresh topic list in parent
          } catch (err) {
              console.error("Error deleting topic:", err);
              setTopicError(err.response?.data?.message || 'Failed to delete topic.');
              setIsDeleting(false); // Allow retry on error
          }
          // No finally needed, component will likely unmount on success
      }
  };

  // --- Handle Create Poll ---
  const handleCreatePoll = async (e) => {
      e.preventDefault();
      if (!newPollQuestion.trim() || !meeting?.space_id || !meeting?.meeting_id || !topic?.topic_id) return;

      setIsCreatingPoll(true);
      setCreatePollError('');
      try {
          await axios.post(
              `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/polls`,
              { question: newPollQuestion.trim() } // Backend expects 'question'
          );
          setNewPollQuestion(''); // Clear input
          setShowCreatePoll(false); // Hide form
          fetchPolls(); // Refresh poll list
      } catch (err) {
          console.error("Error creating poll:", err);
          setCreatePollError(err.response?.data?.message || 'Failed to create poll.');
      } finally {
          setIsCreatingPoll(false);
      }
  };

  const handleDownloadDocument = async (doc) => {
      const { document_id, file_name } = doc;
      // Construct the download URL
      const downloadUrl = `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/documents/${document_id}`;
      
      try {
          // Fetch the file as a blob using Axios (sends auth cookies)
          const response = await axios.get(downloadUrl, {
              responseType: 'blob', // Important: response is binary data
          });

          // Create a temporary link element
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(response.data); // Create URL for the blob
          
          // Set the download attribute to the original filename
          link.setAttribute('download', file_name);
          
          // Append link to the body, click it, and remove it
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Clean up the object URL
          window.URL.revokeObjectURL(link.href);

      } catch (error) {
          console.error('Error downloading document:', error);
          // TODO: Display error to user (e.g., set an error state)
          alert(`Failed to download document: ${error.response?.data?.message || error.message}`);
      }
  };

  const handleDeleteDocument = async (documentId) => {
      if (window.confirm("Are you sure you want to delete this document? This cannot be undone.")) {
          setDeletingDocId(documentId);
          setDeleteDocError('');
          try {
              await axios.delete(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/documents/${documentId}`);
              fetchDocuments(); // Refresh the list
          } catch (err) {
              console.error("Error deleting document:", err);
              setDeleteDocError(err.response?.data?.message || 'Failed to delete document.');
          } finally {
              setDeletingDocId(null);
          }
      }
  };

  const handleDeleteComment = async (commentId) => {
      if (!window.confirm("Are you sure you want to delete this comment?")) return;
      
      setDeletingCommentId(commentId);
      setDeleteCommentError('');
      try {
          await axios.delete(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics/${topic.topic_id}/comments/${commentId}`);
          // Refresh comments list optimistically or after success
          setTopicComments(currentComments => currentComments.filter(c => c.comment_id !== commentId));
      } catch (err) {
          console.error("Error deleting comment:", err);
          setDeleteCommentError(err.response?.data?.message || 'Failed to delete comment.');
          // Optionally refetch comments if optimistic update fails or is not preferred
          // fetchTopicComments(); 
      } finally {
          setDeletingCommentId(null);
      }
  };

  const handlePollDeleted = (deletedPollId) => {
      setPolls(currentPolls => currentPolls.filter(p => p.poll_id !== deletedPollId));
  };

  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden shadow-sm mb-4 bg-white">
      <div 
        className={`p-3 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition ${isEditing ? 'bg-yellow-50' : 'bg-blue-100'}`}
        onClick={() => !isEditing && setIsExpanded(!isExpanded)} // Don't toggle expand when editing
      >
         {isEditing ? (
             <div className="flex-grow flex items-center gap-2 mr-2">
                 <input 
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    disabled={isSaving}
                    className="input-field text-sm flex-grow bg-white"
                 />
                 <IconButton 
                    icon={<Save className="w-4 h-4 text-green-600" />} 
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    title="Save Changes"
                 />
                 <IconButton 
                    icon={<Ban className="w-4 h-4 text-red-600" />} 
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    title="Cancel Edit"
                 />
             </div>
         ) : (
            <h3 className="font-semibold text-blue-800 text-sm flex-grow cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>{topic.topic_title || 'Untitled Topic'}</h3>
         )}
         <div className="flex items-center gap-2 flex-shrink-0">
           {!isEditing && (
               <>
                   <IconButton icon={<Edit2 className="w-3 h-3" />} onClick={handleEditClick} disabled={isDeleting} title="Edit Topic"/> 
                   <IconButton icon={<Trash2 className="w-3 h-3" />} color="red" onClick={handleDeleteClick} disabled={isDeleting} title="Delete Topic"/> 
                   <div onClick={() => setIsExpanded(!isExpanded)} className="cursor-pointer">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-blue-700" /> : <ChevronDown className="w-4 h-4 text-blue-700" />}
                   </div>
               </>
           )}
         </div>
      </div>
      {/* Display topic save/delete error */}
      {topicError && (
          <p className="text-xs text-red-600 px-3 py-1 bg-red-50 border-t border-red-200">Error: {topicError}</p>
      )}
      
      {/* Expanded content (only show if not editing) */} 
      {isExpanded && !isEditing && (
        <div className="p-4 border-t border-blue-200 space-y-4">
          
          {/* --- Documents Section Wrapper --- */}
          <div className="p-3 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
          <h4 className="text-sm font-medium text-blue-800 mb-3">{t.documents}</h4>
            {/* Document List */} 
          <div className="mb-4 space-y-2">
            {docsLoading ? (
              <p className="text-xs text-gray-500">Loading documents...</p>
            ) : docsError ? (
              <p className="text-xs text-red-600">{docsError}</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-gray-500">No documents uploaded yet.</p>
            ) : (
              documents.map((doc) => (
                <div key={doc.document_id} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                     <Paperclip className="w-3 h-3 text-gray-500 flex-shrink-0" /> 
                    <span className="text-gray-700 truncate" title={doc.file_name}>{doc.file_name}</span>
                    {/* <span className="text-gray-400 ml-2 flex-shrink-0">({(doc.file_size / 1024).toFixed(1)} KB)</span> */} 
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button 
                        onClick={() => handleDownloadDocument(doc)}
                        className="text-blue-600 hover:underline disabled:opacity-50 disabled:no-underline"
                        title={t.download}
                        disabled={deletingDocId === doc.document_id} // Disable while deleting this doc
                    >
                       <Download className="w-3 h-3"/>
                    </button>
                    <button 
                        onClick={() => handleDeleteDocument(doc.document_id)}
                        className="text-red-600 hover:underline disabled:opacity-50 disabled:no-underline"
                        title={t.delete}
                        disabled={deletingDocId === doc.document_id} // Disable while deleting
                    >
                      {deletingDocId === doc.document_id ? (
                         <div className="w-3 h-3 border-1 border-red-500 border-t-transparent rounded-full animate-spin"></div> 
                      ) : (
                         <Trash2 className="w-3 h-3"/>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
            {/* Delete Error */} 
          {deleteDocError && (
              <p className="text-xs text-red-600 mt-1">Error deleting document: {deleteDocError}</p>
          )}
            {/* Upload Form - No border-t needed now */} 
            <div className="mt-4 pt-3 border-gray-200"> 
              {/* Input and Button container */}
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                id={`file-input-${topic.topic_id}`} 
                onChange={handleFileChange}
                disabled={isUploading}
                className="text-xs text-gray-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 disabled:opacity-50"
              />
              <button 
                onClick={handleUploadDocument}
                disabled={!selectedFile || isUploading}
                className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isUploading ? (
                  <div className="w-3 h-3 border-1 border-white border-t-transparent rounded-full animate-spin"></div> 
                ) : (
                  <UploadCloud className="w-3 h-3" />
                )}
                {isUploading ? 'Uploading...' : t.upload}
              </button>
            </div>
            {uploadError && (
              <p className="text-xs text-red-600 mt-1">{uploadError}</p>
            )}
            </div>
          </div>
          
          {/* --- Voting Section Wrapper --- */}
          <div className="p-3 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
            <div> 
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-blue-800">{t.voting}</h4>
                {!showCreatePoll && (
                     <button 
                        onClick={() => setShowCreatePoll(true)}
                        className="px-2 py-1 text-xs font-medium text-blue-700 border border-blue-300 rounded-md hover:bg-blue-100"
                        disabled={isCreatingPoll}
                    >
                        Create Poll
                     </button> 
                )}
            </div>
            {/* Create Poll Form */} 
            {showCreatePoll && (
                <form onSubmit={handleCreatePoll} className="mb-4 p-3 border border-blue-200 rounded bg-blue-50">
                    <label htmlFor={`poll-q-${topic.topic_id}`} className="block text-xs font-medium text-gray-700 mb-1">New Poll Question:</label>
                    <textarea 
                        id={`poll-q-${topic.topic_id}`}
                        placeholder="What question do you want to ask?"
                        value={newPollQuestion}
                        onChange={(e) => setNewPollQuestion(e.target.value)}
                        disabled={isCreatingPoll}
                        className="input-field w-full text-sm mb-2" 
                        rows={2}
                    />
                    {createPollError && (
                        <p className="text-xs text-red-600 mb-2">{createPollError}</p>
                    )}
                    <div className="flex justify-end gap-2">
                        <button 
                            type="button"
                            onClick={() => { setShowCreatePoll(false); setNewPollQuestion(''); setCreatePollError(''); }}
                            disabled={isCreatingPoll}
                            className="px-3 py-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={isCreatingPoll || !newPollQuestion.trim()}
                            className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isCreatingPoll ? 'Creating...' : 'Create Poll'}
                        </button>
                    </div>
                </form>
            )}

            {/* Poll List */} 
            {pollsLoading ? (
                <p className="text-xs text-gray-500">Loading polls...</p>
            ) : pollsError ? (
                <p className="text-xs text-red-600">{pollsError}</p>
            ) : polls.length === 0 && !showCreatePoll ? ( // Don't show if form is open
                <p className="text-xs text-gray-500">No polls created for this topic yet.</p>
            ) : (
                polls.map(poll => (
                      <Poll 
                          key={poll.poll_id} 
                          poll={poll} 
                          meeting={meeting} 
                          onVoteSuccess={fetchPolls} 
                          isSpaceAdmin={isSpaceAdmin}
                          onPollDeleted={handlePollDeleted}
                      />
                ))
            )}
            </div>
          </div>
          
          {/* --- Comments Section Wrapper --- */}
          <div className="p-3 border-2 border-gray-200 rounded-lg bg-white shadow-sm">
            <div> 
            <h4 className="text-sm font-medium text-blue-800 mb-3">Comments</h4>
              {/* Display delete error */} 
              {deleteCommentError && (
                  <p className="text-xs text-red-600 mb-2">Error: {deleteCommentError}</p>
              )}
            <div className="mb-4 space-y-2 max-h-[200px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-blue-50 [&::-webkit-scrollbar-thumb]:bg-blue-200">
              {topicCommentsLoading ? (
                <p className="text-xs text-gray-500">Loading comments...</p>
              ) : topicCommentsError && !isPostingTopicComment ? (
                <p className="text-xs text-red-600">{topicCommentsError}</p>
              ) : topicComments.length === 0 ? (
                <p className="text-xs text-gray-500">No comments for this topic yet.</p>
              ) : (
                topicComments.map((comment) => (
                    <div key={comment.comment_id} className="bg-gray-50 p-2 rounded border border-gray-200 group relative">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <span className="text-xs font-semibold text-gray-700 block">
                        {comment.username || 'Unknown User'}
                      </span>
                      <span className="text-xs text-gray-400">
                             {formatCommentTimestamp(comment.created_at)}
                      </span>
                        </div>
                        {/* Delete Button - Always rendered, visible on hover */} 
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <IconButton
                                icon={<Trash2 className="w-3 h-3"/>}
                                color="red"
                                onClick={() => handleDeleteComment(comment.comment_id)}
                                disabled={deletingCommentId === comment.comment_id}
                                title="Delete Comment"
                            />
                        </div> 
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {comment.content} 
                    </p>
                  </div>
                ))
              )}
            </div>
            {/* Add Comment Form */} 
            <form onSubmit={handleAddTopicComment}>
              {topicCommentsError && isPostingTopicComment && (
                  <p className="text-xs text-red-600 mb-1">{topicCommentsError}</p>
              )}
              <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Add a comment to this topic..."
                    value={newTopicComment}
                    onChange={(e) => setNewTopicComment(e.target.value)}
                    disabled={isPostingTopicComment}
                    className="input-field flex-grow text-sm" 
                  />
                  <button 
                    type="submit"
                    disabled={isPostingTopicComment || !newTopicComment.trim()}
                    className="p-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {isPostingTopicComment ? (
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    </button>
              </div>
            </form>
          </div> 
          </div> 

        </div>
      )}
    </div>
  );
}
// --- End Topic Item Component ---

export default function BilingualMeeting({ meeting, onUpdateMeeting, isSpaceAdmin }) {
  const [language, setLanguage] = useState('EN');
  const { user } = useAuth(); // Get user from context if not passed as prop
  const navigate = useNavigate(); // Add useNavigate hook
  
  // Determine if the current user is the space admin
  // This should ideally come from the parent component that fetches meeting/space details
  const isCurrentUserSpaceAdmin = user && meeting && user.id === meeting.admin_user_id; 

  
  // State for attendance data
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceError, setAttendanceError] = useState('');

  // State for topics
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState('');
  const [showAddTopicInput, setShowAddTopicInput] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

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
      approveQ4Goals: "Approve Q4 Goals?",
      yes: "Yes",
      no: "No",
      comments: "Comments",
      addComment: "Add a comment...",
      discussQ4Goals: "Discuss Q4 Goals",
      saadComment: "Sorry, I cannot attend the meeting this week",
      saad: "Saad"
    },
    عربي: {
      attendance: "الحضور",
      liveTranscription: "نص الاجتماع",
      aiSummary: "ملخص الاجتماع",
      followUpTasks: "مهام المتابعة",
      topics: "المواضيع",
      addTopic: "إضافة موضوع",
      documents: "المستندات",
      upload: "رفع",
      download: "تحميل",
      delete: "حذف",
      voting: "التصويت",
      approveQ4Goals: "هل توافق على أهداف الربع الرابع؟",
      yes: "نعم",
      no: "لا",
      comments: "التعليقات",
      addComment: "إضافة تعليق...",
      discussQ4Goals: "مناقشة أهداف الربع الرابع",
      saadComment: "عذرًا، لا أستطيع حضور الاجتماع هذا الأسبوع",
      saad: "سعد"
    }
  };

  const t = staticTranslations[language];

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not set';
    try {
      return new Date(dateString).toLocaleString(language === 'عربي' ? 'ar-SA' : 'en-US', {
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
      const ownerMatch = text.match(/\(@(.*?)\)/);
      const deadlineMatch = text.match(/\[(.*?)\]/);
      const mainText = text.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
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

  // Fetch attendance data
  useEffect(() => {
    if (!meeting?.meeting_id) return; // Don't fetch if meetingId is missing

    const fetchAttendance = async () => {
      setAttendanceLoading(true);
      setAttendanceError('');
      try {
        // Construct the correct API path using meeting details
        const response = await axios.get(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/attendance`);
        setAttendanceList(response.data);
      } catch (err) {
        console.error("Error fetching attendance:", err);
        setAttendanceError('Failed to load attendance.');
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchAttendance();

  }, [meeting?.meeting_id, meeting?.space_id]); // Re-fetch if meetingId or spaceId changes

  // Fetch topics
  const fetchTopics = async () => {
    if (!meeting?.meeting_id || !meeting?.space_id) return;
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
    fetchTopics(); // Fetch initial topics
  }, [meeting?.meeting_id, meeting?.space_id]); // Re-fetch if meeting changes

  // Handle adding a new topic
  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!newTopicTitle.trim() || !meeting?.meeting_id || !meeting?.space_id) return;
    
    setIsAddingTopic(true);
    setTopicsError('');
    try {
      await axios.post(
        `/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/topics`,
        { topic_title: newTopicTitle.trim() } // Use snake_case
      );
      setNewTopicTitle(''); // Clear input
      setShowAddTopicInput(false); // Hide input
      fetchTopics(); // Refresh topics list
    } catch (err) {
      console.error("Error adding topic:", err);
      setTopicsError(err.response?.data?.message || 'Failed to add topic.');
    } finally {
      setIsAddingTopic(false);
    }
  };

  // Rename and modify handler to mark attendance for any user (if admin)
  const handleMarkAttendance = async (targetUserId, newStatus) => {
      if (!meeting?.meeting_id || !meeting?.space_id || targetUserId === undefined) return;

      // Find target user in the list to update state optimistically
      const userIndex = attendanceList.findIndex(a => a.user_id === targetUserId);
      if (userIndex === -1) return; // Target user not found in list

      const previousStatus = attendanceList[userIndex].is_present;
      
      // Optimistic UI update
      setAttendanceList(currentList => 
          currentList.map((item, index) => 
              index === userIndex ? { ...item, is_present: newStatus } : item
          )
      );
      setAttendanceError(''); // Clear previous errors
      
      try {
          // Send targetUserId in the request body
          await axios.post(`/api/spaces/${meeting.space_id}/meetings/${meeting.meeting_id}/attendance`, { 
              isPresent: newStatus,
              targetUserId: targetUserId 
          });
          // Success - optimistic update stands
      } catch (err) {
          console.error("Error marking attendance:", err);
          setAttendanceError(err.response?.data?.message || 'Failed to update attendance.');
          // Revert optimistic update on error
          setAttendanceList(currentList => 
              currentList.map((item, index) => 
                  index === userIndex ? { ...item, is_present: previousStatus } : item
              )
          );
    }
  };

  // KEEP formatCommentTimestamp as it might be useful for topic comments
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
      return date.toLocaleDateString(language === 'عربي' ? 'ar-SA' : 'en-US');
    } catch (e) {
      return 'Invalid date';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-50" dir={language === 'عربي' ? 'rtl' : 'ltr'}>
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
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                  {meeting.status}
                </span>
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
            <button
              onClick={() => setLanguage(language === 'EN' ? 'عربي' : 'EN')}
              className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              {language === 'EN' ? 'عربي' : 'English'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 h-[calc(100vh-96px)]">
          <aside className="col-span-1 p-6 bg-blue-80 border-r border-blue-200 overflow-y-auto [&::-webkit-scrollbar]:hidden">
            <h2 className="font-semibold text-blue-800 mb-5">{t.attendance}</h2>
            <div className="space-y-4">
              {attendanceLoading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : attendanceError ? (
                <p className="text-sm text-red-600">{attendanceError}</p>
              ) : attendanceList.length === 0 ? (
                <p className="text-sm text-gray-500">No members found in this space.</p>
              ) : (
                attendanceList.map((attendee) => {
                  const isPresent = attendee.is_present === true;
                  const statusColor = isPresent ? 'bg-emerald-500' : 'bg-gray-300';
                  const statusTitle = isPresent ? 'Present' : 'Absent';
                  
                  return (
                    <div key={attendee.user_id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-800 font-medium">{attendee.username}</span>
                    <div className="flex items-center gap-2">
                        {/* Dot is clickable only FOR ADMINS */}
                        <button 
                          type="button"
                          onClick={isCurrentUserSpaceAdmin ? () => handleMarkAttendance(attendee.user_id, !isPresent) : undefined} 
                          disabled={!isCurrentUserSpaceAdmin} // Disable button if not admin
                          className={`w-3 h-3 rounded-full transition-opacity ${statusColor} ${isCurrentUserSpaceAdmin ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                          title={isCurrentUserSpaceAdmin ? `Click to mark ${attendee.username} as ${isPresent ? 'Absent' : 'Present'}` : statusTitle}
                          aria-label={isCurrentUserSpaceAdmin ? `Mark ${attendee.username} as ${isPresent ? 'absent' : 'present'}` : statusTitle} 
                        >
                          {/* Button is the dot */}
                        </button>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          </aside>

          <main className="col-span-7 p-6 overflow-y-auto bg-white border-r border-blue-200 [&::-webkit-scrollbar]:hidden">
            <section className="mb-10">
              <SectionHeader title={t.liveTranscription} />
              <ContentBox dir="auto">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {meeting?.transcript || 'No transcription available.'}
                </p>
              </ContentBox>
            </section>

            <section className="mb-10">
              <SectionHeader title={t.aiSummary} />
              <ContentBox dir="auto">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {meeting?.summary || 'No summary available.'}
                </p>
              </ContentBox>
            </section>

            <section>
              <SectionHeader title={t.followUpTasks}>
              </SectionHeader>
              <ContentBox dir="auto">
              {meetingTasks.length > 0 ? (
              <div className="space-y-4">
                {meetingTasks.map((task, index) => (
                  <div key={task.id} className={`flex items-start gap-3 ${index % 3 !== 0 ? 'ml-6' : ''}`}> {}
                    <div className="flex-1">
                      <span
                        className={`text-sm block ${
                          task.checked ? 'line-through text-slate-500' : 'text-slate-800'
                        } ${index % 3 !== 0 ? 'text-xs' : 'font-semibold'}`} 
                      >
                        {task.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
                ) : (
                  <p className="text-sm text-gray-500">No follow-up tasks identified.</p>
                )}
              </ContentBox>
            </section>
          </main>

          <aside className="col-span-4 p-6 bg-white overflow-y-auto [&::-webkit-scrollbar]:hidden flex flex-col h-full">
            <section className="mb-10 flex flex-col flex-grow">
              <SectionHeader title={t.topics}>
                {!showAddTopicInput && (
                  <button 
                    onClick={() => setShowAddTopicInput(true)}
                    className="px-3 py-1 text-xs font-medium text-blue-700 border border-blue-300 rounded-md hover:bg-blue-100"
                  >
                    {t.addTopic}
                  </button>
                )}
              </SectionHeader>
              
              {/* Add Topic Input Form */} 
              {showAddTopicInput && (
                  <form onSubmit={handleAddTopic} className="mb-4 flex gap-2">
                      <input 
                          type="text"
                          placeholder="Enter new topic title..."
                          value={newTopicTitle}
                          onChange={(e) => setNewTopicTitle(e.target.value)}
                          disabled={isAddingTopic}
                          className="input-field flex-grow text-sm"
                          autoFocus
                      />
                      <button 
                          type="submit"
                          disabled={isAddingTopic || !newTopicTitle.trim()}
                          className="px-3 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                          {isAddingTopic ? 'Adding...' : 'Add'}
                      </button>
                      <button 
                          type="button"
                          onClick={() => { setShowAddTopicInput(false); setNewTopicTitle(''); setTopicsError(''); }}
                          disabled={isAddingTopic}
                          className="px-3 py-1 text-xs rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                      >
                          Cancel
                      </button>
                  </form>
              )}
              {topicsError && (
                  <p className="text-xs text-red-600 mb-2">Error: {topicsError}</p>
              )}

              {/* Topics List Container - Remove border classes */}
              <div className="p-4 rounded-xl shadow-sm space-y-1 bg-white overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-blue-100 [&::-webkit-scrollbar-thumb]:bg-blue-300 flex-grow">
                {topicsLoading ? (
                  <p className="text-sm text-gray-500">Loading topics...</p>
                ) : topics.length === 0 ? (
                  <p className="text-sm text-gray-500">No topics added yet.</p>
                ) : (
                  topics.map((topic) => (
                    <TopicItem 
                        key={topic.topic_id} 
                        topic={topic} 
                        language={language} 
                        t={t} 
                        meeting={meeting} 
                        onTopicUpdated={fetchTopics} 
                        onTopicDeleted={fetchTopics} 
                        formatCommentTimestamp={formatCommentTimestamp}
                        isSpaceAdmin={isCurrentUserSpaceAdmin}
                    /> 
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
