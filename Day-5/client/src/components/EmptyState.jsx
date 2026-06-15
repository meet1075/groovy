const EmptyState = ({ onClear }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>
      <h4>No students found</h4>
      <p>Try adjusting your search or filter criteria</p>
      <button className="btn-clear" onClick={onClear}>Clear filters</button>
    </div>
  );
};

export default EmptyState;
