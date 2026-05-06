import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const client = new DynamoDBClient({ region: process.env.AWS_REGION ?? 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMO_TABLE_NAME!;
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: tsx scripts/import-to-dynamo.ts <path-to-json>');
  process.exit(1);
}

const items: Record<string, unknown>[] = JSON.parse(
  readFileSync(resolve(filePath), 'utf-8')
);

const BATCH_SIZE = 25;

for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await docClient.send(
    new BatchWriteCommand({
      RequestItems: {
        [TABLE_NAME]: batch.map((Item) => ({ PutRequest: { Item } })),
      },
    })
  );
  console.log(`Imported ${Math.min(i + BATCH_SIZE, items.length)} / ${items.length}`);
}

console.log('Done.');
