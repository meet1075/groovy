const SearchFilterBar = ({ filters, setFilter, courses }) => {
  return (
    <div className="filter-bar">
      <div className="filter-bar-top">
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
          />
        </div>
      </div>
      <div className="filter-dropdowns">
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="graduated">Graduated</option>
        </select>
        <select value={filters.course} onChange={(e) => setFilter('course', e.target.value)}>
          <option value="">All Courses</option>
          {courses.map((course) => (
            <option key={course} value={course}>{course}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default SearchFilterBar;
