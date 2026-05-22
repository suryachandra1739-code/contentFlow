'use client';
import { useState, useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function BreakPointsPage() {
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const addToast = useToast();

  const loadDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/diagnostics');
      const data = await res.json();
      setDiagnostics(data);
    } catch (e) {
      addToast('Failed to fetch diagnostics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiagnostics();
  }, []);

  const runSimulation = async (actionName, postData = {}) => {
    setRunningTest(actionName);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, ...postData })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Simulated action failed');
      }

      setTestResult({
        success: true,
        data: data
      });
      addToast('Simulation test run complete', 'success');
    } catch (e) {
      setTestResult({
        success: false,
        error: e.message
      });
      addToast(e.message, 'error');
    } finally {
      setRunningTest(null);
    }
  };

  const getRiskBadge = (level) => {
    const colors = {
      High: { bg: 'rgba(229,72,77,0.12)', color: 'var(--red)' },
      Medium: { bg: 'rgba(245,166,35,0.12)', color: 'var(--amber)' },
      Low: { bg: 'rgba(48,164,108,0.12)', color: 'var(--green)' }
    };
    const style = colors[level] || { bg: 'var(--bg-layer)', color: 'var(--text-secondary)' };
    return (
      <span className="badge" style={{ backgroundColor: style.bg, color: style.color, border: 'none', padding: '4px 10px', fontSize: 11 }}>
        {level} Risk
      </span>
    );
  };

  return (
    <div className="fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1>Break Points & Diagnostics</h1>
          <p>Analyze vulnerabilities, identify architectural limits, and simulate system failures.</p>
        </div>
        <button 
          onClick={loadDiagnostics} 
          className="btn btn-secondary" 
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Diagnostics'}
        </button>
      </div>

      {/* SECTION 1: Diagnostics Panel */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-body">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🛠️</span> Live Infrastructure Diagnostics
          </h2>
          
          {loading && !diagnostics ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>Querying environment health indicators...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              
              {/* Box 1: Env Config */}
              <div style={{ background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Environment Variables</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Supabase Url</span>
                    <span style={{ color: diagnostics?.env?.supabaseUrl ? 'var(--green)' : 'var(--red)' }}>{diagnostics?.env?.supabaseUrl ? '✓ Set' : '✗ Missing'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Supabase Anon Key</span>
                    <span style={{ color: diagnostics?.env?.supabaseAnonKey ? 'var(--green)' : 'var(--red)' }}>{diagnostics?.env?.supabaseAnonKey ? '✓ Set' : '✗ Missing'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Service Role Key</span>
                    <span style={{ color: diagnostics?.env?.supabaseServiceRoleKey ? 'var(--green)' : 'var(--red)' }}>{diagnostics?.env?.supabaseServiceRoleKey ? '✓ Set' : '✗ Missing'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Cloudflare R2 Variables</span>
                    <span style={{ color: (diagnostics?.env?.r2AccountId && diagnostics?.env?.r2AccessKeyId) ? 'var(--green)' : 'var(--red)' }}>
                      {(diagnostics?.env?.r2AccountId && diagnostics?.env?.r2AccessKeyId) ? '✓ Set' : '✗ Missing'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Database health */}
              <div style={{ background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Database Status (Supabase)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Connectivity</span>
                    <span style={{ fontWeight: 600, color: diagnostics?.database?.connected ? 'var(--green)' : 'var(--red)' }}>
                      {diagnostics?.database?.connected ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Query Latency</span>
                    <span style={{ fontFamily: 'var(--mono)' }}>{diagnostics?.database?.latencyMs ? `${diagnostics?.database?.latencyMs} ms` : 'N/A'}</span>
                  </div>
                  {diagnostics?.database?.error && (
                    <div style={{ fontSize: 11, color: 'var(--red)', wordBreak: 'break-all', marginTop: 4 }}>
                      Error: {diagnostics.database.error}
                    </div>
                  )}
                </div>
              </div>

              {/* Box 3: Storage health */}
              <div style={{ background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 12 }}>Cloud Storage Status (R2)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Connectivity</span>
                    <span style={{ fontWeight: 600, color: diagnostics?.storage?.connected ? 'var(--green)' : 'var(--red)' }}>
                      {diagnostics?.storage?.connected ? 'CONNECTED' : 'UNREACHABLE'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span>Bucket Configuration</span>
                    <span>{diagnostics?.env?.r2BucketName ? '✓ Found' : '✗ Missing'}</span>
                  </div>
                  {diagnostics?.storage?.error && (
                    <div style={{ fontSize: 11, color: 'var(--red)', wordBreak: 'break-all', marginTop: 4 }}>
                      Error: {diagnostics.storage.error}
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Chaos Simulator */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-body">
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>🔥 Chaos & Failure Engine (Simulations)</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 14 }}>
            Click any simulation trigger below to invoke server failures and verify how ContentFlow's UI, error boundaries, and API error handlers intercept exceptions.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => runSimulation('test_rls_violation')}
              disabled={!!runningTest}
            >
              🔒 Test Anonymous RLS Block
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => runSimulation('simulate_timeout')}
              disabled={!!runningTest}
            >
              ⏳ Simulate Network Latency (3s)
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ borderColor: 'var(--red)' }}
              onClick={() => runSimulation('simulate_server_error')}
              disabled={!!runningTest}
            >
              💥 Trigger Database Crash (500)
            </button>
          </div>

          {/* Test Results Output */}
          {(runningTest || testResult) && (
            <div style={{ background: 'var(--bg-layer)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16, fontFamily: 'var(--mono)', fontSize: 13 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', fontWeight: 600 }}>Chaos Engine Output Console</div>
              
              {runningTest ? (
                <div style={{ color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="spinner" style={{ display: 'inline-block', width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--amber)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }} />
                  Running simulation task: '{runningTest}'...
                </div>
              ) : (
                <div>
                  <div style={{ color: testResult.success ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
                    Status: {testResult.success ? 'Simulation Executed Successfully' : 'Simulation Exception Caught'}
                  </div>
                  <pre style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: 12, color: 'var(--text-primary)' }}>
                    {JSON.stringify(testResult.data || testResult.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Failure Modes Catalog */}
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>📋 Failure Modes & Architectural Weaknesses Catalog</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 40 }}>
        
        {/* Failure Mode 1 */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>1. Next.js Server Media Buffering</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'block', marginTop: 2 }}>
                  File Reference: <a href="file:///Users/a/.gemini/antigravity/scratch/content-approval/src/components/upload/MediaUpload.jsx" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>src/components/upload/MediaUpload.jsx</a>
                </span>
              </div>
              {getRiskBadge('Resolved')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              <strong>Vulnerability:</strong> High-resolution photos and videos (up to 500MB) were previously buffered entirely in memory before saving to Cloudflare R2, triggering Out of Memory (OOM) errors and timeouts on serverless runtimes.
            </p>
            <div style={{ padding: 12, background: 'var(--bg-layer)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fix Implemented</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Re-engineered the client upload process to request a time-limited presigned URL from <code>/api/upload/presign</code> and stream the file payload directly to R2. The Next.js server is bypassed during the data stream, eliminating body-size limits.
              </span>
            </div>
          </div>
        </div>

        {/* Failure Mode 2 */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>2. RLS Public Review Token Restrictions</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'block', marginTop: 2 }}>
                  File Reference: <a href="file:///Users/a/.gemini/antigravity/scratch/content-approval/src/app/actions/review.js#L26" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>src/app/actions/review.js:L26</a>
                </span>
              </div>
              {getRiskBadge('Resolved')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              <strong>Vulnerability:</strong> Public review approvals submitted without active login session cookies failed because anonymous clients were blocked by Supabase Row-Level Security (RLS) constraints on the <code>posts</code> database table.
            </p>
            <div style={{ padding: 12, background: 'var(--bg-layer)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fix Implemented</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Configured the server action <code>submitReview</code> to instantiate a secure privileged client using the <code>SUPABASE_SERVICE_ROLE_KEY</code> when a valid <code>review_token</code> is supplied, safely bypassing public RLS limits.
              </span>
            </div>
          </div>
        </div>

        {/* Failure Mode 3 */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>3. Static Cache Inconsistencies</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'block', marginTop: 2 }}>
                  File Reference: <a href="file:///Users/a/.gemini/antigravity/scratch/content-approval/src/app/api/analytics/route.js#L5" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>src/app/api/analytics/route.js:L5</a>
                </span>
              </div>
              {getRiskBadge('Resolved')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              <strong>Vulnerability:</strong> Next.js App Router aggressively caches static fetch responses, meaning page lists and dashboards did not reflect newly added clients or updated review statistics without manually forcing cache purges.
            </p>
            <div style={{ padding: 12, background: 'var(--bg-layer)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fix Implemented</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Forced dynamic rendering across listing and analytics endpoints (<code>src/app/api/clients/route.js</code> and <code>src/app/api/analytics/route.js</code>) via <code>export const dynamic = 'force-dynamic'</code>.
              </span>
            </div>
          </div>
        </div>

        {/* Failure Mode 4 */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>4. Presigned Signature Expiration</h3>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--mono)', display: 'block', marginTop: 2 }}>
                  File Reference: <a href="file:///Users/a/.gemini/antigravity/scratch/content-approval/src/components/upload/MediaUpload.jsx" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>src/components/upload/MediaUpload.jsx</a>
                </span>
              </div>
              {getRiskBadge('Resolved')}
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}>
              <strong>Vulnerability:</strong> Presigned upload URLs expire after a short window (e.g. 15 minutes). Generating links on page mount meant they expired if a user remained idle in the form page before uploading.
            </p>
            <div style={{ padding: 12, background: 'var(--bg-layer)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--green)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Fix Implemented</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                Shifted the presigned URL request logic to invoke instantly when a file drops or is selected by the user, assuring the S3 signature is fresh when the PUT stream initiates.
              </span>
            </div>
          </div>
        </div>

      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
