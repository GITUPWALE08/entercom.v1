import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

console.log('Testing connection to Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testUpload() {
  try {
    const filename = `test_upload_${Date.now()}.txt`;
    const fileContent = "This is a test file for isolating the Supabase upload issue.";
    
    console.log(`\nAttempting to upload ${filename} to 'entercom-media' bucket...`);
    
    const { data, error } = await supabase.storage
      .from('entercom-media')
      .upload(filename, fileContent, {
        contentType: 'text/plain',
        upsert: false
      });
      
    if (error) {
      console.error('\n❌ Upload Failed!');
      console.error(error);
      return;
    }
    
    console.log('\n✅ Upload Successful!');
    console.log('Data:', data);
    
    const { data: publicUrlData } = supabase.storage
      .from('entercom-media')
      .getPublicUrl(filename);
      
    console.log('Public URL:', publicUrlData.publicUrl);
    
  } catch (err) {
    console.error('\n❌ Exception during upload:', err);
  }
}

testUpload();
