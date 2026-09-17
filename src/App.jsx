import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CirclePlus, Search, ScrollText, Trash2, X } from 'lucide-react';
import { agentSkills, chronologyExpanded, factionMarkers, factionRegions, hanProvinces, initialRecords, mapMountains, mapRivers, upPools, worldMapPhases } from './data';
import agentData from './agentData.json';
import agentSkillExtra from './agentSkillExtra.json';
import detectives from './detectives.json';
import chronicleData from './chronicleData.json';
import chronicleExtra from './chronicleExtra.json';
import mapReference from './assets/world-map-reference.jpg';
import guanglingSeal from './assets/guangling-fox-seal.png';
import historicalMapClean from './assets/historical-map-clean.png';
import logo from './assets/logo.png';
import liubianPortrait from './assets/liubian.png';
import furongPortrait from './assets/furong.png';
import yuanjiPortrait from './assets/yuanji.png';
import suncePortrait from './assets/sunce.png';
import zuociPortrait from './assets/zuoci.png';

const specialPortraits={刘辩:liubianPortrait,'刘辩（张道陵）':liubianPortrait,傅融:furongPortrait,袁基:yuanjiPortrait,孙策:suncePortrait,左慈:zuociPortrait};

const portraitModules=import.meta.glob('./assets/portraits/*.png',{eager:true,query:'?url',import:'default'});
const portraitByFile=Object.fromEntries(Object.entries(portraitModules).map(([path,url])=>[path.split('/').pop(),url]));
const detectiveList=['绝密','机密','隐密'].flatMap(quality=>(detectives[quality]||[]).map(item=>({...item,quality:item.quality||quality})));
const detectiveByName=Object.fromEntries(detectiveList.map(a=>[a.name,a]));
const agentByName=Object.fromEntries(agentData.agents.map(a=>[a.name,a]));
const absoluteRoster=detectiveList.filter(a=>a.quality==='绝密').map(a=>a.name);
const rankRoster={
  绝密:absoluteRoster,
  机密:detectiveList.filter(a=>a.quality==='机密').map(a=>a.name),
  隐密:detectiveList.filter(a=>a.quality==='隐密').map(a=>a.name)
};
const tabs=[['recruit','招募簿',ScrollText],['chronicle','编年录',BookOpen]];
const readStore=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
function useOutside(ref,close){useEffect(()=>{const fn=e=>ref.current&&!ref.current.contains(e.target)&&close();document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn)},[close,ref])}
function Portrait({name,className=''}){const [failed,setFailed]=useState(false);useEffect(()=>setFailed(false),[name]);const remote=detectiveByName[name]?.portrait_url||agentByName[name]?.portrait_url,filename=remote?.split('/').pop(),src=specialPortraits[name]||portraitByFile[filename]||remote;return src&&!failed?<img className={className} src={src} alt={name} loading="eager" decoding="async" onError={()=>setFailed(true)}/>:<span className={`seal-avatar ${className}`}>{name?.slice(-1)||'鸢'}</span>}

function Header({active,setActive}){
  return <><header className="topbar"><img src={logo} alt="代号鸢"/><div className="header-actions"><img className="royal-seal" src={guanglingSeal} alt="狐狐"/></div></header><nav className="tabs">{tabs.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon size={18}/>{label}</button>)}</nav></>
}
function SectionTitle({children,side}){return <div className="section-title"><div><i/><h2>{children}</h2></div>{side}</div>}
function Stat({label,value}){return <div className="stat"><span>{label}</span><strong>{value}</strong></div>}

function AgentChoice({value,onChange,names,label='选择密探'}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');const ref=useRef(null);useOutside(ref,()=>setOpen(false));
 const list=names.filter(n=>n.includes(query));return <div className="choice" ref={ref}><button type="button" className="choice-trigger" onClick={()=>setOpen(!open)}><Portrait name={value}/><b>{value||label}</b><ChevronDown size={16}/></button>{open&&<div className="choice-menu"><label><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="查询密探"/></label><div>{list.map(n=><button type="button" key={n} className={n===value?'on':''} onClick={()=>{onChange(n);setOpen(false)}}><Portrait name={n}/><b>{n}</b></button>)}</div></div>}</div>
}

function MultiAgentPicker({counts,onChange,limit=40}){
 const [rarity,setRarity]=useState('绝密'),[query,setQuery]=useState('');
 const selectedTotal=Object.values(counts).reduce((sum,n)=>sum+n,0);
 const change=(name,delta)=>{const next={...counts},value=Math.max(0,(next[name]||0)+delta);if(delta>0&&selectedTotal>=limit)return;if(value)next[name]=value;else delete next[name];onChange(next)};
 return <div className="multi-picker">{Object.entries(counts).length>0&&<div className="selected-results">{Object.entries(counts).map(([name,count])=><button type="button" key={name} onClick={()=>change(name,-1)}><span className="roster-face"><Portrait name={name}/>{count>1&&<i>{count}</i>}</span><b>{name}</b></button>)}</div>}<div className="multi-toolbar"><div>{['绝密','机密','隐密'].map(rank=><button type="button" className={rarity===rank?'on':''} key={rank} onClick={()=>setRarity(rank)}>{rank}</button>)}</div><label><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="查询密探"/></label></div><div className="multi-agent-grid">{rankRoster[rarity].filter(name=>name.includes(query)).map(name=>{const count=counts[name]||0;return <button type="button" className={count?'on':''} key={name} onClick={()=>change(name,1)}><span className="roster-face"><Portrait name={name}/>{count>1&&<i>{count}</i>}</span><b>{name}</b>{count>0&&<small>{count} 次</small>}</button>})}</div><div className="selection-total">已选 <b>{selectedTotal}</b> / 40</div></div>
}

function AddRecord({onClose,onAdd}){
 const today=new Date().toISOString().slice(0,10);
 const [type,setType]=useState('限定卡池'),[pool,setPool]=useState(upPools[0].name),[formByType,setFormByType]=useState({'限定卡池':{count:1,date:today},'绣衣天下':{count:1,date:today}}),[selectionByType,setSelectionByType]=useState({'限定卡池':{},'绣衣天下':{}}),[error,setError]=useState('');
 const form=formByType[type],setForm=next=>setFormByType(current=>({...current,[type]:next}));
 const counts=selectionByType[type],setCounts=next=>setSelectionByType(current=>({...current,[type]:next}));
 const drawCount=Math.min(40,Math.max(1,Number(form.count)||1)),selectedTotal=Object.values(counts).reduce((sum,n)=>sum+n,0);
 const submit=e=>{e.preventDefault();if(!selectedTotal){setError('请选择本次所得密探');return}if(selectedTotal>drawCount){setError('所得密探数量不能超过招募数');return}const results=Object.entries(counts).map(([agent,count])=>({agent,rarity:detectiveByName[agent]?.quality||'隐密',count}));onAdd({id:Date.now(),date:form.date,count:drawCount,pool:type==='绣衣天下'?'绣衣天下':pool,results});onClose()};
 return createPortal(<div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><form className="record-modal batch-modal" onSubmit={submit}><div className="modal-head"><h2>招募记档</h2><button type="button" onClick={onClose}><X size={20}/></button></div><div className="pool-kind"><button type="button" className={type==='限定卡池'?'on':''} onClick={()=>{setType('限定卡池');setError('')}}>限定卡池</button><button type="button" className={type==='绣衣天下'?'on':''} onClick={()=>{setType('绣衣天下');setError('')}}>普池</button></div>{type==='限定卡池'&&<label>卡池<select value={pool} onChange={e=>setPool(e.target.value)}>{upPools.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}</select><ChevronDown size={15}/></label>}<div className="form-row"><label>招募数<input min="1" max="40" type="number" value={form.count} onChange={e=>{const count=Math.min(40,Math.max(1,Number(e.target.value)||1));setForm({...form,count});setError('')}}/></label><label>日期<div className="date-entry"><input type="text" inputMode="numeric" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} placeholder="年-月-日"/><span className="date-picker" title="打开日历"><CalendarDays size={17}/><input type="date" value={/^\d{4}-\d{2}-\d{2}$/.test(form.date)?form.date:''} onChange={e=>setForm({...form,date:e.target.value})}/></span></div></label></div><div className="field-caption">本次所得</div><MultiAgentPicker counts={counts} onChange={next=>{setCounts(next);setError('')}} limit={40}/>{error&&<p className="form-error">{error}</p>}<button className="primary full">记入本次招募</button></form></div>,document.body)
}

function LegacyRosterPicker({selected,onChange}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');const ref=useRef(null);useOutside(ref,()=>setOpen(false));
 return <div className="agent-picker" ref={ref}><button className="agent-select" onClick={()=>setOpen(!open)}><span className="mini-faces">{selected.slice(0,4).map(n=><Portrait name={n} key={n}/>)}</span><b>{selected.length?`已记 ${selected.length} 人`:'选择已得绝密'}</b><ChevronDown size={16}/></button>{open&&<div className="agent-grid"><label><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="查询绝密密探"/></label><div>{absoluteRoster.filter(n=>n.includes(query)).map(name=>{const on=selected.includes(name);return <button className={on?'on':''} key={name} onClick={()=>onChange(on?selected.filter(x=>x!==name):[...selected,name])}><Portrait name={name}/><span><b>{name}</b><i>{on?'已记':'未记'}</i></span></button>})}</div></div>}</div>
}

function RosterPicker({counts,onChange}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');const ref=useRef(null);useOutside(ref,()=>setOpen(false));
 const chosen=absoluteRoster.filter(n=>(counts[n]||0)>0);
 const add=name=>onChange({...counts,[name]:(counts[name]||0)+1});
 const subtract=(e,name)=>{e.stopPropagation();const next={...counts};if((next[name]||0)<=1)delete next[name];else next[name]-=1;onChange(next)};
 return <div className="agent-picker" ref={ref}><button className="agent-select" onClick={()=>setOpen(!open)}><span className="mini-faces">{chosen.slice(0,5).map(n=><span className="mini-face-wrap" key={n}><Portrait name={n}/>{counts[n]>=2&&<i>{counts[n]}</i>}</span>)}</span><b>选择已得绝密</b><ChevronDown size={16}/></button>{open&&<div className="agent-grid"><label><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="查询绝密密探"/></label><div>{absoluteRoster.filter(n=>n.includes(query)).map(name=>{const count=counts[name]||0;return <button className={count?'on':''} key={name} onClick={()=>add(name)}><span className="roster-face"><Portrait name={name}/>{count>=2&&<i>{count}</i>}</span><b>{name}</b>{count>0&&<span className="count-actions"><em onClick={e=>subtract(e,name)}>−</em><strong>{count}</strong><em>＋</em></span>}</button>})}</div></div>}</div>
}

function PoolSelector({selected,onSelect}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState('');const ref=useRef(null);useOutside(ref,()=>setOpen(false)); const filtered=upPools.filter(p=>(p.name+p.agents.join('')).includes(query));
 return <div className="pool-selector" ref={ref}><button className="pool-selector-trigger" onClick={()=>setOpen(!open)}><span><small>限定卡池</small><b>{selected.name}</b></span><span className="pool-date">{selected.start.replaceAll('-','.')}—{selected.end.replaceAll('-','.')}</span><span className="selector-cue">更换</span><ChevronDown size={18}/></button>{open&&<div className="pool-menu"><label><Search size={15}/><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="查询卡池或密探"/></label><div>{filtered.map(p=><button key={p.id} className={selected.id===p.id?'on':''} onClick={()=>{onSelect(p);setOpen(false)}}><span><b>{p.name}</b><small>{p.agents.join(' · ')}</small></span><time>{p.start.replaceAll('-','.')}—{p.end.replaceAll('-','.')}</time></button>)}</div></div>}</div>
}
function PityRing({value}){return <div className="pity-ring" style={{'--p':`${Math.min(value,40)/40*100}%`}}><div><strong>{value}</strong><span>/40</span></div></div>}

function LegacySkillPopover({name,onClose}){const ref=useRef(null);useOutside(ref,onClose);const skill=agentSkills[name];return <div className="skill-popover" ref={ref}><button className="popover-close" onClick={onClose}><X size={17}/></button><div className="skill-head"><Portrait name={name}/><div><span>绝密密探</span><h3>{name}</h3>{skill&&<small>{skill.attr} · {skill.role} · {skill.tags.join(' · ')}</small>}</div></div>{skill?<div className="skill-list">{[skill.attack,skill.skill,skill.leader,skill.talent].map(([title,text],i)=><article key={title}><span>{['普攻','技能','队长技','天赋'][i]}</span><div><b>{title}</b><p>{text}</p></div></article>)}<article><span>升星</span><div><b>星石进阶</b><p>二星、三星、四星、五星依次提升基础数值与技能效果；具体增幅以当前实装版本的密探名册为准。</p></div></article></div>:<div className="skill-empty"><b>密探名册</b><p>该密探的技能与升星资料正按国际服实装版本核对，暂不以大陆服或旧版数值代替。</p></div>}</div>}

const clean=s=>String(s||'').replace(/<br\s*\/?>/gi,'；').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim();
function SkillPopover({name,onClose}){
 const ref=useRef(null);useOutside(ref,onClose);const record=agentByName[name],manual=agentSkills[name],extra=agentSkillExtra[name],a=record?.abilities;
 const blocks=[];
 if(a){
  if(a['普攻'])blocks.push(['普攻',a['普攻'],clean(a['普攻1']||a['普攻信息'])]);
  if(a['技能'])['技能1','技能2','技能3'].forEach((k,i)=>{if(a[k])blocks.push([['一星技能','三星技能','五星技能'][i],a['技能'],clean(a[k])])});
  if(a['队长技能'])blocks.push(['队长技',a['队长技能'],clean(a['队长技能信息'])]);
  ['天赋1','天赋2','天赋3','天赋4'].forEach((k,i)=>{if(a[k])blocks.push([['二星天赋','四星天赋','觉醒天赋','命盘天赋'][i],clean(a[k]),clean(a[`天赋信息${i+1}`])])})
 }
 if(!blocks.length&&manual)[manual.attack,manual.skill,manual.leader,manual.talent].forEach(([title,text],i)=>blocks.push([['普攻','技能','队长技','天赋'][i],title,text]));
 if(!blocks.length&&extra?.skills)extra.skills.forEach(item=>blocks.push([item.kind,item.title,item.text]));
 return <div className="skill-popover" ref={ref}><div className="skill-head"><Portrait name={name}/><div><span>绝密密探 · {record?.first_up_date?.replaceAll('-','.')||''}</span><h3>{name}</h3><small>{record?.first_up_pool||manual?.tags?.join(' · ')}</small></div></div>{blocks.length?<div className="skill-list">{blocks.map(([kind,title,text])=><article key={`${kind}${title}`}><span>{kind}</span><div><b>{title}</b><p>{text}</p></div></article>)}{extra?.stars?.length>0&&<article className="star-record"><span>升星</span><div>{extra.stars.map(item=><p key={item.star}><b>{item.star}星</b>　{item.effect}</p>)}</div></article>}</div>:<div className="skill-empty"><b>名册原卷待校</b><p>现有公开资料未能完整核对该密探的国际服技能与升星文本，暂不拿其他版本或推测数值填补。</p></div>}</div>
}

const recordResults=record=>Array.isArray(record.results)?record.results:[{agent:record.agent,rarity:record.rarity,count:1}];
const recordAbsoluteCount=record=>recordResults(record).filter(item=>item.rarity==='绝密').reduce((sum,item)=>sum+(item.count||1),0);

function LegacyRecruit(){
 const [records,setRecords]=useState(()=>readStore('yuan.records.v2',initialRecords)),[adding,setAdding]=useState(false),[query,setQuery]=useState(''),[selectedPool,setSelectedPool]=useState(upPools[0]),[standingCounts,setStandingCounts]=useState(()=>{const saved=readStore('yuan.standing.counts',null);if(saved)return saved;const old=readStore('yuan.standing.agents',['杨修']);return Object.fromEntries((Array.isArray(old)?old:['杨修']).map(n=>[n,1]))}),[agent,setAgent]=useState(null);
 useEffect(()=>localStorage.setItem('yuan.records.v2',JSON.stringify(records)),[records]);useEffect(()=>localStorage.setItem('yuan.standing.counts',JSON.stringify(standingCounts)),[standingCounts]);
 const stats=pool=>{const rows=records.filter(r=>r.pool===pool).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);const total=rows.reduce((s,r)=>s+r.count,0),ssr=rows.filter(r=>r.rarity==='绝密').length;let pity=0;for(const r of rows){if(r.rarity==='绝密')break;pity+=r.count}return{total,ssr,pity:pity%40,rate:total?(ssr/total*100).toFixed(2):'0.00'}};
 const all={total:records.reduce((s,r)=>s+r.count,0),ssr:records.filter(r=>r.rarity==='绝密').length};all.rate=all.total?(all.ssr/all.total*100).toFixed(2):'0.00';const standing=stats('绣衣天下'),limited=stats(selectedPool.name);
 const probability=useMemo(()=>{const map={};const groups={};[...records].sort((a,b)=>a.date.localeCompare(b.date)||a.id-b.id).forEach(r=>{groups[r.pool]??={draws:0,agents:{}};const g=groups[r.pool];g.draws+=r.count;g.agents[r.agent]=(g.agents[r.agent]||0)+(r.rarity==='绝密'?1:0);map[r.id]={n:g.agents[r.agent],d:g.draws,p:g.draws?(g.agents[r.agent]/g.draws*100).toFixed(2):'0.00'}});return map},[records]);
 const filtered=records.filter(r=>(r.pool+r.agent+r.rarity).includes(query)).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 return <main className="page recruit-page"><section className="overview"><div className="overview-mark"><b>招募总览</b></div><Stat label="累计招募" value={all.total}/><Stat label="绝密密探" value={all.ssr}/><Stat label="绝密出率" value={`${all.rate}%`}/><button className="primary" onClick={()=>setAdding(true)}><CirclePlus size={17}/>记一笔</button></section><SectionTitle>卡池概览</SectionTitle><section className="pool-pair"><article className="standing-pool pool-sheet"><div className="pool-heading"><span>普池</span><h3>绣衣天下</h3></div><div className="pool-metrics"><PityRing value={standing.pity}/><Stat label="累计招募" value={standing.total}/><Stat label="绝密密探" value={standing.ssr}/><Stat label="绝密出率" value={`${standing.rate}%`}/></div><div className="owned"><span>已得绝密</span><RosterPicker counts={standingCounts} onChange={setStandingCounts}/></div></article><article className="limited-pool pool-sheet"><PoolSelector selected={selectedPool} onSelect={p=>{setSelectedPool(p);setAgent(null)}}/><div className="pool-metrics"><PityRing value={limited.pity}/><Stat label="累计招募" value={limited.total}/><Stat label="绝密密探" value={limited.ssr}/><Stat label="绝密出率" value={`${limited.rate}%`}/></div><div className="up-agents"><span>绝密密探</span><div>{selectedPool.agents.map(name=><div className="agent-pop-anchor" key={name}><button className={agent===name?'on':''} onClick={()=>setAgent(agent===name?null:name)}><Portrait name={name}/><b>{name}</b></button>{agent===name&&<SkillPopover name={name} onClose={()=>setAgent(null)}/>}</div>)}</div></div></article></section><SectionTitle side={<label className="search"><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="查询密探或卡池"/></label>}>招募记档</SectionTitle><section className="record-book">{filtered.map(r=>{const q=probability[r.id]||{n:0,d:0,p:'0.00'};return <article key={r.id}><time>{r.date.replaceAll('-','.')}</time><span className={`rarity ${r.rarity==='绝密'?'ssr':''}`}>{r.rarity}</span><div><b>{r.agent}</b><small>{r.pool}</small></div><strong>{Number(q.p)>0?`${q.p}%`:''}</strong><button onClick={()=>setRecords(records.filter(x=>x.id!==r.id))}><Trash2 size={15}/></button></article>})}</section>{adding&&<AddRecord onClose={()=>setAdding(false)} onAdd={r=>setRecords([r,...records])}/>}</main>
}

function Recruit(){
 const [records,setRecords]=useState(()=>readStore('yuan.public-demo.records.v1',initialRecords)),[adding,setAdding]=useState(false),[query,setQuery]=useState(''),[selectedPool,setSelectedPool]=useState(upPools[0]),[standingCounts,setStandingCounts]=useState(()=>readStore('yuan.public-demo.standing.v1',{})),[agent,setAgent]=useState(null),[page,setPage]=useState(1);
 useEffect(()=>localStorage.setItem('yuan.public-demo.records.v1',JSON.stringify(records)),[records]);useEffect(()=>localStorage.setItem('yuan.public-demo.standing.v1',JSON.stringify(standingCounts)),[standingCounts]);
 const stats=pool=>{const rows=records.filter(r=>r.pool===pool),total=rows.reduce((sum,r)=>sum+Number(r.count||0),0),ssr=rows.reduce((sum,r)=>sum+recordAbsoluteCount(r),0),mod=total%40,pity=total?(mod||40):0;return{total,ssr,pity,rate:total?(ssr/total*100).toFixed(2):'0.00'}};
 const allTotal=records.reduce((sum,r)=>sum+Number(r.count||0),0),allSsr=records.reduce((sum,r)=>sum+recordAbsoluteCount(r),0),allRate=allTotal?(allSsr/allTotal*100).toFixed(2):'0.00';
 const standing=stats('绣衣天下'),limited=stats(selectedPool.name);
 const agentTotals={};records.forEach(record=>recordResults(record).forEach(result=>{agentTotals[result.agent]=(agentTotals[result.agent]||0)+(result.count||1)}));
 const filtered=records.filter(record=>{const names=recordResults(record).map(item=>item.agent).join('');return(record.pool+names).includes(query)}).sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id);
 const displayRows=filtered.flatMap(record=>recordResults(record).map(result=>({record,result,probability:allTotal?(agentTotals[result.agent]||0)/allTotal*100:0})));
 const pageCount=Math.max(1,Math.ceil(displayRows.length/10)),safePage=Math.min(page,pageCount),pageRows=displayRows.slice((safePage-1)*10,safePage*10);
 return <main className="page recruit-page"><section className="overview"><div className="overview-mark"><b>招募总览</b></div><Stat label="累计招募" value={allTotal}/><Stat label="绝密密探" value={allSsr}/><Stat label="绝密出率" value={`${allRate}%`}/><button className="primary" onClick={()=>setAdding(true)}><CirclePlus size={17}/>记一笔</button></section><SectionTitle>卡池概览</SectionTitle><section className="pool-pair"><article className="standing-pool pool-sheet"><div className="pool-heading"><span>普池</span><h3>绣衣天下</h3></div><div className="pool-metrics"><PityRing value={standing.pity}/><Stat label="累计招募" value={standing.total}/><Stat label="绝密密探" value={standing.ssr}/><Stat label="绝密出率" value={`${standing.rate}%`}/></div><div className="owned"><span>已得绝密</span><RosterPicker counts={standingCounts} onChange={setStandingCounts}/></div></article><article className="limited-pool pool-sheet"><PoolSelector selected={selectedPool} onSelect={pool=>{setSelectedPool(pool);setAgent(null)}}/><div className="pool-metrics"><PityRing value={limited.pity}/><Stat label="累计招募" value={limited.total}/><Stat label="绝密密探" value={limited.ssr}/><Stat label="绝密出率" value={`${limited.rate}%`}/></div><div className="up-agents"><span>绝密密探</span><div>{selectedPool.agents.map(name=><div className="agent-pop-anchor" key={name}><button className={agent===name?'on':''} onClick={()=>setAgent(agent===name?null:name)}><Portrait name={name}/><b>{name}</b></button>{agent===name&&<SkillPopover name={name} onClose={()=>setAgent(null)}/>}</div>)}</div></div></article></section><SectionTitle side={<label className="search"><Search size={15}/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="查询密探或卡池"/></label>}>招募记档</SectionTitle><section className="record-book classic-records">{pageRows.length?pageRows.map(({record,result,probability})=><article key={`${record.id}-${result.agent}`}><span className={`rarity ${result.rarity}`}>{result.rarity}</span><div className="record-person"><Portrait name={result.agent}/><span><b>{result.agent}{(result.count||1)>1&&<i> ×{result.count}</i>}</b><small>{record.pool} · 共 {record.count} 抽</small></span></div><strong>{probability.toFixed(2)}%</strong><time>{record.date.replaceAll('-','.')}</time><button aria-label="删除本次记录" onClick={()=>setRecords(records.filter(item=>item.id!==record.id))}><Trash2 size={15}/></button></article>):<div className="empty-records"><ScrollText size={24}/><b>尚无符合条件的招募记录</b></div>}</section>{pageCount>1&&<nav className="record-pagination" aria-label="招募记录分页"><div className="page-buttons"><button disabled={safePage===1} onClick={()=>setPage(Math.max(1,safePage-1))}><ChevronLeft size={15}/></button>{Array.from({length:pageCount},(_,index)=><button className={safePage===index+1?'on':''} key={index+1} onClick={()=>setPage(index+1)}>{index+1}</button>)}<button disabled={safePage===pageCount} onClick={()=>setPage(Math.min(pageCount,safePage+1))}><ChevronRight size={15}/></button></div><span className="page-status">{safePage}/{pageCount} 页</span></nav>}{adding&&<AddRecord onClose={()=>setAdding(false)} onAdd={record=>{setRecords([record,...records]);setPage(1)}}/>}</main>
}

function LegacyFactionModal({f,onClose}){useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[]);return <div className={`faction-backdrop theme-${f.theme}`} onMouseDown={e=>e.target===e.currentTarget&&onClose()}><article className="faction-modal" style={{'--c':f.color}}><button className="popover-close" onClick={onClose}><X size={19}/></button><div className="faction-title"><h2>{f.name}</h2><p>{f.summary}</p></div><div className="faction-columns"><section><h3>相关人物</h3><div className="influence-list">{f.people.map((n,i)=><div key={n}><b>{String(i+1).padStart(2,'0')}</b><span>{n}</span></div>)}</div></section><section><h3>势力纪事</h3><ol>{f.events.map(e=><li key={e}>{e}</li>)}</ol></section></div></article></div>}
function LegacyPeople(){const [chosen,setChosen]=useState(null);return <main className="page people-page"><SectionTitle>天下势力</SectionTitle><section className="faction-map" style={{backgroundImage:`linear-gradient(rgba(239,224,197,.18),rgba(239,224,197,.18)),url(${mapReference})`}}><svg viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="sand" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0 3Q2 1 4 3" fill="none" stroke="#9d7444" strokeWidth=".25"/></pattern><pattern id="water" width="5" height="4" patternUnits="userSpaceOnUse"><path d="M0 2Q1 1 2 2T4 2" fill="none" stroke="#687f82" strokeWidth=".25"/></pattern><pattern id="mount" width="6" height="5" patternUnits="userSpaceOnUse"><path d="M0 5L3 1 6 5" fill="none" stroke="#688087" strokeWidth=".28"/></pattern></defs><path className="land" d="M7 18L28 8 44 12 53 5 72 12 80 24 94 34 87 47 96 58 81 74 68 69 57 77 42 70 27 74 18 61 7 53 14 41 5 30Z"/>{factionRegions.map(f=><polygon key={f.id} className={`region-shape ${f.theme}`} points={f.polygon} style={{'--c':f.color}} onClick={()=>setChosen(f)}/>)}</svg>{factionRegions.map(f=><button key={f.id} style={{left:`${f.center[0]}%`,top:`${f.center[1]/80*100}%`,'--c':f.color}} onClick={()=>setChosen(f)}><b>{f.name}</b><span>{f.region}</span></button>)}</section>{chosen&&<FactionModal f={chosen} onClose={()=>setChosen(null)}/>}</main>}

const verifiedFactionPeople={
 yinyuan:['左慈','广陵王','葛洪','张仲景','许曼','干吉'],wudoumi:['刘辩（张道陵）','张鲁','张修','张角','史子眇','吉平'],xiliang:['董卓','贾诩','吕布','李傕','华雄','马腾','韩遂','马超'],han:['刘辩','广陵王','傅融','张让','何进','王允','伏寿','董承'],hebeiyuan:['袁绍','袁基','颜良','文丑','张郃','高览','许攸'],runanyuan:['袁术','杨修','阎象','纪灵','袁基'],cao:['曹操','郭嘉','荀彧','夏侯惇','曹植','满宠'],jiangdong:['孙策','周瑜','孙权','孙尚香','吕蒙','陆逊','鲁肃','太史慈'],jingzhou:['刘表','黄祖','黄射','甘宁','庞统','黄月英','诸葛亮'],guangling:['广陵王','傅融','阿蝉','陈登','史子眇','颜良','鲁肃','杨修']
};
const factionTerritory={yinyuan:'益州西蜀',wudoumi:'益州汉中',xiliang:'凉州、关中',han:'司隶',hebeiyuan:'冀州',runanyuan:'豫州汝南',cao:'兖州、豫州',jiangdong:'扬州江东',jingzhou:'荆州',guangling:'徐州广陵'};
const provinceTint={liang:'#8a5d3650',sili:'#8d302940',ji:'#64547b42',yan:'#4d596b38',yu:'#695f8b3d',yi:'#6e879040',jing:'#4f6c5040',yang:'#a44b3140',xu:'#8d302938'};
const rankNumerals=['壹','贰','叁','肆','伍','陆','柒','捌','玖','拾'];
const storyCommanderies=[
 {name:'涿郡',x:80,y:12},{name:'魏郡',x:70,y:25},{name:'东郡',x:59,y:35},{name:'汝南郡',x:66,y:45},
 {name:'广陵郡',x:88,y:45},{name:'下邳郡',x:82,y:39},{name:'东海郡',x:88,y:36},{name:'琅琊国',x:78,y:34},{name:'彭城国',x:77,y:43},
 {name:'广汉郡',x:31,y:51},{name:'汉中郡',x:37,y:42},{name:'南郡',x:48,y:57},{name:'江夏郡',x:57,y:54},
 {name:'丹阳郡',x:72,y:56},{name:'吴郡',x:81,y:60},{name:'会稽郡',x:86,y:65},{name:'豫章郡',x:66,y:65},{name:'交趾郡',x:55,y:75}
];
function FactionModal({f,onClose}){useEffect(()=>{const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[]);const people=verifiedFactionPeople[f.id]||f.people;return createPortal(<div className={`faction-backdrop theme-${f.theme}`} onMouseDown={e=>e.target===e.currentTarget&&onClose()}><article className="faction-modal refined-faction" style={{'--c':f.color}}><button className="modal-x" onClick={onClose}><X size={19}/></button><div className="faction-title"><span>{factionTerritory[f.id]||f.region}</span><h2>{f.name}</h2><p>{f.summary}</p></div><div className="faction-columns"><section><h3>相关人物</h3><div className="influence-names">{people.map((person,index)=><div key={person}><i>{rankNumerals[index]||index+1}</i><b>{person}</b><small>{index===0?'首要人物':index<3?'重要人物':'相关人物'}</small></div>)}</div></section><section><h3>势力纪事</h3><ol>{f.events.map((event,index)=><li key={event}><i>{String(index+1).padStart(2,'0')}</i><p>{event}</p></li>)}</ol></section></div></article></div>,document.body)}
const provinceDisplay=id=>id==='sili'?'司州':hanProvinces.find(item=>item.id===id)?.name.replace('州','');
function People(){
 const [chosen,setChosen]=useState(null),[phaseIndex,setPhaseIndex]=useState(1);const phase=worldMapPhases[phaseIndex];
 const regionById=Object.fromEntries(factionRegions.map(item=>[item.id,item]));
 const provinceOwners={};phase.territories.forEach(territory=>territory.provinces.forEach(id=>{provinceOwners[id]=territory}));
 return <main className="page people-page"><SectionTitle side={<span className="map-era">州域随事局推移</span>}>天下图</SectionTitle><div className="phase-tabs">{worldMapPhases.map((item,index)=><button className={index===phaseIndex?'on':''} key={item.id} onClick={()=>setPhaseIndex(index)}><small>{item.era}</small><b>{item.title}</b></button>)}</div><section className="historical-map world-map"><div className="map-canvas copied-map"><img className="clean-map-base" src={historicalMapClean} alt="汉末州郡地图"/><svg viewBox="0 0 100 80" role="img" aria-label={`${phase.era}${phase.title}州郡势力图`}><path className="map-landmass" d="M3 19C12 14 20 17 30 21L39 8 50 7 58 12 62 7 73 3 86 6 95 11 91 18 99 26 95 34 96 43 93 53 92 64 86 72 81 76 76 79 59 79 44 77 32 73 28 70 19 65 13 55 17 37 11 33 5 29Z"/><g className="province-layer">{hanProvinces.map(province=>{const territory=provinceOwners[province.id],faction=territory&&regionById[territory.faction];return <g className={territory?'occupied':''} key={province.id} onClick={()=>faction&&setChosen(faction)}><path d={province.d} style={{'--territory':faction?.color}}/><text className="state-label" x={province.label[0]} y={province.label[1]}>{provinceDisplay(province.id)}</text>{faction&&<text className="faction-label" x={province.label[0]} y={province.label[1]+3.6}>{faction.name}</text>}</g>})}</g><g className="commandery-layer">{storyCommanderies.map(place=><g key={place.name} transform={`translate(${place.x} ${place.y})`}><rect x="-4.8" y="-1.4" width="9.6" height="2.8" rx=".35"/><text y=".48">{place.name}</text></g>)}</g></svg></div><aside className="territory-index phase-index"><div className="phase-note"><b>{phase.era} · {phase.title}</b><p>{phase.summary}</p></div><header><small>{phase.era}</small><h3>势力范围变化</h3></header>{phase.territories.map((territory,index)=>{const faction=regionById[territory.faction];return <button key={territory.faction} onClick={()=>setChosen(faction)}><i style={{background:faction?.color}}>{index+1}</i><span><b>{faction?.name}</b><small>{territory.provinces.map(id=>hanProvinces.find(p=>p.id===id)?.name).join('、')}</small><em>{territory.note}</em></span></button>})}</aside></section>{chosen&&<FactionModal f={chosen} onClose={()=>setChosen(null)}/>}</main>
}

const formalDigits=['零','壹','贰','叁','肆','伍','陆','柒','捌','玖'];
function formalNumber(value){if(value<10)return formalDigits[value];const tens=Math.floor(value/10),ones=value%10;return `${tens>1?formalDigits[tens]:''}拾${ones?formalDigits[ones]:''}`}
const chronicleNoise=/(待核|未知|不详|无法确定|不能证明|未把.*钉在|精确夜次|无唯一日期|展示入口|玩法门槛|活动开放|未标明时间|实际时点|官方节号|主世界章次|具体小节先后|是否统一编号|完整结局截至|\d{4}年\d{1,2}月公开)/;
const cleanText=value=>String(value||'').split(/[；。]/).map(part=>part.trim()).filter(part=>part&&!chronicleNoise.test(part)).join('；');
const cleanStage=value=>cleanText(value);
function Chronicle(){
  const arranged=useMemo(()=>[...chronicleData,...chronicleExtra].sort((a,b)=>(a.order??0)-(b.order??0)),[])
  const [chosen,setChosen]=useState(arranged[0]),detailRef=useRef(null)
  const choose=item=>{setChosen(item);requestAnimationFrame(()=>{if(detailRef.current)detailRef.current.scrollTop=0})}
  const chosenIndex=arranged.findIndex(n=>n.id===chosen.id),before=arranged[chosenIndex-1],after=arranged[chosenIndex+1]
  const go=target=>{if(!target)return;choose(target);requestAnimationFrame(()=>document.getElementById(`chron-${target.id}`)?.scrollIntoView({behavior:'smooth',block:'center'}))}
  const passScroll=e=>{const el=e.currentTarget,atTop=el.scrollTop<=0&&e.deltaY<0,atBottom=Math.ceil(el.scrollTop+el.clientHeight)>=el.scrollHeight&&e.deltaY>0;if(atTop||atBottom)window.scrollBy({top:e.deltaY,behavior:'auto'})}
  return <main className="page chronicle-page">
    <div className="chronicle-intro"><b>汉末大事录</b><span>诸事依时序相连</span></div>
    <section className="chronicle-layout">
      <div className="timeline"><div className="central-line"/>{arranged.map((n,i)=>{const stage=cleanStage(n.date_or_stage);return <article id={`chron-${n.id}`} className={`time-card side-${i%2} ${chosen.id===n.id?'active':''}`} key={n.id} onClick={()=>choose(n)}>
        <div className="time-order"><b>{formalNumber(i+1)}</b></div><div className="time-meta">{stage&&<em>{stage}</em>}</div><h3>{n.title}</h3><p>{cleanText(n.event)}</p>
      </article>})}</div>
      <aside className="chron-detail" ref={detailRef} onWheel={passScroll}>
        <h2>{chosen.title}</h2>
        <div className="fact-strip">{cleanStage(chosen.date_or_stage)&&<span>{cleanStage(chosen.date_or_stage)}</span>}{chosen.location?.length>0&&<span>{chosen.location.join('、')}</span>}</div>
        {chosen.characters?.length>0&&<div className="detail-block"><b>涉事人物</b><p>{chosen.characters.join('、')}</p></div>}
        {chosen.cause&&cleanText(chosen.cause)&&<div className="detail-block"><b>事起</b><p>{cleanText(chosen.cause)}</p></div>}
        {cleanText(chosen.event)&&<div className="detail-block"><b>经过</b><p>{cleanText(chosen.event)}</p></div>}
        {chosen.outcome&&cleanText(chosen.outcome)&&<div className="detail-block"><b>结果</b><p>{cleanText(chosen.outcome)}</p></div>}
        {chosen.connections?.length>0&&<div className="detail-block relation-block"><b>前后牵连</b><ul>{chosen.connections.map(id=><li key={id}>{arranged.find(item=>item.id===id)?.title||id}</li>)}</ul></div>}
        {chosen.fork_from&&<div className="detail-block"><b>分歧所在</b><p>由「{arranged.find(item=>item.id===chosen.fork_from)?.title||chosen.fork_from}」另起。</p></div>}
        <div className="detail-nav"><button type="button" disabled={!before} onClick={()=>go(before)}><span><small>上一件</small><b>{before?.title||'已至卷首'}</b></span></button><button type="button" disabled={!after} onClick={()=>go(after)}><span><small>下一件</small><b>{after?.title||'已至卷末'}</b></span></button></div>
      </aside>
    </section>
  </main>
}

function LegacyChronicle(){const [chosen,setChosen]=useState(chronologyExpanded[0]);const mains=chronologyExpanded.filter(n=>n.kind==='主线');const arranged=mains.flatMap(m=>[m,...chronologyExpanded.filter(n=>n.parent===m.id)]);const chosenIndex=arranged.findIndex(n=>n.id===chosen.id),before=arranged[chosenIndex-1],after=arranged[chosenIndex+1];return <main className="page chronicle-page"><div className="chronicle-intro"><b>汉末大事录</b><span>主线为干，密探、据点与别线随事相生</span></div><section className="chronicle-layout"><div className="timeline">{arranged.map(n=><article key={n.id} className={`time-node kind-${n.kind} ${chosen.id===n.id?'selected':''}`} onClick={()=>setChosen(n)}><div className="time-dot">{n.kind==='异闻'?'岔':n.kind.slice(0,1)}</div><div className="time-card"><span>{n.era} · {n.sub}</span><h3>{n.title}</h3><p>{n.text}</p>{n.parent&&<small>由「{chronologyExpanded.find(x=>x.id===n.parent)?.title}」牵出</small>}</div></article>)}</div><aside className="chronicle-focus"><span>{chosen.era} · {chosen.sub}</span><h2>{chosen.title}</h2><p>{chosen.detail}</p><dl><div><dt>所在</dt><dd>{chosen.kind==='据点'?chosen.title:chosen.era}</dd></div><div><dt>性质</dt><dd>{chosen.kind==='异闻'?'别线推演':chosen.kind==='主线'?'本纪':'同段纪事'}</dd></div></dl>{chosen.links?.length>0&&<div><h3>相连之事</h3>{chosen.links.map(id=>{const x=chronologyExpanded.find(n=>n.id===id);return x?<button key={id} onClick={()=>setChosen(x)}><b>{x.title}</b><small>{x.sub}</small></button>:null})}</div>}{(before||after)&&<div className="context-flow"><h3>前后相承</h3>{before&&<button onClick={()=>setChosen(before)}><b>前事 · {before.title}</b><small>{before.sub}</small></button>}{after&&<button onClick={()=>setChosen(after)}><b>后事 · {after.title}</b><small>{after.sub}</small></button>}</div>}{chosen.parent&&<button className="back-main" onClick={()=>setChosen(chronologyExpanded.find(x=>x.id===chosen.parent))}>回溯前因</button>}</aside></section></main>}

export default function App(){const[active,setActive]=useState(()=>location.hash.slice(1)==='chronicle'?'chronicle':'recruit');useEffect(()=>{history.replaceState(null,'',`#${active}`)},[active]);return <div className="app-shell"><div className="paper-grain"/><Header active={active} setActive={setActive}/>{active==='recruit'?<Recruit/>:<Chronicle/>}<footer><span>体验数据仅保存在当前浏览器</span><span>资料整理截至 2026.09.16</span></footer></div>}
