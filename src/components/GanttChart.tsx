import type { Participant } from '../types';
import { format, parseISO, eachDayOfInterval, differenceInDays } from 'date-fns';

interface GanttChartProps {
  participants: Participant[];
  startDate: string;
  endDate: string;
}

export function GanttChart({ participants, startDate, endDate }: GanttChartProps) {
  if (!startDate || !endDate || participants.length === 0) {
    return (
      <div className="gantt-chart">
        <div className="no-chart">
          <p>Add participants and set booking dates to see timeline</p>
        </div>
      </div>
    );
  }

  const start = parseISO(startDate);
  const end = parseISO(endDate);
  const allDates = eachDayOfInterval({ start, end });
  const totalDays = allDates.length;

  // Generate colors for participants
  const colors = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#27ae60'
  ];

  const getParticipantColor = (index: number) => colors[index % colors.length];

  const getPositionAndWidth = (arrivalDate: string, departureDate: string) => {
    const arrival = parseISO(arrivalDate);
    const departure = parseISO(departureDate);
    
    // Clamp to booking period
    const clampedArrival = arrival < start ? start : arrival;
    const clampedDeparture = departure > end ? end : departure;
    
    const startOffset = differenceInDays(clampedArrival, start);
    const duration = differenceInDays(clampedDeparture, clampedArrival);
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return { leftPercent, widthPercent };
  };


  return (
    <div className="gantt-chart">
      {/* Gantt Chart */}
      <div className="gantt-timeline">
        <h4>Participant Timeline</h4>
        <div className="gantt-container">
          {/* Header with dates */}
          <div className="gantt-header">
            <div className="participant-label-header">Participant</div>
            <div className="timeline-header">
              {allDates.map((date, index) => (
                index % Math.ceil(allDates.length / 15) === 0 && (
                  <div 
                    key={date.toISOString()} 
                    className="date-header"
                    style={{ left: `${(index / allDates.length) * 100}%` }}
                  >
                    {format(date, 'MM/dd')}
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Participant rows */}
          <div className="gantt-rows">
            {participants.map((participant, index) => {
              const { leftPercent, widthPercent } = getPositionAndWidth(
                participant.arrivalDate, 
                participant.departureDate
              );
              
              return (
                <div key={participant.id} className="gantt-row">
                  <div className="participant-label">
                    {participant.name}
                    <span className="participant-info">
                      ({differenceInDays(parseISO(participant.departureDate), parseISO(participant.arrivalDate))} nights)
                    </span>
                  </div>
                  <div className="timeline-bar-container">
                    <div 
                      className="timeline-bar"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: getParticipantColor(index),
                      }}
                      title={`${participant.name}: ${format(parseISO(participant.arrivalDate), 'MMM dd')} - ${format(parseISO(participant.departureDate), 'MMM dd')}`}
                    >
                      <span className="bar-label">{participant.name}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="gantt-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#3498db' }}></div>
            <span>Normal occupancy</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ecf0f1' }}></div>
            <span>No participants</span>
          </div>
        </div>
        <p className="legend-note">
          Bars show participant presence. Length represents duration of stay.
          Hover over bars for detailed information.
        </p>
      </div>
    </div>
  );
}