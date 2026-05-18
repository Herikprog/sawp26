function decodeWKBPoint(wkbHex) {
  const buffer = Buffer.from(wkbHex, 'hex');
  const isLittleEndian = buffer[0] === 1;
  const lon = isLittleEndian ? buffer.readDoubleLE(9) : buffer.readDoubleBE(9);
  const lat = isLittleEndian ? buffer.readDoubleLE(17) : buffer.readDoubleBE(17);
  return { lon, lat };
}

const myWKB = "0101000020E6100000D659B44D06EB20C03EB202D374914240"; // bragawork01@gmail.com
const friendWKB = "0101000020E6100000389AC8714C1321C02159C0046E914240"; // Gabbiel

const p1 = decodeWKBPoint(myWKB);
const p2 = decodeWKBPoint(friendWKB);

console.log('Meu Perfil (bragawork01):');
console.log(`- Longitude: ${p1.lon}`);
console.log(`- Latitude: ${p1.lat}`);

console.log('\nPerfil do Amigo (Gabbiel):');
console.log(`- Longitude: ${p2.lon}`);
console.log(`- Latitude: ${p2.lat}`);

// Fórmula de Haversine
const R = 6371; // Raio da Terra em km
const dLat = (p2.lat - p1.lat) * Math.PI / 180;
const dLon = (p2.lon - p1.lon) * Math.PI / 180;
const a = 
  Math.sin(dLat/2) * Math.sin(dLat/2) +
  Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
  Math.sin(dLon/2) * Math.sin(dLon/2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
const distance = R * c;

console.log(`\nDistância calculada: ${distance.toFixed(4)} km (${(distance * 1000).toFixed(1)} metros)`);
