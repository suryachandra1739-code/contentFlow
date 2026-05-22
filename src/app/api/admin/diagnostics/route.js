import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { r2Client, BUCKET_NAME } from '@/lib/r2';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  const diagnostics = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      r2AccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      r2AccessKeyId: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
      r2SecretAccessKey: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      r2BucketName: !!process.env.CLOUDFLARE_R2_BUCKET_NAME,
      r2PublicUrl: !!process.env.CLOUDFLARE_R2_PUBLIC_URL || !!process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    },
    database: {
      connected: false,
      latencyMs: null,
      error: null,
    },
    storage: {
      connected: false,
      error: null,
    }
  };

  // 1. Database Check & Latency
  try {
    const supabase = await createClientServer();
    const dbStart = Date.now();
    
    // Run a lightweight query to test connectivity
    const { error } = await supabase.from('clients').select('id').limit(1);
    
    diagnostics.database.latencyMs = Date.now() - dbStart;
    if (error) {
      diagnostics.database.error = error.message;
      diagnostics.database.connected = false;
    } else {
      diagnostics.database.connected = true;
    }
  } catch (err) {
    diagnostics.database.connected = false;
    diagnostics.database.error = err.message;
  }

  // 2. Cloudflare R2 Connection Check
  if (diagnostics.env.r2AccountId && diagnostics.env.r2AccessKeyId && diagnostics.env.r2SecretAccessKey && diagnostics.env.r2BucketName) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        MaxKeys: 1,
      });
      await r2Client.send(command);
      diagnostics.storage.connected = true;
    } catch (err) {
      diagnostics.storage.connected = false;
      diagnostics.storage.error = err.message;
    }
  } else {
    diagnostics.storage.error = 'R2 credentials missing in environment variables';
  }

  return NextResponse.json(diagnostics);
}

export async function POST(request) {
  try {
    const supabaseServer = await createClientServer();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'test_rls_violation') {
      // Simulate RLS: Attempt to query the users table or a restricted table with the anon key
      // without standard auth. In Supabase, standard anonymous users shouldn't have access 
      // to critical tables if RLS is enabled.
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      // Attempting to select from the audit_log table anonymously
      const { data, error } = await anonClient
        .from('audit_log')
        .select('*')
        .limit(1);

      if (error) {
        return NextResponse.json({
          status: 'success_blocked',
          message: 'Security check passed: Anonymous select query was blocked by RLS.',
          code: error.code,
          details: error.message
        });
      }

      return NextResponse.json({
        status: 'failed_leak',
        message: 'Security warning: Row Level Security failed to block anonymous select. Data leaked.',
        data: data
      });
    }

    if (action === 'simulate_timeout') {
      // Mock delay to test loading states and client timeouts
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return NextResponse.json({
        status: 'done',
        message: 'Simulated API latency completed successfully.'
      });
    }

    if (action === 'simulate_server_error') {
      // Mock error to test error boundaries
      return NextResponse.json({
        error: 'Simulated Database Connection Crash (Error code: 0xDB_TIMEOUT_MOCK)'
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Invalid diagnostics action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
