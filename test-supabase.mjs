import { createClient } from '@supabase/supabase-js';
const adminSupabase = createClient('https://mxccdkqpahxsmahazssg.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.INVALID_KEY');
console.log(await adminSupabase.from('allowed_users').select('*').eq('email', 'fibrianproperty@gmail.com').single());
