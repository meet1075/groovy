const SkeletonTable = ({ rows = 9 }) => {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton skeleton-avatar" />
          <div className="skeleton skeleton-line" style={{ maxWidth: '140px' }} />
          <div className="skeleton skeleton-line medium" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line short" />
          <div className="skeleton skeleton-line" style={{ maxWidth: '80px' }} />
        </div>
      ))}
    </div>
  );
};

export default SkeletonTable;
