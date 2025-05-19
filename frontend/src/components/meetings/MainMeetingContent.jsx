import React from 'react';
import { SectionHeader, ContentBox } from './MeetingComponents'; // Assuming these are in MeetingComponents.jsx

export default function MainMeetingContent({ t, meeting, meetingTasks }) {
  return (
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
  );
} 