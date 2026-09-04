'use client';

import { useMemo, useState } from 'react';
import {
  Award, BadgeCheck, Briefcase, Building2, CheckCircle, Clock, Eye, Layers,
  Megaphone, Plus, Star, Trash2, Users, XCircle,
} from 'lucide-react';
import {
  ActionMenu, Button, Card, CardBody, CardHeader, DataTable, EmptyState, PageHeader, PageShell,
  Pill, SettingRow, Stat, StatGrid, Switch, Tabs, Toolbar, FilterSelect,
  ViewToggle, useViewMode,
  type ActionItem, type Column, type PillTone,
} from '@/components/dashboard';

interface Row {
  id: string; name: string; category: string; provider: string;
  district: string; price: string; rating: number; status: 'active' | 'pending' | 'rejected';
}

const ROWS: Row[] = [
  { id: '1', name: 'Two-wheeler servicing at home', category: 'Automobile', provider: 'Karthik Auto Care', district: 'Theni', price: '₹350 – ₹1,200', rating: 4.6, status: 'active' },
  { id: '2', name: 'Wedding photography package', category: 'Events', provider: 'Sri Vinayaga Studio', district: 'Bodinayakanur', price: '₹18,000 – ₹65,000', rating: 4.9, status: 'pending' },
  { id: '3', name: 'AC installation and gas refill', category: 'Home services', provider: 'CoolPoint Services', district: 'Cumbum', price: '₹800 – ₹2,500', rating: 4.2, status: 'active' },
  { id: '4', name: 'Spoken English coaching', category: 'Education', provider: 'Aim Academy', district: 'Periyakulam', price: '₹1,500 / month', rating: 0, status: 'rejected' },
  { id: '5', name: 'Cardamom estate labour supply', category: 'Agriculture', provider: 'Bodi Agri Works', district: 'Bodinayakanur', price: '₹600 / day', rating: 4.4, status: 'active' },
];

const TONE: Record<Row['status'], PillTone> = { active: 'success', pending: 'warning', rejected: 'danger' };

export default function Preview() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');
  const [section, setSection] = useState('table');
  const [sel, setSel] = useState<string[]>([]);
  const [view, setView] = useViewMode('uiux-preview', 'table');
  const [district, setDistrict] = useState('all');
  const [alerts, setAlerts] = useState(true);
  const [sms, setSms] = useState(false);

  const rows = ROWS.filter(r =>
    (tab === 'all' || r.status === tab) &&
    (district === 'all' || r.district === district) &&
    (r.name.toLowerCase().includes(q.toLowerCase()) || r.provider.toLowerCase().includes(q.toLowerCase())),
  );

  const columns = useMemo<Column<Row>[]>(() => [
    {
      key: 'name', header: 'Service', card: 'title', sortValue: r => r.name,
      render: r => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{r.name}</p>
          <p className="truncate text-xs text-slate-500">{r.category}</p>
        </div>
      ),
    },
    { key: 'provider', header: 'Provider', hideBelow: 'lg', sortValue: r => r.provider },
    { key: 'district', header: 'District', hideBelow: 'xl', sortValue: r => r.district },
    { key: 'price', header: 'Price', sortValue: r => r.price, render: r => <span className="whitespace-nowrap tabular-nums">{r.price}</span> },
    {
      key: 'rating', header: 'Rating', align: 'center', sortValue: r => r.rating,
      render: r => r.rating > 0
        ? <span className="inline-flex items-center gap-1 font-semibold text-amber-600"><Star size={12} className="fill-amber-500 text-amber-500" />{r.rating.toFixed(1)}</span>
        : <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'status', header: 'Status', align: 'center', sortValue: r => r.status,
      render: r => <Pill dot tone={TONE[r.status]}>{r.status}</Pill>,
    },
  ], []);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Mirrors the gutter that now lives on <main> in the three portal layouts */}
      <div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PageShell>
          <div className="rounded-2xl border border-blue-200 bg-[#EFF6FF] p-3 text-xs font-semibold text-[#1E40AF]">
            Preview route — the canonical dashboard system rendered with sample Theni data.
            Resize the window to see the table become cards below 768px.
          </div>

          <PageHeader
            title="Service marketplace"
            description="Approve, reject and monitor every service listing across the district."
            breadcrumbs={[{ label: 'Admin', href: '#' }, { label: 'Services' }]}
            actions={<><Button variant="secondary">Export</Button><Button variant="primary"><Plus size={15} /> Add service</Button></>}
          />

          <StatGrid columns={4}>
            <Stat label="Total services" value={128} icon={Layers} tone="violet" delta={12} deltaLabel="vs last month" />
            <Stat label="Active" value={96} icon={BadgeCheck} tone="emerald" delta={4} deltaLabel="vs last month" />
            <Stat label="Pending" value={24} icon={Clock} tone="amber" delta={-8} deltaLabel="vs last month" />
            <Stat label="Providers" value={41} icon={Users} tone="blue" />
          </StatGrid>

          <Tabs
            label="Preview sections"
            value={section}
            onChange={setSection}
            tabs={[
              { id: 'table', label: 'Table & toolbar', count: rows.length },
              { id: 'states', label: 'States' },
              { id: 'controls', label: 'Controls' },
            ]}
          />

          {section === 'table' && (
            <>
              <Toolbar
                search={q}
                onSearchChange={setQ}
                searchPlaceholder="Search by service or provider…"
                selectedCount={sel.length}
                onClearSelection={() => setSel([])}
                bulkActions={<><Button size="sm" variant="secondary">Approve all</Button><Button size="sm" variant="danger">Reject all</Button></>}
                filters={
                  <>
                    {[
                      { label: 'All', value: 'all' },
                      { label: 'Active', value: 'active' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'Rejected', value: 'rejected' },
                    ].map(t => (
                      <Button key={t.value} size="sm" variant={tab === t.value ? 'primary' : 'secondary'} onClick={() => setTab(t.value)}>
                        {t.label}
                      </Button>
                    ))}
                    <ViewToggle value={view} onChange={setView} />
                    <FilterSelect
                      label="District"
                      value={district}
                      onChange={setDistrict}
                      options={[
                        { label: 'All districts', value: 'all' },
                        { label: 'Theni', value: 'Theni' },
                        { label: 'Bodinayakanur', value: 'Bodinayakanur' },
                        { label: 'Cumbum', value: 'Cumbum' },
                        { label: 'Periyakulam', value: 'Periyakulam' },
                      ]}
                    />
                  </>
                }
              />

              <DataTable
                label="Service listings"
                view={view}
                gridColumns={3}
                columns={columns}
                rows={rows}
                getRowId={r => r.id}
                selectedIds={sel}
                onSelectionChange={setSel}
                emptyIcon={Layers}
                emptyTitle="No services match that search"
                emptyDescription="Try a different service or provider name."
                rowActions={r => {
                  const items: ActionItem[] = [
                    { label: 'View details', icon: Eye },
                    { label: 'Edit service', icon: Layers },
                    { label: 'Call provider', icon: Users, href: 'tel:+919876543210' },
                  ];
                  if (r.status === 'pending') {
                    items.push({ label: 'Approve', icon: CheckCircle, tone: 'success', separatorBefore: true });
                    items.push({ label: 'Reject', icon: XCircle, tone: 'danger' });
                  }
                  items.push({ label: 'Feature listing', icon: Star, separatorBefore: true });
                  items.push({ label: 'Delete listing', icon: Trash2, tone: 'danger', separatorBefore: true });
                  return <ActionMenu label={`Actions for ${r.name}`} items={items} />;
                }}
              />
            </>
          )}

          {section === 'states' && (
            <>
              <Card>
                <CardHeader title="Loading state" description="Skeletons hold the column widths steady" action={<Button size="sm" variant="ghost">Refresh</Button>} />
                <CardBody className="p-0">
                  <DataTable className="rounded-none border-0" columns={columns} rows={[]} getRowId={r => r.id} loading skeletonRows={3} />
                </CardBody>
              </Card>

              <EmptyState
                icon={Briefcase}
                title="No jobs posted yet"
                description="When an employer publishes a job it appears here for moderation."
                action={<Button variant="primary">Post the first job</Button>}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader title="Pill tones" />
                  <CardBody className="flex flex-wrap gap-2">
                    <Pill tone="success" dot>Active</Pill>
                    <Pill tone="warning" dot>Pending</Pill>
                    <Pill tone="danger" dot>Rejected</Pill>
                    <Pill tone="info">Standard</Pill>
                    <Pill tone="violet">Premium</Pill>
                    <Pill tone="neutral">Draft</Pill>
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Buttons" />
                  <CardBody className="flex flex-wrap gap-2">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="subtle">Subtle</Button>
                    <Button variant="danger"><Trash2 size={14} /> Delete</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="primary" loading>Saving</Button>
                  </CardBody>
                </Card>
              </div>
            </>
          )}

          {section === 'controls' && (
            <Card>
              <CardHeader
                title="Settings rows"
                description="Switch keeps a 44px touch target without deforming the 24px track"
                action={<Award size={16} className="text-slate-400" />}
              />
              <CardBody className="space-y-3">
                <SettingRow
                  title="Job alert notifications"
                  description="Email me when a matching job is published"
                  control={<Switch checked={alerts} onChange={setAlerts} label="Job alert notifications" />}
                />
                <SettingRow
                  title="SMS alerts"
                  description="Send a text message for interview reminders"
                  control={<Switch checked={sms} onChange={setSms} label="SMS alerts" />}
                />
                <SettingRow
                  title="Company verification"
                  description="Require documents before a company goes live"
                  control={<Pill tone="success"><Building2 size={11} /> Enforced</Pill>}
                />
              </CardBody>
            </Card>
          )}

          <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
            <Megaphone size={12} />
            <span>Every colour here passes WCAG AA against the white surface.</span>
          </div>
        </PageShell>
      </div>
    </div>
  );
}
