import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Download, Trash2, Save, Ban, ChevronDown, ChevronUp, UploadCloud, Paperclip, Send } from 'lucide-react'; // Ensure all icons are imported
import { IconButton } from './MeetingComponents';
import { Poll } from './PollComponents'; // Import Poll component

// --- Topic Item Component ---
export default function TopicItem({ topic, t, meeting, onTopicUpdated, onTopicDeleted, formatCommentTimestamp, isSpaceAdmin }) {
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