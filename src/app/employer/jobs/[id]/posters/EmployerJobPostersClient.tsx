'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles, ArrowLeft, Loader2, QrCode, AlertCircle, Building2,
  Share2, Download, Layers, CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from '@/hooks/useFirestore';
import { PosterData } from '@/lib/poster/types';
import PosterStudioModal from '@/components/employer/poster/PosterStudioModal';

export default function EmployerJobPostersClient({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: job, loading: jobLoading, error: jobError } = useDocument<any>('jobs', jobId);
  const companyId = job?.companyId;
  const { data: company, loading: companyLoading } = useDocument<any>('companies', companyId || null);

  const posterData: PosterData | null = useMemo(() => {
    if (!job) return null;
    return {
      id: job.id || jobId,
      type: 'job',
      title: job.title || 'Job Opportunity',
      companyName: company?.name || job.companyName || 'Theni Company',
      companyLogoUrl: company?.logoUrl || job.companyLogoUrl,
      category: job.category || company?.category || 'General Employment',
      location: job.location || job.district || company?.district || 'Theni',
      district: job.district || company?.district || 'Theni District',
      salaryText: job.salaryMin && job.salaryMax
        ? `₹${Number(job.salaryMin).toLocaleString('en-IN')} - ₹${Number(job.salaryMax).toLocaleString('en-IN')}`
        : job.salary || 'Competitive Salary',
      jobType: job.jobType,
      experience: job.experience,
      education: job.education,
      openings: job.openings,
      deadlineText: job.deadline ? new Date(job.deadline).toLocaleDateString('en-IN') : undefined,
      contactPhone: company?.phone || job.contactPhone,
      contactEmail: company?.email || job.contactEmail,
      highlights: job.skills || job.requirements || [],
      publicUrl: `https://www.thenijobs.com/jobs/${job.slug || job.id || jobId}`,
      isUrgent: !!job.isUrgent,
      isFeatured: !!job.isFeatured,
      isVerified: !!company?.isVerified,
    };
  }, [job, company, jobId]);

  if (jobLoading || companyLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 size={28} className="animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500">Loading job poster studio...</p>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <AlertCircle size={44} className="text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Job Posting Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          The requested job listing could not be found or has been removed.
        </p>
        <Link
          href="/employer/jobs"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
        >
          <ArrowLeft size={14} /> Back to My Jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6">
      {/* Breadcrumbs & Back */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/employer/jobs/${jobId}`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Job Details
        </Link>
        <span className="text-xs text-slate-400 font-mono">Job ID: {jobId}</span>
      </div>

      {/* Main Studio Modal Triggered as persistent view */}
      {posterData && (
        <PosterStudioModal
          isOpen={true}
          onClose={() => router.push(`/employer/jobs/${jobId}`)}
          data={posterData}
        />
      )}
    </div>
  );
}
