import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '../hooks/useStudents';
import { deleteStudent } from '../services/api';
import TopBar from '../components/TopBar';
import StatCards from '../components/StatCards';
import SearchFilterBar from '../components/SearchFilterBar';
import StudentTable from '../components/StudentTable';
import Pagination from '../components/Pagination';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import EmptyState from '../components/EmptyState';
import SkeletonTable from '../components/SkeletonTable';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    students,
    loading,
    error,
    pagination,
    filters,
    setPage,
    setFilter,
    refetch,
    refetchAll,
    allStudents,
  } = useStudents();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const source = allStudents.length ? allStudents : students;
    const uniqueCourses = [...new Set(source.map((s) => s.course))];
    setCourses(uniqueCourses);
  }, [students, allStudents]);

  const handleEdit = (id) => navigate(`/edit/${id}`);
  const handleDelete = (student) => setDeleteTarget(student);

  const confirmDelete = async () => {
    try {
      await deleteStudent(deleteTarget.id);
      setDeleteTarget(null);
      refetch();
      refetchAll();
    } catch {
      alert('Failed to delete student');
    }
  };

  const hasFilters = filters.search || filters.status || filters.course;
  const totalCount = allStudents.length || pagination.total;

  return (
    <>
      <TopBar
        title="Students"
        subtitle={`${totalCount} students enrolled`}
      />
      <div className="page-content">
        <StatCards students={allStudents.length ? allStudents : students} />

        <SearchFilterBar filters={filters} setFilter={setFilter} courses={courses} />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn-add" onClick={() => navigate('/add')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Student
          </button>
        </div>

        {loading ? (
          <div className="table-card"><SkeletonTable rows={9} /></div>
        ) : error ? (
          <div className="table-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--red)' }}>{error}</div>
        ) : students.length === 0 ? (
          <div className="table-card">
            <EmptyState onClear={() => { setFilter('search', ''); setFilter('status', ''); setFilter('course', ''); }} />
          </div>
        ) : (
          <>
            <StudentTable students={students} onEdit={handleEdit} onDelete={handleDelete} />
            <Pagination pagination={pagination} setPage={setPage} />
          </>
        )}
      </div>

      <ConfirmDeleteModal
        student={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default Dashboard;
