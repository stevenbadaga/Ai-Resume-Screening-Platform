/**
 * One-shot verification of the Supabase Storage connection (no repo changes):
 * lists buckets, creates the private `resumes` bucket if missing, and runs a
 * full upload → download → verify → delete round trip with a probe object.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
  const bucket = process.env.SUPABASE_RESUME_BUCKET || 'resumes';

  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.log('LIST BUCKETS FAILED:', error.message);
    process.exit(1);
  }
  console.log(
    'Buckets:',
    data.map((b) => b.name + (b.public ? ' (public!)' : ' (private)')).join(', ') || '(none)'
  );

  const found = data.find((b) => b.name === bucket);
  if (!found) {
    const { error: createErr } = await supabase.storage.createBucket(bucket, { public: false });
    console.log(
      createErr ? 'CREATE BUCKET FAILED: ' + createErr.message : `Bucket "${bucket}" created (private)`
    );
  } else {
    console.log(`Bucket "${bucket}" exists, public=${found.public}`);
  }

  // End-to-end round trip: upload → download → verify → delete
  const key = `resumes/evidence-probe-${Date.now()}.txt`;
  const payload = Buffer.from('recruitai storage probe ' + new Date().toISOString());
  const { error: upErr } = await supabase.storage.from(bucket).upload(key, payload, {
    contentType: 'text/plain',
  });
  if (upErr) {
    console.log('UPLOAD FAILED:', upErr.message);
    process.exit(1);
  }
  const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(key);
  if (dlErr || !blob) {
    console.log('DOWNLOAD FAILED:', dlErr?.message);
    process.exit(1);
  }
  const text = await blob.text();
  const { error: rmErr } = await supabase.storage.from(bucket).remove([key]);
  console.log(
    'ROUND TRIP:',
    text === payload.toString() ? 'OK (upload → download → verify → delete all passed)' : 'MISMATCH'
  );
  console.log('cleanup:', rmErr ? rmErr.message : 'probe object deleted');
}

main().catch((e) => {
  console.error('Probe crashed:', e instanceof Error ? e.message : e);
  process.exit(1);
});
