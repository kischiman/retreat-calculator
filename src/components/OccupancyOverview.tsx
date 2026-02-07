import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { NightBreakdown, Participant } from '../types';
import { GanttChart } from './GanttChart';

interface OccupancyOverviewProps {
  nightBreakdown: NightBreakdown[];
  startDate: string;
  endDate: string;
  participants: Participant[];
}

export function OccupancyOverview({ nightBreakdown, startDate, endDate, participants }: OccupancyOverviewProps) {
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  
  if (nightBreakdown.length === 0) {
    return null;
  }

  const getOccupancyClass = (count: number) => {
    if (count <= 2) return 'occupancy-low';
    if (count <= 4) return 'occupancy-medium';
    return 'occupancy-high';
  };

  const showDateLabels = nightBreakdown.length <= 31; // Show dates for up to 31 days

  return (
    <div className="occupancy-overview">
      <div className="occupancy-timeline">
        <div className="timeline-bars">
          {nightBreakdown.map((night) => (
            <div 
              key={night.date} 
              className={`timeline-bar ${getOccupancyClass(night.participantCount)}`}
              style={{ 
                height: `${Math.max(20, night.participantCount * 15)}px`,
                width: `${Math.max(100 / nightBreakdown.length, 2)}%`
              }}
              title={`${format(parseISO(night.date), 'MMM dd, yyyy')}: ${night.presentParticipants.join(', ')} (${night.participantCount} people)`}
            >
              <div className="bar-count">{night.participantCount}</div>
            </div>
          ))}
        </div>
        {showDateLabels && (
          <div className="timeline-dates">
            {nightBreakdown.map((night, index) => {
              // Show every 3rd date to avoid crowding, but ensure first and last are always shown
              const showDate = index === 0 || index === nightBreakdown.length - 1 || index % 3 === 0;
              const barWidth = Math.max(100 / nightBreakdown.length, 2);
              const leftPosition = (index * barWidth) + (barWidth / 2); // Center the label under the bar
              
              return showDate ? (
                <div 
                  key={`date-${night.date}`} 
                  className="date-label"
                  style={{ 
                    position: 'absolute',
                    left: `${leftPosition}%`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {format(parseISO(night.date), 'MMM dd')}
                </div>
              ) : null;
            })}
          </div>
        )}
      </div>
      <div className="occupancy-legend">
        <div className="legend-item">
          <div className="legend-color occupancy-low"></div>
          <span>1-2 people</span>
        </div>
        <div className="legend-item">
          <div className="legend-color occupancy-medium"></div>
          <span>3-4 people</span>
        </div>
        <div className="legend-item">
          <div className="legend-color occupancy-high"></div>
          <span>5+ people</span>
        </div>
      </div>
      
      {/* Detailed Timeline Toggle */}
      <div className="breakdown-toggle">
        <button 
          onClick={() => setTimelineExpanded(!timelineExpanded)}
          className="toggle-button"
        >
          {timelineExpanded ? 'Hide' : 'Show'} Detailed Timeline View
        </button>
      </div>
      
      {timelineExpanded && (
        <div className="timeline-breakdown">
          <GanttChart
            participants={participants}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      )}
    </div>
  );
}