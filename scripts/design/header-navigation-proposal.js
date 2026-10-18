// PREPARED ONLY: not executed successfully; no approved design change.

const made=[];
const vars={};for(const name of ['paper','ink','muted','image','line'])vars[name]=await figma.variables.getVariableByIdAsync({'paper':'VariableID:2:148','ink':'VariableID:2:149','muted':'VariableID:2:150','image':'VariableID:2:151','line':'VariableID:2:152'}[name]);
function fill(n,key){n.fills=[figma.variables.setBoundVariableForPaint({type:'SOLID',color:{r:1,g:1,b:1}},'color',vars[key])];}
await figma.loadFontAsync({family:'Inter',style:'Regular'});await figma.loadFontAsync({family:'Inter',style:'Bold'});
const navSet=await figma.importComponentSetByKeyAsync('1d2523aed78254402984bbbffdf9010d30b6f35c'); const navDef=navSet.children.find(c=>c.type==='COMPONENT'&&c.name==='State=Default, Direction=Row, Type=Medium');
for(const t of navDef.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);
const actionDef=await figma.getNodeByIdAsync('23:642');
for(const t of actionDef.findAllWithCriteria({types:['TEXT']}))for(const seg of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(seg.fontName);
function al(parent,name,w,h,mode='HORIZONTAL',paint='paper'){const n=figma.createAutoLayout(mode);made.push(n.id);parent.appendChild(n);n.name=name;n.resize(w,h);n.primaryAxisSizingMode='FIXED';n.counterAxisSizingMode='FIXED';n.counterAxisAlignItems='CENTER';n.itemSpacing=12;fill(n,paint);return n;}
function text(parent,value,size=16,bold=false,color='ink',width){const t=figma.createText();made.push(t.id);parent.appendChild(t);t.fontName={family:'Inter',style:bold?'Bold':'Regular'};t.fontSize=size;t.characters=value;fill(t,color);if(width){t.textAutoResize='HEIGHT';t.resize(width,t.height);}return t;}
function spacer(parent){const s=al(parent,'Flexible space',1,1);s.layoutSizingHorizontal='FILL';return s;}
function control(parent,label,w=80,active=false){const n=al(parent,label+' / 48px target',w,48,'HORIZONTAL',active?'image':'paper');n.primaryAxisAlignItems='CENTER';text(n,label,15,active);return n;}
async function links(parent,short=false){const box=al(parent,'Website navigation — configured order',short?290:380,48);box.itemSpacing=4;for(const label of short?['Home','Shop','About','More ⋯']:['Home','Shop','About','Contact']){const i=navDef.createInstance();made.push(i.id);box.appendChild(i);i.setProperties({'Label#515:1':label,'Has Icon#515:5':false});i.resize(label==='Contact'?94:88,48);fill(i,label==='Shop'?'image':'paper');for(const t of i.findAllWithCriteria({types:['TEXT']})){for(const s of t.getStyledTextSegments(['fontName']))await figma.loadFontAsync(s.fontName);fill(t,'ink');t.fontSize=16;}}return box;}
function logo(parent,size=48){const l=al(parent,'Business logo',size,size);l.primaryAxisAlignItems='CENTER';l.strokes=[{type:'SOLID',color:{r:.88,g:.9,b:.94}}];l.cornerRadius=4;text(l,'RD',size<40?11:14,true);return l;}
function actions(parent){const a=actionDef.clone();made.push(a.id,...a.findAll(()=>true).map(n=>n.id));parent.appendChild(a);return a;}
async function header(parent,preset,state){const mobile=state==='Mobile';const collapsed=state==='Collapsed';const w=mobile?390:1200;const multi=!mobile&&!collapsed&&['Centered identity','Two-row','Search-focused'].includes(preset);const height=mobile?128:multi?136:collapsed?56:preset==='Minimal'?56:88;const h=al(parent,preset+' / '+state,w,height,'VERTICAL');h.itemSpacing=0;
const row=al(h,'Pinned identity and shopping actions',w,mobile?72:collapsed||preset==='Minimal'?56:88);row.paddingLeft=mobile?12:24;row.paddingRight=mobile?12:24;row.itemSpacing=mobile?4:16;
if(mobile){const left=al(row,'Menu and logo',88,48);left.itemSpacing=4;control(left,'☰',48);logo(left,32);const title=text(row,'Retail Demo',16,true,'ink',126);title.textAlignHorizontal='CENTER';title.layoutSizingHorizontal='FILL';actions(row);}
else if(preset==='Centered identity'){const left=al(row,'Left identity balance',180,48);if(collapsed)control(left,'☰ Menu',88);logo(left,collapsed?40:48);const title=text(row,'Retail Demo',collapsed?18:24,true,'ink',250);title.textAlignHorizontal='CENTER';title.layoutSizingHorizontal='FILL';const right=al(row,'Right action balance',180,48);right.primaryAxisAlignItems='MAX';actions(right);}
else {logo(row,collapsed||preset==='Minimal'?40:48);const brand=text(row,'Retail Demo',collapsed||preset==='Minimal'?18:22,true,'ink',210);if(preset==='Search-focused'&&!collapsed){const search=control(row,'Search products',440);search.layoutSizingHorizontal='FILL';}else if(!multi){spacer(row);await links(row);spacer(row);}else spacer(row);actions(row);}
if(multi){const nav=al(h,'Website links remain available',w,48);nav.paddingLeft=24;nav.paddingRight=24;if(preset==='Centered identity'){spacer(nav);await links(nav);spacer(nav);}else {await links(nav);spacer(nav);control(nav,'Main location⌄',180);if(preset==='Two-row')control(nav,'Search products',300);}}
if(mobile){const tools=al(h,'Location and search below pinned header',390,56);tools.paddingLeft=12;tools.paddingRight=12;control(tools,'Main location⌄',150);const search=control(tools,'Search products',200);search.layoutSizingHorizontal='FILL';}
return h;}
const board=await figma.getNodeByIdAsync('32:1184');fill(board,'image');
if(board.children.length)throw Error('Proposal board already has content');
text(board,'Website navigation, your way',36,true);
text(board,'PROPOSAL · Home / Shop / About / Contact are sample labels. Owners set labels, destinations and order.',18,false,'muted');
const rows=[];
for(const preset of ['Centered identity','Left-aligned brand','Two-row','Search-focused','Minimal']){
const section=al(board,preset+' — navigation comparison',2860,300,'VERTICAL','image');section.counterAxisAlignItems='MIN';section.itemSpacing=16;
text(section,preset+(preset==='Centered identity'?' · default':''),24,true);
const trio=al(section,'Expanded / collapsed / mobile',2860,220,'HORIZONTAL','image');trio.counterAxisAlignItems='MIN';trio.itemSpacing=24;
for(const state of ['Expanded','Collapsed','Mobile']){const col=al(trio,state+' example',state==='Mobile'?390:1200,220,'VERTICAL','image');col.counterAxisAlignItems='MIN';text(col,state==='Collapsed'?'Scrolled · 56px pinned header':state==='Mobile'?'Mobile · menu opens on tap':'Desktop · website links visible',15,false,'muted');await header(col,preset,state);}
text(section,preset==='Centered identity'?'Centered identity stays centered. On scroll, Menu keeps website links reachable without a second pinned row.':'Desktop links stay inline when space allows. Long navigation moves excess links into More; mobile always has a menu.',16,false,'muted');
rows.push({preset,id:section.id});
}
return {createdNodeIds:made,rows,boardId:board.id,editable:true};