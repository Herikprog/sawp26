const { createClient } = require('@supabase/supabase-js');

const url = 'https://asrvcsmsodqcpucdqqfy.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcnZjc21zb2RxY3B1Y2RxcWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MzIyNDQsImV4cCI6MjA5NDQwODI0NH0.9aLsF0AjYFtASEcMq5RvRBr6S64vuJgb3kOboxB59pk';

const supabase = createClient(url, key);

async function run() {
  const myUserId = 'a3d0d068-622d-42e4-aca0-967a9674a02f'; // bragawork01@gmail.com
  const friendId = '39449ca2-592e-45ed-bdd9-e1621f0e5b3e'; // Gabbiel

  // Vamos usar RPC ou uma query para extrair as coordenadas reais em formato texto
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, nome, location')
    .in('id', [myUserId, friendId]);

  if (error) {
    console.error('Erro ao buscar perfis:', error);
    return;
  }

  console.log(`Perfis carregados: ${profiles.length}`);
  profiles.forEach(p => {
    console.log(`- ${p.nome}: ${JSON.stringify(p.location)}`);
  });

  // Consultar a distância diretamente via SQL no banco usando um RPC que retorna a distância
  // Se não temos a função de distância exposta, podemos calcular a distância em JS usando a fórmula de Haversine
  const p1 = profiles.find(p => p.id === myUserId);
  const p2 = profiles.find(p => p.id === friendId);

  if (!p1 || !p2 || !p1.location || !p2.location) {
    console.log('Algum dos perfis não tem geolocalização ativa!');
    return;
  }

  const coords1 = p1.location.coordinates;
  const coords2 = p2.location.coordinates;

  const lon1 = coords1[0], lat1 = coords1[1];
  const lon2 = coords2[0], lat2 = coords2[1];

  console.log(`\nCoordenadas formatadas:`);
  console.log(`- Meu perfil (bragawork01): Lng ${lon1}, Lat ${lat1}`);
  console.log(`- Amigo (Gabbiel): Lng ${lon2}, Lat ${lat2}`);

  // Fórmula de Haversine
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  console.log(`\nDistância física real calculada: ${distance.toFixed(3)} km`);
}

run();
