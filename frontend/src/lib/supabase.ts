// Cliente Supabase compartido — mismo proyecto que Statia Go
// by Jose Rodas
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://rkfwhwgktcafsaitlhbl.supabase.co',
  'sb_publishable_Td1jsjzst-fcqGv8jGZ_ww_D_Jzbj6_',
);
