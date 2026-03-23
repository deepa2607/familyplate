import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useToast } from '../components/Toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Members() {
  const toast = useToast();
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [memberName, setMemberName] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}')?.user; } catch { return null; }
  })();

  // FIXED load() - proper hhId + members fetch
  const load = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/household/myhousehold`, { headers });
      if (res.data) {
        setHousehold(res.data);
        const hhId = res.data._id || res.data.id;
        console.log('Household ID:', hhId);
        
        const mRes = await axios.get(`${API}/household/${hhId}/members`, { headers }).catch(() => ({ data: [] }));
        const pRes = await axios.get(`${API}/purchase/${hhId}`, { headers }).catch(() => ({ data: [] }));
        
        console.log('Members loaded:', mRes.data);
        setMembers(mRes.data);
        setPurchases(pRes.data);
      }
    } catch (err) {
      console.error('Load failed:', err.response?.status);
      if (err.response?.status === 401) toast('Session expired.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const tryAddMember = async (hhId, name) => {
    const body = { householdId: hhId, name };
    const routes = [
      `${API}/household/member`,
      `${API}/household/add-member`,
      `${API}/household/${hhId}/member`
    ];
    
    for (const route of routes) {
      try {
        return await axios.post(route, body, { headers });
      } catch (err) {
        if (err.response?.status !== 404) throw err;
      }
    }
    throw new Error('All routes failed');
  };

  const addMember = async () => {
    if (!memberName.trim()) return;
    if (!household) return toast('Setup household first.', 'error');
    
    const hhId = household._id || household.id;
    setAdding(true);
    
    try {
      await tryAddMember(hhId, memberName.trim());
      setMemberName('');
      await load();  // FIXED: Refresh display
      toast('Member added successfully!', 'success');
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;
      if (status === 409) toast('Member already exists.', 'error');
      else if (status === 400) toast(msg || 'Invalid request.', 'error');
      else toast('Network error. Check server.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const deleteMember = async (id, name) => {
    setDelConfirm(null);
    try {
      await axios.delete(`${API}/household/member/${id}`, { headers });
      await load();
      toast(`${name} removed.`, 'info');
    } catch (err) {
      toast('Remove failed.', 'error');
    }
  };

  if (loading) return <div className="loading">Loading household...</div>;

  const displayMembers = members.map(m => ({
    ...m,
    isYou: m._id === currentUser?._id || m.id === currentUser?.id
  }));

  return (
    <div className="members-page">
      {!household && (
        <div className="no-household">
          <p>No household found. <a href="/setup">Set up your household</a></p>
        </div>
      )}
      
      {household && (
        <>
          {/* Your hero/stats unchanged */}
          <div className="hero-section">{/* your existing hero code */}</div>
          
          {/* Add Member - FIXED */}
          <div className="add-member-card">
            <h3>Add New Member</h3>
            <div className="input-group">
              <input
                placeholder="Enter member name e.g. Priya, Rahul"
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMember()}
              />
              <button 
                onClick={addMember} 
                disabled={adding || displayMembers.length >= 10}
              >
                {adding ? 'Adding...' : 'Add Member'}
              </button>
            </div>
            {displayMembers.length >= 10 && <p>Max 10 members reached.</p>}
          </div>

          {/* Members Grid - FIXED display */}
          <div className="members-grid">
            <h3>Household Members ({displayMembers.length})</h3>
            {displayMembers.length === 0 ? (
              <div className="empty-state">
                <p>No members yet. Add your first family member above.</p>
              </div>
            ) : (
              displayMembers.map((m, i) => (
                <div key={m._id || m.id} className="member-card">
                  <div className="member-avatar" style={{ backgroundImage: `url(${m.avatar})` }}>
                    {!m.avatar && <span>{m.name[0]}</span>}
                  </div>
                  <div className="member-info">
                    <h4>{m.name} {m.isYou && '(You)'}</h4>
                    <p style={{ color: m.status === 'pending' ? '#ff6b2b' : '#9c8672' }}>
                      {m.status === 'pending' ? 'Pending Invite' : m.role || 'Member'}
                    </p>
                    {m.email && <small>{m.email}</small>}
                  </div>
                  {!m.isYou && (
                    <button 
                      onClick={() => setDelConfirm(m._id || m.id)}
                      className="delete-btn"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {delConfirm && (
            <div className="confirm-delete">
              <p>Remove this member?</p>
              <button onClick={() => deleteMember(delConfirm, members.find(m => m._id === delConfirm || m.id === delConfirm)?.name)}>
                Yes
              </button>
              <button onClick={() => setDelConfirm(null)}>No</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
