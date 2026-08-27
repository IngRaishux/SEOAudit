import connectMongoose from '@/lib/db/mongoose';
import Site from '@/lib/models/Site';
import Page from '@/lib/models/Page';
import Suggestion from '@/lib/models/Suggestion';

async function migrateAccountIdToOrganizationId() {
  try {
    console.log('Iniciando migración de accountId a organizationId...');

    await connectMongoose();

    // Migrate Sites
    console.log('Migrando Sites...');
    const sitesResult = await Site.updateMany(
      { accountId: { $exists: true }, organizationId: { $exists: false } },
      { $rename: { accountId: 'organizationId' } }
    );
    console.log(`✓ Sites migrados: ${sitesResult.modifiedCount} documentos`);

    // Migrate Pages
    console.log('Migrando Pages...');
    const pagesResult = await Page.updateMany(
      { accountId: { $exists: true }, organizationId: { $exists: false } },
      { $rename: { accountId: 'organizationId' } }
    );
    console.log(`✓ Pages migrados: ${pagesResult.modifiedCount} documentos`);

    // Migrate Suggestions
    console.log('Migrando Suggestions...');
    const suggestionsResult = await Suggestion.updateMany(
      { accountId: { $exists: true }, organizationId: { $exists: false } },
      { $rename: { accountId: 'organizationId' } }
    );
    console.log(`✓ Suggestions migrados: ${suggestionsResult.modifiedCount} documentos`);

    console.log('\n✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

migrateAccountIdToOrganizationId();
