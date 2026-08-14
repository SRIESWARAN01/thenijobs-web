import Link from 'next/link';
import Header from '@/components/navigation/Header';
import BottomNav from '@/components/navigation/BottomNav';
import HomeFooter from '@/components/home/HomeFooter';

type InfoPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Array<{ title: string; content: string }>;
};

export default function InfoPage({ eyebrow, title, description, sections }: InfoPageProps) {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#111827]">
      <Header />
      <section className="border-b border-blue-100 bg-[linear-gradient(180deg,#eaf2ff_0%,#f8fafc_100%)] px-4 pb-12 pt-28 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#2563eb]">{eyebrow}</p>
          <h1 className="mt-3 font-outfit text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
        </div>
      </section>
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl space-y-5">
          {sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="font-outfit text-xl font-extrabold text-slate-950">{section.title}</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{section.content}</p>
            </article>
          ))}
          <div className="rounded-2xl bg-[#111827] p-6 text-white">
            <h2 className="font-outfit text-lg font-bold">Need help?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Our team can help you find a job, publish a company profile, or resolve an account issue.</p>
            <Link href="/contact" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[#2563eb] px-4 text-sm font-bold text-gray-900 hover:bg-[#1d4ed8]">Contact THENIJOBS</Link>
          </div>
        </div>
      </section>
      <HomeFooter />
      <BottomNav />
    </main>
  );
}
