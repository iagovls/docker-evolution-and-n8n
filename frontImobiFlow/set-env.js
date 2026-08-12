require('dotenv').config();
const fs = require('fs');
const path = require('path');

const envDir = path.join(__dirname, 'src', 'environments');

const content = (prod) => `export const environment = {
  production: ${prod},
  supabaseUrl: '${process.env.SUPABASE_URL ?? ''}',
  supabaseAnonKey: '${process.env.SUPABASE_ANON_KEY ?? ''}',
};
`;

fs.writeFileSync(path.join(envDir, 'environment.ts'), content(false));
fs.writeFileSync(path.join(envDir, 'environment.prod.ts'), content(true));

console.log('[set-env] Arquivos environment gerados a partir do .env');
