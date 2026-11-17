import test from 'node:test';import assert from 'node:assert/strict';import {amazonListUrl,amazonSearchUrl,splitInterests,rankProducts} from '../../tools/wishes/public-profile-model.mjs';
test('wishlist URLs reject deceptive destinations and replace affiliate IDs',()=>{
 for(const url of ['https://evil.test/hz/wishlist/ls/ABC','https://amazon.de.evil.test/hz/wishlist/ls/ABC','http://amazon.de/hz/wishlist/ls/ABC','https://user@amazon.de/hz/wishlist/ls/ABC','https://amazon.de:444/hz/wishlist/ls/ABC','https://amazon.de/dp/B012345678'])assert.equal(amazonListUrl(url),null);
 const u=new URL(amazonListUrl('https://www.amazon.de/hz/wishlist/ls/ABC?tag=other-21#fragment'));assert.equal(u.search,'?tag=duhrrom-21');assert.equal(u.hash,'');
 assert.equal(new URL(amazonSearchUrl('Bücher & Tee')).searchParams.get('k'),'Bücher & Tee');
});
test('interests are bounded; product matching does not invent products',()=>{
 assert.deepEqual(splitInterests('Bücher, Garten, Bücher'),['Bücher','Garten']);assert.throws(()=>splitInterests(Array.from({length:13},(_,i)=>'Interest'+i).join(',')));
 const products=[{asin:'B012345678',title:'Lampe',keywords:['Bücher']},{asin:'bad',title:'Invalid',keywords:['Bücher']}];
 assert.equal(rankProducts(products,{bio:'Ich liebe Bücher'}).length,1);assert.equal(rankProducts(products,{bio:'Garten'}).length,0);
});
