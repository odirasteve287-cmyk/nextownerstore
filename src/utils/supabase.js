import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xfkfxgeofwvomuxsvmjk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhma2Z4Z2VvZnd2b211eHN2bWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNTM1MjMsImV4cCI6MjA4NTYyOTUyM30.IB4gtLZMjEGMbPgWoxDIMxEsBr7lmG1oE20jgNFYHJ8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);