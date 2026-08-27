import { NextResponse } from 'next/server';
import connectMongoose from '@/lib/db/mongoose';
import Site from '@/lib/models/Site';
import Page from '@/lib/models/Page';
import Suggestion from '@/lib/models/Suggestion';

/**
 * Migración única: Renombra accountId a organizationId en todos los documentos
 * Uso: GET /api/admin/migrate-accountid
 * Protegido por token de verificación simple
 */

export async function GET(request: Request) {
  try {
    // Protección simple: requerir token en query param
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token !== process.env.MIGRATION_TOKEN) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid migration token' },
        { status: 401 }
      );
    }

    console.log('Iniciando migración de accountId a organizationId...');

    await connectMongoose();

    // Migrate Sites
    console.log('Migrando Sites...');
    const sitesResult = await Site.collection.updateMany(
      { accountId: { $exists: true }, organizationId: { $exists: false } },
      { $rename: { accountId: 'organizationId' } }
    );
    console.log(`✓ Sites migrados: ${sitesResult.modifiedCount} documentos`);

    // Migrate Pages
    console.log('Migrando Pages...');
    const pagesResult = await Page.collection.updateMany(
      { accountId: { $exists: true }, organizationId: { $exists: false } },
      { $rename: { accountId: 'organizationId' } }
    );
    console.log(`✓ Pages migrados: ${pagesResult.modifiedCount} documentos`);

    // Migrate Suggestions
    console.log('Migrando Suggestions...');
    const suggestionsResult = await Suggestion.collection.updateMany(
      { accountId: { $exists: true }, organizationId: { $exists: false } },
      { $rename: { accountId: 'organizationId' } }
    );
    console.log(`✓ Suggestions migrados: ${suggestionsResult.modifiedCount} documentos`);

    const total =
      (sitesResult.modifiedCount || 0) +
      (pagesResult.modifiedCount || 0) +
      (suggestionsResult.modifiedCount || 0);

    return NextResponse.json(
      {
        success: true,
        message: 'Migración completada exitosamente',
        stats: {
          sites: sitesResult.modifiedCount,
          pages: pagesResult.modifiedCount,
          suggestions: suggestionsResult.modifiedCount,
          total,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
