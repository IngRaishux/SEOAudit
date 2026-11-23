/**
 * Verifica que los datos de membresías cumplan las reglas de roles antes de desplegar:
 * - ninguna membresía con un rol fuera de owner|admin|editor|viewer (p. ej. el antiguo `member`)
 * - cada organización con exactamente un owner
 *
 * Solo lectura por defecto. Con --fix convierte las membresías `member` en `editor`.
 *
 * Uso: MONGODB_URI=... MONGODB_DB_NAME=... npx tsx scripts/verify-org-roles.ts [--fix]
 */
import { MongoClient, ObjectId } from 'mongodb';

const VALID_ROLES = ['owner', 'admin', 'editor', 'viewer'];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI no está definida');
  const fix = process.argv.includes('--fix');

  const client = await MongoClient.connect(uri);
  try {
    const db = client.db(process.env.MONGODB_DB_NAME || undefined);
    const memberships = db.collection('memberships');
    const organizations = db.collection('organizations');
    let problems = 0;

    const invalidRoles = await memberships.find({ role: { $nin: VALID_ROLES } }).toArray();
    console.log(`Membresías con rol inválido: ${invalidRoles.length}`);
    for (const m of invalidRoles) {
      console.log(`  - ${m._id} user=${m.userId} org=${m.organizationId} role=${m.role}`);
    }

    if (fix && invalidRoles.length > 0) {
      const res = await memberships.updateMany({ role: 'member' }, { $set: { role: 'editor' } });
      console.log(`  --fix: ${res.modifiedCount} membresías 'member' -> 'editor'`);
      const remaining = await memberships.countDocuments({ role: { $nin: VALID_ROLES } });
      problems += remaining;
    } else {
      problems += invalidRoles.length;
    }

    const ownerCounts = await memberships
      .aggregate<{ _id: ObjectId; owners: number }>([
        { $match: { role: 'owner' } },
        { $group: { _id: '$organizationId', owners: { $sum: 1 } } },
      ])
      .toArray();
    const ownersByOrg = new Map(ownerCounts.map((o) => [String(o._id), o.owners]));

    const orgs = await organizations.find({}, { projection: { name: 1 } }).toArray();
    const badOrgs = orgs.filter((o) => ownersByOrg.get(String(o._id)) !== 1);
    console.log(`Organizaciones: ${orgs.length}; sin exactamente un owner: ${badOrgs.length}`);
    for (const o of badOrgs) {
      console.log(`  - ${o._id} "${o.name}" owners=${ownersByOrg.get(String(o._id)) ?? 0}`);
    }
    problems += badOrgs.length;

    console.log(problems === 0 ? '\nOK: sin problemas' : `\n${problems} problema(s) por corregir`);
    process.exitCode = problems === 0 ? 0 : 1;
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
