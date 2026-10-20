import React from 'react';

export function Badge({ variant = 'info', children }) {
  return (
    <span className={`badge badge-${variant}`}>
      {children}
    </span>
  );
}