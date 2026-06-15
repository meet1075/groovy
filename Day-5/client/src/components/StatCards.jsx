const StatCards = ({ students }) => {
  const total = students.length;
  const active = students.filter(s => s.status === 'active').length;
  const inactive = students.filter(s => s.status === 'inactive').length;
  const graduated = students.filter(s => s.status === 'graduated').length;

  return (
    <div className="stat-cards">
      <div className="stat-card">
        <div className="stat-icon total">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <div className="stat-info">
          <h3>{total}</h3>
          <p>Total Students</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div className="stat-info">
          <h3>{active}</h3>
          <p>Active</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon inactive">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        </div>
        <div className="stat-info">
          <h3>{inactive}</h3>
          <p>Inactive</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon graduated">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5"/></svg>
        </div>
        <div className="stat-info">
          <h3>{graduated}</h3>
          <p>Graduated</p>
        </div>
      </div>
    </div>
  );
};

export default StatCards;
