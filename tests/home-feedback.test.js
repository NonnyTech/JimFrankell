import test from 'node:test';
import assert from 'node:assert/strict';
import {handleStore} from '../server/store.js';
test('homepage feedback loads beyond a database page with only approved published-product fields',async()=>{
 const urls=[];
 const row={id:'review',name:'Buyer',rating:5,message:'Works well.',created_at:'2026-10-04',store_products:{product_name:'Camera',slug:'camera'}};
 const result=await handleStore({method:'GET',query:{resource:'home-reviews'}},{SUPABASE_URL:'https://test.supabase.co',SUPABASE_PUBLISHABLE_KEY:'public',SUPABASE_SERVICE_ROLE_KEY:'private'},async url=>{
 urls.push(url);return new Response(JSON.stringify(url.includes('offset=0')?Array.from({length:500},()=>row):[row]));
 });
 assert.equal(result.status,200);assert.equal(result.body.reviews.length,501);
 for(const url of urls){assert.ok(url.includes('status=eq.approved'));assert.ok(url.includes('store_products.published=eq.true'));assert.ok(!url.includes('email'));}
 assert.equal(result.body.reviews[0].productName,'Camera');
 assert.equal(result.body.reviews[0].store_products,undefined);
});
