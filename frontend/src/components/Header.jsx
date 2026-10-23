import React from 'react';

const Header = ({ stats, isConnected, serverChecking, user, onLogout }) => {
  const { total = 0, pending = 0, completed = 0 } = stats;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <header className="header-wrapper" id="app-header">
      <div className="header-top">
        <div className="header-brand">
          <div className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div className="header-title-group">
            <h1>Todo Master CRUD</h1>
            <p>Full-Stack React + Express + MongoDB Task Management</p>
          </div>
        </div>

        <div className="header-account">
          <span className="header-user">{user?.name}</span>
          <button type="button" className="btn btn-secondary header-logout" onClick={onLogout}>
            Log out
          </button>
          <div className="status-pill" title={isConnected ? 'Backend API connected' : 'Connecting to API...'}>
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`} />
            <span>{serverChecking ? 'Checking...' : isConnected ? 'API Connected' : 'Server Disconnected'}</span>
          </div>
        </div>
      </div>

      <div className="glass-panel stats-banner">
        <div className="stat-item">
          <div className="stat-icon total" aria-hidden="true">📋</div>
          <div className="stat-content">
            <span className="stat-label">Total Todos</span>
            <span className="stat-value" id="stat-total-count">{total}</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon pending" aria-hidden="true">⏳</div>
          <div className="stat-content">
            <span className="stat-label">Pending</span>
            <span className="stat-value" id="stat-pending-count">{pending}</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon done" aria-hidden="true">✅</div>
          <div className="stat-content">
            <span className="stat-label">Completed</span>
            <span className="stat-value" id="stat-completed-count">{completed}</span>
          </div>
        </div>

        <div className="progress-bar-container">
          <div className="progress-header">
            <span>Overall Completion</span>
            <span id="stat-completion-pct">{percentage}%</span>
          </div>
          <div className="progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
            <div className="progress-fill" style={{ width: `${percentage}%` }} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
