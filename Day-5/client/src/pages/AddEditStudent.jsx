import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudentById, createStudent, updateStudent } from '../services/api';
import TopBar from '../components/TopBar';

const initialForm = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  course: '',
  enrollment_year: new Date().getFullYear(),
  status: 'active',
};

const AddEditStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getStudentById(id)
        .then((res) => {
          const s = res.data;
          setFormData({
            first_name: s.firstName || '',
            last_name: s.lastName || '',
            email: s.email || '',
            phone: s.phone || '',
            date_of_birth: s.dateOfBirth ? s.dateOfBirth.split('T')[0] : '',
            gender: s.gender || '',
            course: s.course || '',
            enrollment_year: s.enrollmentYear || new Date().getFullYear(),
            status: s.status || 'active',
          });
        })
        .catch(() => navigate('/'))
        .finally(() => setLoading(false));
    }
  }, [id, navigate]);

  const validate = () => {
    const e = {};
    if (!formData.first_name.trim()) e.first_name = 'Required';
    if (!formData.last_name.trim()) e.last_name = 'Required';
    if (!formData.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email format';
    if (formData.phone && !/^\d{7,15}$/.test(formData.phone)) e.phone = 'Phone must be 7-15 digits';
    if (!formData.course.trim()) e.course = 'Required';
    if (!formData.enrollment_year) e.enrollment_year = 'Required';
    else if (formData.enrollment_year < 2000 || formData.enrollment_year > 2030) e.enrollment_year = 'Must be 2000-2030';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone' && value && !/^\d{0,15}$/.test(value)) return;
    if (name === 'enrollment_year' && value && !/^\d{0,4}$/.test(value)) return;
    if (name === 'first_name' || name === 'last_name') {
      if (value && !/^[a-zA-Z\s]*$/.test(value)) return;
    }
    if (name === 'course') {
      if (value && !/^[a-zA-Z0-9\s.]*$/.test(value)) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (id) {
        await updateStudent(id, formData);
      } else {
        await createStudent(formData);
      }
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong';
      setErrors({ submit: msg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <TopBar title="Loading..." />
        <div className="page-content"><SkeletonForm /></div>
      </>
    );
  }

  return (
    <>
      <TopBar title={id ? 'Edit Student' : 'Add New Student'} />
      <div className="page-content">
        <div className="form-card">
          <h3>{id ? 'Edit Student' : 'Add New Student'}</h3>

          {errors.submit && (
            <div className="toast error" style={{ position: 'static', marginBottom: '20px', animation: 'none' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name <span className="required">*</span></label>
                <input name="first_name" value={formData.first_name} onChange={handleChange} className={errors.first_name ? 'error' : ''} />
                {errors.first_name && <span className="field-error">{errors.first_name}</span>}
              </div>
              <div className="form-group">
                <label>Last Name <span className="required">*</span></label>
                <input name="last_name" value={formData.last_name} onChange={handleChange} className={errors.last_name ? 'error' : ''} />
                {errors.last_name && <span className="field-error">{errors.last_name}</span>}
              </div>
              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input name="email" type="email" placeholder="e.g. john@example.com" value={formData.email} onChange={handleChange} className={errors.email ? 'error' : ''} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input name="phone" type="tel" placeholder="Digits only (max 15)" maxLength="15" value={formData.phone} onChange={handleChange} className={errors.phone ? 'error' : ''} />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <input name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Course <span className="required">*</span></label>
                <input name="course" value={formData.course} onChange={handleChange} className={errors.course ? 'error' : ''} />
                {errors.course && <span className="field-error">{errors.course}</span>}
              </div>
              <div className="form-group">
                <label>Enrollment Year <span className="required">*</span></label>
                <input name="enrollment_year" type="number" min="2000" max="2030" value={formData.enrollment_year} onChange={handleChange} className={errors.enrollment_year ? 'error' : ''} />
                {errors.enrollment_year && <span className="field-error">{errors.enrollment_year}</span>}
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="graduated">Graduated</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={() => navigate('/')}>Cancel</button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Saving...' : id ? 'Update Student' : 'Add Student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

const SkeletonForm = () => (
  <div className="form-card">
    <div className="skeleton" style={{ height: '24px', width: '200px', marginBottom: '24px' }} />
    <div className="form-grid">
      {[1,2,3,4,5,6,7,8].map(i => (
        <div className="form-group" key={i}>
          <div className="skeleton" style={{ height: '14px', width: '80px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '40px', width: '100%' }} />
        </div>
      ))}
    </div>
  </div>
);

export default AddEditStudent;
