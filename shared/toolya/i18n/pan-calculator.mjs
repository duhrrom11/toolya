/** Public English pan calculator. Pure maths, no Supabase, cookies or storage. */
export function panArea(shape,length,width=length){
 if (!Number.isFinite(length) || length<=0 || length>500) throw new RangeError('Enter a valid pan dimension.');
 if(shape==='round')return Math.PI*Math.pow(length/2,2);
 if(shape!=='rect')throw new RangeError('Choose a round or rectangular pan.');
 if(!Number.isFinite(width)||width<=0||width>500)throw new RangeError('Enter a valid pan width.');
 return length*width;
}
export function calculatePanResize({sourceShape,targetShape,sourceLength,targetLength,sourceWidth,targetWidth,amount=null}){
 const original=panArea(sourceShape,Number(sourceLength),Number(sourceWidth));
 const target=panArea(targetShape,Number(targetLength),Number(targetWidth));
 const factor=target/original;
 if(!Number.isFinite(factor)||factor<=0)throw new RangeError('Please check your pan sizes.');
 if(amount===null||amount==='')return {factor,amount:null};
 const value=Number(amount);
 if(!Number.isFinite(value)||value<0||value>1000000)throw new RangeError('Enter an ingredient quantity between 0 and 1,000,000.');
 return {factor,amount:factor*value};
}
export function mountPanCalculator(root=document){
 const form=root.getElementById('ty-en-pan-calculator');
 if(!form||form.dataset.ready==='1')return;
 form.dataset.ready='1';
 const output=form.querySelector('output');
 const error=form.querySelector('[role="alert"]');
 const fmt=new Intl.NumberFormat('en-GB',{maximumFractionDigits:2});
 const factorFmt=new Intl.NumberFormat('en-GB',{maximumFractionDigits:4});
 function toggle(){
  for(const prefix of ['source','target']){
   const shape=form.elements.namedItem(prefix+'Shape').value;
   const width=form.querySelector('[data-pan-width="'+prefix+'"]');
   width.hidden=shape!=='rect';
   width.querySelector('input').disabled=shape!=='rect';
  }
  error.textContent='';
 }
 form.elements.namedItem('sourceShape').addEventListener('change',toggle);
 form.elements.namedItem('targetShape').addEventListener('change',toggle);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  error.textContent='';output.textContent='';
  if(!form.reportValidity())return;
  try{
   const input=Object.fromEntries(new FormData(form).entries());
   const result=calculatePanResize({
    sourceShape:input.sourceShape,targetShape:input.targetShape,
    sourceLength:input.sourceLength,targetLength:input.targetLength,
    sourceWidth:input.sourceWidth,targetWidth:input.targetWidth,amount:input.amount
   });
   const unit=input.unit==='in'?'inches':'cm';
   output.textContent='Scaling factor: '+factorFmt.format(result.factor)+' · '+(result.amount===null?'Enter an ingredient quantity to resize it.':'New ingredient quantity: '+fmt.format(result.amount)+' (same unit as your recipe).')+' Pan dimensions in '+unit+'.';
  }catch(e){error.textContent=e instanceof RangeError?e.message:'Could not calculate the amount.';}
 });
 toggle();
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mountPanCalculator(),{once:true});
 else mountPanCalculator();
}
