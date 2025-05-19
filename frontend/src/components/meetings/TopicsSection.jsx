import React from 'react';
import { SectionHeader } from './MeetingComponents'; // Assuming SectionHeader is in MeetingComponents.jsx
import TopicItem from './TopicItem'; // Import TopicItem component

export default function TopicsSection({
  t,
  meeting,
  topics,
  topicsLoading,
  topicsError,
  showAddTopicInput,
  setShowAddTopicInput,
  newTopicTitle,
  setNewTopicTitle,
  isAddingTopic,
  handleAddTopic, // This is the submit handler from the parent
  setTopicsError, // To clear errors from parent
  fetchTopics, // To refresh topics from parent
  formatCommentTimestamp,
  isCurrentUserSpaceAdmin,
  language
}) {
  return (
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

        <div className="p-4 rounded-xl shadow-sm space-y-1 bg-white overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-blue-100 [&::-webkit-scrollbar-thumb]:bg-blue-300 flex-grow">
          {topicsLoading ? (
            <p className="text-sm text-gray-500">Loading topics...</p>
          ) : topics.length === 0 && !showAddTopicInput ? (
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
  );
} 