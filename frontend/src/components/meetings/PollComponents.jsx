import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, ThumbsUp, Plus, Trash2 } from 'lucide-react'; // Added Plus and Trash2
import { IconButton } from './MeetingComponents'; // Assuming IconButton is in MeetingComponents.jsx

// --- Poll Option Component ---
export function PollOption({ option, results, totalVotes, userVoteOptionId, pollId, topicId, meetingId, spaceId, onVote, disabled, isSpaceAdmin, onOptionDeleted }) {
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
export function Poll({ poll, meeting, onVoteSuccess, isSpaceAdmin, onPollDeleted }) {
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
  }, [poll.poll_id, meeting.space_id, meeting.meeting_id, poll.topic_id, apiUrlBase]); // Added poll.topic_id and apiUrlBase to dependencies

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