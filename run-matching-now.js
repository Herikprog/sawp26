const { createClient } = require('@supabase/supabase-js');

const url = 'https://asrvcsmsodqcpucdqqfy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcnZjc21zb2RxY3B1Y2RxcWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzIyNDQsImV4cCI6MjA5NDQwODI0NH0.9aLsF0AjYFtASEcMq5RvRBr6S64vuJgb3kOboxB59pk';

const supabase = createClient(url, key);

async function run() {
  const myUserId = 'a3d0d068-622d-42e4-aca0-967a9674a02f'; // bragawork01@gmail.com

  console.log('Testando get_nearby_matches corrigido no banco...');
  
  const { data: matches, error } = await supabase.rpc("get_nearby_matches", {
    p_user_id: myUserId,
    p_radius_km: 20
  });

  if (error) {
    console.error('Erro de execução retornado pela Supabase:', error);
    return;
  }

  console.log(`\n=== MATCHES RETORNADOS PELO BANCO: ${matches.length} ===`);
  matches.forEach((m, i) => {
    console.log(`${i+1}. Nome: ${m.nome}\n   ID: ${m.user_id}\n   Distância: ${m.distancia_km} km\n   Stickers Tem: [${m.stickers_tem}]\n   Stickers Precisa: [${m.stickers_precisa}]\n   Score: ${m.score}`);
  });
}

run();
