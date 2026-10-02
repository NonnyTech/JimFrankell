import test from 'node:test';
import assert from 'node:assert/strict';
import { database } from '../server/store-db.js';
test('database accepts successful empty write responses', async () => {
 const db = database({SUPABASE_URL:'https://test.supabase.co', SUPABASE_SERVICE_ROLE_KEY:'test'}, async () => new Response(null,{status:201}));
 assert.equal(await db.rest('store_products',{method:'POST',body:'[]'}),null);
});
