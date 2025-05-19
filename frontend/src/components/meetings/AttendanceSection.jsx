import React from 'react';

export default function AttendanceSection({ 
    t, 
    attendanceList, 
    attendanceLoading, 
    attendanceError, 
    isCurrentUserSpaceAdmin, 
    handleMarkAttendance 
}) {
  return (
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
  );
} 