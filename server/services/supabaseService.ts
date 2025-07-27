import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://cbtprwchlcfbirazjgyq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNidHByd2NobGNmYmlyYXpqZ3lxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NTgwMzUsImV4cCI6MjA2NzEzNDAzNX0.gjJBOKjBZ64SBX1rgXGkbAxAowY3jUdSrwRNxa6K6X4'
);

export async function getYields(region: string) {
  const { data, error } = await supabase.from('yields').select('*').eq('region', region);
  if (error) throw error;
  return data;
}

export async function insertYield(data: any) {
  const { data: result, error } = await supabase.from('yields').insert([data]);
  if (error) throw error;
  return result;
}

export async function backupUser(user: any) {
  const { data, error } = await supabase.from('users').insert([user]);
  if (error) throw error;
  return data;
}

export async function getUser(id: string) {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function backupResetRequest(resetRequest: any) {
  const { data, error } = await supabase.from('resetRequests').insert([resetRequest]);
  if (error) throw error;
  return data;
}

export async function getResetRequest(id: string) {
  const { data, error } = await supabase.from('resetRequests').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
} 