import { useState, useEffect, useCallback, useRef } from 'react';
import { getStudents } from '../services/api';

export const useStudents = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 9,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    course: '',
  });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(debounceTimer.current);
  }, [filters.search]);

  const fetchAllStudents = useCallback(async () => {
    try {
      const result = await getStudents({ limit: 1000 });
      setAllStudents(result.data);
    } catch {
      // silent fail for stats
    }
  }, []);

  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.status) params.status = filters.status;
      if (filters.course) params.course = filters.course;

      const result = await getStudents(params);
      setStudents(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, filters.status, filters.course]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const setPage = (page) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const setFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return {
    students,
    allStudents,
    loading,
    error,
    pagination,
    filters,
    setPage,
    setFilter,
    refetch: fetchStudents,
    refetchAll: fetchAllStudents,
  };
};
