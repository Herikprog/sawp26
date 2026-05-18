const { createClient } = require('@supabase/supabase-js');

const url = 'https://asrvcsmsodqcpucdqqfy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzcnZjc21zb2RxY3B1Y2RxcWZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgzMjI0NCwiZXhwIjoyMDk0NDA4MjQ0fQ.pAvN9tmgpyhdvcck1G4tZQYhiUyvAazZ5MinHYX43fY';

const supabase = createClient(url, serviceKey);

async function run() {
  const userId = 'a3d0d068-622d-42e4-aca0-967a9674a02f'; // bragawork01@gmail.com
  
  // 1. Obter a localização atual do seu perfil logado
  const { data: userProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('location')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Erro ao buscar perfil do utilizador:', fetchError);
    return;
  }

  let baseLat = 38.7223; // Lisboa por padrão
  let baseLng = -9.1393;

  if (userProfile && userProfile.location) {
    console.log('Localização encontrada no seu utilizador:', userProfile.location);
    if (userProfile.location.coordinates) {
      baseLng = userProfile.location.coordinates[0];
      baseLat = userProfile.location.coordinates[1];
      console.log(`Localização ativa do utilizador capturada: Lat ${baseLat}, Lng ${baseLng}`);
    }
  } else {
    console.log('Seu utilizador ainda não tem localização salva. Usando Lisboa como base para seed.');
  }

  console.log(`Posicionando utilizadores de teste ao redor das coordenadas: Lat ${baseLat}, Lng ${baseLng}`);

  // 2. Definir coordenadas ligeiramente deslocadas para Kelly, Clara e Gabbiel
  const updates = [
    { id: '3285347b-b990-453d-83d4-32ee6c46500f', name: 'Kelly Freire Da Cruz', lat: baseLat + 0.008, lng: baseLng + 0.012 }, // ~1.3 km de distância
    { id: '6f43a825-faa6-4515-b639-724c343ee8ba', name: 'Clara Silva', lat: baseLat - 0.005, lng: baseLng - 0.025 }, // ~2.8 km de distância
    { id: '39449ca2-592e-45ed-bdd9-e1621f0e5b3e', name: 'Gabbiel', lat: baseLat - 0.022, lng: baseLng + 0.035 }, // ~4.9 km de distância
  ];

  for (const item of updates) {
    const point = `POINT(${item.lng} ${item.lat})`;
    const { error } = await supabase.from('profiles')
      .update({ location: point })
      .eq('id', item.id);

    if (error) {
      console.error(`Erro ao atualizar localização de ${item.name}:`, error);
    } else {
      console.log(`[SUCESSO] Localização de ${item.name} atualizada para ${point}`);
    }
  }
  
  console.log('Seeding de geolocalizações concluído com sucesso!');
}

run();
