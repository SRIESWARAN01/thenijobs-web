'use client';
import { useMemo, useState } from 'react';
import { Briefcase, CheckCircle, Clock, Eye, Layers, Star, Users, XCircle } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, DataTable, EmptyState, PageHeader, PageShell, Pill, Stat, StatGrid, Toolbar, type Column } from '@/components/dashboard';

interface Row { id: string; name: string; category: string; provider: string; district: string; price: string; rating: number; status: 'active'|'pending'|'rejected'; }
const ROWS: Row[] = [
  { id:'1', name:'Two-wheeler servicing at home', category:'Automobile', provider:'Karthik Auto Care', district:'Theni', price:'₹350 – ₹1,200', rating:4.6, status:'active' },
  { id:'2', name:'Wedding photography package', category:'Events', provider:'Sri Vinayaga Studio', district:'Bodinayakanur', price:'₹18,000 – ₹65,000', rating:4.9, status:'pending' },
  { id:'3', name:'AC installation and gas refill', category:'Home services', provider:'CoolPoint Services', district:'Cumbum', price:'₹800 – ₹2,500', rating:4.2, status:'active' },
  { id:'4', name:'Spoken English coaching', category:'Education', provider:'Aim Academy', district:'Periyakulam', price:'₹1,500 / month', rating:0, status:'rejected' },
];

export default function Preview() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [sel, setSel] = useState<string[]>([]);
  const rows = ROWS.filter(r => (tab==='all'||r.status===tab) && (r.name.toLowerCase().includes(q.toLowerCase())||r.provider.toLowerCase().includes(q.toLowerCase())));
  const columns = useMemo<Column<Row>[]>(()=>[
    { key:'name', header:'Service', card:'title', sortValue:r=>r.name, render:r=>(<div className="min-w-0"><p className="truncate font-semibold text-slate-900">{r.name}</p><p className="truncate text-xs text-slate-500">{r.category}</p></div>) },
    { key:'provider', header:'Provider', hideBelow:'lg', sortValue:r=>r.provider },
    { key:'district', header:'District', hideBelow:'xl', sortValue:r=>r.district },
    { key:'price', header:'Price', sortValue:r=>r.price, render:r=><span className="whitespace-nowrap tabular-nums">{r.price}</span> },
    { key:'rating', header:'Rating', align:'center', sortValue:r=>r.rating, render:r=> r.rating>0 ? <span className="inline-flex items-center gap-1 font-semibold text-amber-600"><Star size={12} className="fill-amber-500 text-amber-500"/>{r.rating.toFixed(1)}</span> : <span className="text-slate-400">N/A</span> },
    { key:'status', header:'Status', align:'center', sortValue:r=>r.status, render:r=><Pill dot tone={r.status==='active'?'success':r.status==='pending'?'warning':'danger'}>{r.status}</Pill> },
  ],[]);
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PageShell>
          <PageHeader title="Service marketplace" description="Approve, reject and monitor every service listing across the district."
            breadcrumbs={[{label:'Admin',href:'#'},{label:'Services'}]}
            actions={<><Button variant="secondary" size="sm">Export</Button><Button variant="primary" size="sm">Add service</Button></>} />
          <StatGrid columns={4}>
            <Stat label="Total services" value={128} icon={Layers} tone="violet" delta={12} deltaLabel="vs last month" />
            <Stat label="Active" value={96} icon={CheckCircle} tone="emerald" delta={4} deltaLabel="vs last month" />
            <Stat label="Pending" value={24} icon={Clock} tone="amber" delta={-8} deltaLabel="vs last month" />
            <Stat label="Providers" value={41} icon={Users} tone="blue" />
          </StatGrid>
          <Toolbar search={q} onSearchChange={setQ} searchPlaceholder="Search by service or provider…"
            selectedCount={sel.length} onClearSelection={()=>setSel([])}
            bulkActions={<><Button size="sm" variant="secondary">Approve all</Button><Button size="sm" variant="danger">Reject all</Button></>}
            filters={[{label:'All services',value:'all'},{label:'Active',value:'active'},{label:'Pending',value:'pending'},{label:'Rejected',value:'rejected'}].map(t=>(
              <Button key={t.value} size="sm" variant={tab===t.value?'primary':'secondary'} onClick={()=>setTab(t.value)}>{t.label}</Button>))} />
          <DataTable label="Service listings" columns={columns} rows={rows} getRowId={r=>r.id}
            selectedIds={sel} onSelectionChange={setSel}
            emptyIcon={Layers} emptyTitle="No services match that search" emptyDescription="Try a different service or provider name."
            rowActions={r=>(<>{r.status==='pending'&&(<><Button size="sm" variant="secondary" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"><CheckCircle size={14}/> Approve</Button><Button size="sm" variant="secondary" className="border-rose-200 text-rose-700 hover:bg-rose-50"><XCircle size={14}/> Reject</Button></>)}<Button size="sm" variant="ghost"><Eye size={14}/> View</Button></>)} />
          <Card>
            <CardHeader title="Loading state" description="Skeletons keep column widths stable" action={<Button size="sm" variant="ghost">Refresh</Button>} />
            <CardBody className="p-0"><DataTable className="rounded-none border-0" columns={columns} rows={[]} getRowId={r=>r.id} loading skeletonRows={3} /></CardBody>
          </Card>
          <EmptyState icon={Briefcase} title="No jobs posted yet" description="When employers publish a job it will show up here for moderation." action={<Button variant="primary">Post the first job</Button>} />
        </PageShell>
      </div>
    </div>
  );
}
