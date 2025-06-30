import React from 'react';

export const ProgressControl = ({
  total,
  completed,
  percentage,
  style
}) => {
  return (
    <div className="progress-control" style={style}>
      <div className="progress-info">
        <div className="progress-title">進捗状況</div>
        <div className="progress-stats">
          <div className="progress-numbers">
            完了: {completed} / {total}
          </div>
          <div className="progress-percentage">
            {percentage.toFixed(1)}%
          </div>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
