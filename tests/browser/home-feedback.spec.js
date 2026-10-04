import {test,expect} from '@playwright/test';
import {products} from '../../src/data/products.js';
test('homepage rotates all feedback and submits a product review on mobile',async({page})=>{
 const reviews=Array.from({length:20},(_,i)=>({id:String(i),name:`Customer ${i+1}`,rating:5,message:`Helpful service and a reliable product. Review ${i+1}.`,created_at:'2026-10-04',productName:products[0].name,productSlug:products[0].slug}));
 let submitted;
 await page.route('**/api/store?**',async route=>{
 const resource=new URL(route.request().url()).searchParams.get('resource');
 let body=resource==='products'?{products,live:true}:resource==='home-reviews'?{reviews,enabled:true}:{configured:false};
 if(resource==='feedback'){submitted=route.request().postDataJSON();body={message:'Thank you for sharing your feedback.'};}
 await route.fulfill({contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.clock.install();
 await page.goto('/');
 const section=page.locator('#customer-feedback');
 await expect(section.locator('.feedback-person strong')).toHaveText('Customer 1');
 await page.clock.runFor(7100);
 await expect(section.locator('.feedback-person strong')).toHaveText('Customer 2');
 await section.getByRole('button',{name:'Pause feedback'}).click();
 await page.clock.runFor(15000);
 await expect(section.locator('.feedback-person strong')).toHaveText('Customer 2');
 for(let i=3;i<=20;i++){await section.getByRole('button',{name:'Next feedback'}).click();await expect(section.locator('.feedback-person strong')).toHaveText(`Customer ${i}`);}
 await section.getByRole('button',{name:'Next feedback'}).click();
 await expect(section.locator('.feedback-person strong')).toHaveText('Customer 1');
 await page.setViewportSize({width:390,height:844});
 await section.getByRole('combobox',{name:'Product purchased'}).selectOption(String(products[0].id));
 await section.getByLabel('Display name',{exact:true}).fill('Buyer');
 await section.getByLabel('Email address').fill('buyer@example.com');
 await section.getByRole('combobox',{name:'Rating',exact:true}).selectOption('4');
 await section.getByLabel('Your feedback',{exact:true}).fill('The camera works well for my home.');
 await section.getByRole('checkbox').check();
 await section.getByRole('button',{name:'Submit feedback'}).click();
 await expect(section.getByRole('status')).toContainText('Thank you for sharing your feedback.');
 expect(submitted.productId).toBe(products[0].id);
 expect(submitted.rating).toBe(4);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await section.screenshot({path:'test-results/home-feedback-mobile.png'});
});
