import React from 'react';

const StatusBadge = ({ status }) => {
  let badgeClass = 'badge';
  
  if (status === 'pending') badgeClass += ' badge-pending';
  else if (status === 'confirmed') badgeClass += ' badge-confirmed';
  else if (status === 'completed') badgeClass += ' badge-completed';
  else if (status === 'cancelled') badgeClass += ' badge-cancelled';
  else if (status === 'rejected') badgeClass += ' badge-rejected';

  return <span className={badgeClass}>{status}</span>;
};

export default StatusBadge;
