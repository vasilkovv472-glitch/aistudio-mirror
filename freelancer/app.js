const tabs=[...document.querySelectorAll('[data-tab]')];
function show(index){
 const selected=DEMO.examples[index];
 document.querySelector('#proposalTitle').textContent=selected.title;
 document.querySelector('#proposalText').textContent=selected.text;
 document.querySelector('#proposal').setAttribute('aria-labelledby',`tab-${index}`);
 document.querySelector('#copyStatus').textContent='';
 tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
}
tabs.forEach((tab,i)=>{
 tab.addEventListener('click',()=>show(i));
 tab.addEventListener('keydown',event=>{
  let next=null;
  if(event.key==='ArrowRight')next=(i+1)%tabs.length;
  if(event.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;
  if(event.key==='Home')next=0;
  if(event.key==='End')next=tabs.length-1;
  if(next!==null){event.preventDefault();show(next);tabs[next].focus();}
 });
});
document.querySelector('#copyExample').addEventListener('click',async()=>{
 const text=document.querySelector('#proposalText').textContent;
 try{await navigator.clipboard.writeText(text);document.querySelector('#copyStatus').textContent=' Скопировано';}
 catch{document.querySelector('#copyStatus').textContent=' Выделите текст и скопируйте вручную';}
});
show(0);
