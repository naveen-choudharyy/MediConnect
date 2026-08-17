import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const DoctorSearch = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search state
  const [search, setSearch] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [minExperience, setMinExperience] = useState('');
  const [maxFee, setMaxFee] = useState('');

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (specialization) params.append('specialization', specialization);
      if (minExperience) params.append('minExperience', minExperience);
      if (maxFee) params.append('maxFee', maxFee);

      const data = await apiRequest(`/doctors?${params.toString()}`);
      if (data.success) {
        setDoctors(data.doctors);
      }
    } catch (err) {
      setError('Failed to fetch doctor list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDoctors();
  };

  return (
    <div>
      <h1>Find a Doctor</h1>

      {error && <div className="alert-banner alert-banner-error">{error}</div>}

      {/* Filter panel */}
      <div className="search-filter-panel">
        <form onSubmit={handleSearchSubmit} className="search-filter-form">
          <div>
            <label htmlFor="search">Name or Specialization</label>
            <input
              type="text"
              id="search"
              placeholder="e.g. Smith or Cardiology"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="minExperience">Min Experience (Years)</label>
            <input
              type="number"
              id="minExperience"
              placeholder="e.g. 5"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
              min={0}
            />
          </div>

          <div>
            <label htmlFor="maxFee">Max Fee ($)</label>
            <input
              type="number"
              id="maxFee"
              placeholder="e.g. 200"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
              min={0}
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Results */}
      {loading ? (
        <p>Searching doctors...</p>
      ) : doctors.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {doctors.map((doc) => (
            <div key={doc._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Dr. {doc.user.name}</h3>
                <p style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  {doc.specialization}
                </p>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div>
                    <strong>Qualification:</strong> {doc.qualification}
                  </div>
                  <div>
                    <strong>Experience:</strong> {doc.experience} Years
                  </div>
                  <div>
                    <strong>Consultation Fee:</strong> ${doc.consultationFee}
                  </div>
                </div>
                {doc.bio && (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
                    {doc.bio.substring(0, 150)}{doc.bio.length > 150 ? '...' : ''}
                  </p>
                )}
              </div>
              <div>
                <Link to={`/book/${doc.user._id}`} className="btn btn-primary">
                  View Availability & Book
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No doctors found matching the search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default DoctorSearch;
