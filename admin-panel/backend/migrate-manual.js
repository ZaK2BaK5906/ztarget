const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  // Lire le DATABASE_URL depuis .env
  require('dotenv').config();

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL non trouvé dans .env');
    process.exit(1);
  }

  // Parser l'URL de connexion
  const match = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.error('❌ Format DATABASE_URL invalide');
    process.exit(1);
  }

  const [, user, password, host, port, database] = match;

  console.log('📦 Connexion à la base de données...');
  console.log(`   Host: ${host}:${port}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${user}`);

  try {
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database
    });

    console.log('✅ Connecté à la base de données');

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'prisma', 'migrations', 'add_rp_hours_and_banned.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Séparer les commandes SQL
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));

    console.log(`\n🔄 Exécution de ${statements.length} commandes SQL...\n`);

    for (const statement of statements) {
      if (statement) {
        console.log(`   Exécution: ${statement.substring(0, 60)}...`);
        try {
          await connection.execute(statement);
          console.log('   ✅ OK');
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('   ⚠️  Colonne déjà existante (ignoré)');
          } else {
            throw error;
          }
        }
      }
    }

    console.log('\n✅ Migration terminée avec succès !');
    console.log('\n📝 Prochaines étapes:');
    console.log('   1. Arrêtez le serveur backend (Ctrl+C)');
    console.log('   2. Supprimez le dossier node_modules/@prisma');
    console.log('   3. Réinstallez: npm install');
    console.log('   4. Relancez: npm run dev');

    await connection.end();
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    process.exit(1);
  }
}

runMigration();
