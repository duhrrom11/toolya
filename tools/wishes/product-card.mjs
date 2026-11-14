export function appendProductMetadata(card,product,{image=true}={}){
 if(!product)return;
 if(image&&product.image_url){const img=document.createElement('img');img.src=product.image_url;img.alt=product.title||'Produktbild';img.loading='lazy';img.referrerPolicy='no-referrer';img.width=140;img.height=140;img.style.objectFit='contain';card.append(img)}
 if(product.price!==null&&product.price!==undefined){const price=document.createElement('p');price.textContent=new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(product.price)+' · Preis beim Import';card.append(price)}
 if(product.description){const desc=document.createElement('p');desc.textContent=product.description;card.append(desc)}
}
