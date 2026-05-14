'use client';
import { useState } from 'react';
import { submitReview } from '@/app/actions/review';
import { useToast } from '@/components/Toast';

export default function PostReviewActions({ post, token = null }) {
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const addToast = useToast();

  const isActioned = post.status !== 'pending' && post.status !== 'draft';

  const handleAction = async (action) => {
    if (action === 'reject' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    if (action === 'reject' && !comment.trim()) {
      addToast('Please provide feedback for the requested changes.', 'error');
      return;
    }

    setLoading(true);
    const res = await submitReview(post.id, action, comment, token);
    
    if (res.error) {
      addToast(res.error, 'error');
      setLoading(false);
    } else {
      addToast(`Post ${action === 'approve' ? 'approved' : 'changes requested'} successfully`, 'success');
      setLoading(false);
      setShowRejectInput(false);
    }
  };

  if (isActioned) {
    return (
      <div className="card" style={{ border: `1px solid ${post.status === 'approved' ? 'var(--green)' : 'var(--cyan)'}` }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 20, background: post.status === 'approved' ? 'rgba(48,164,108,0.1)' : 'rgba(24,196,218,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            {post.status === 'approved' ? '✓' : '↩'}
          </div>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              {post.status === 'approved' ? 'You approved this post' : 'You requested changes'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              No further action required right now.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-body">
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Your Decision</h3>
        
        {showRejectInput ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="fade-in">
            <div className="form-group">
              <label className="form-label">What needs to be changed?</label>
              <textarea 
                className="form-input" 
                rows={4} 
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Please adjust the colors..."
                disabled={loading}
              />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setShowRejectInput(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleAction('reject')}
                disabled={loading}
                style={{ flex: 2, background: 'var(--cyan)', color: '#000' }}
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16 }}>
            <button 
              className="btn btn-primary" 
              onClick={() => handleAction('approve')}
              disabled={loading}
              style={{ flex: 1, padding: '16px', fontSize: 16, background: 'var(--green)' }}
            >
              {loading ? 'Processing...' : 'Approve Post'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => handleAction('reject')}
              disabled={loading}
              style={{ flex: 1, padding: '16px', fontSize: 16 }}
            >
              Request Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
