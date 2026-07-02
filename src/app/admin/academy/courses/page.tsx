'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Loader2, BookOpen, Eye, Pencil, Trash2,
  GraduationCap, ToggleLeft, ToggleRight, Star,
} from 'lucide-react';
import { useAdminCourses } from '@/hooks/useLMS';
import { updateCourse, deleteCourse } from '@/lib/firebase/lmsService';
import type { Course } from '@/lib/types/lms';

export default function AdminCoursesPage() {
  const { courses, loading } = useAdminCourses();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'published' && c.isPublished) ||
      (statusFilter === 'draft' && !c.isPublished);
    return matchSearch && matchStatus;
  });

  const handleTogglePublish = async (course: Course) => {
    setActionLoading(course.id);
    try {
      await updateCourse(course.id, { isPublished: !course.isPublished });
    } catch (err) {
      alert('Failed to update course status');
    }
    setActionLoading(null);
  };

  const handleDelete = async (courseId: string) => {
    if (!window.confirm('Archive this course? It will be unpublished and hidden.')) return;
    setActionLoading(courseId);
    try {
      await deleteCourse(courseId);
    } catch (err) {
      alert('Failed to delete course');
    }
    setActionLoading(null);
  };

  const handleToggleFeatured = async (course: Course) => {
    setActionLoading(course.id);
    try {
      await updateCourse(course.id, { isFeatured: !course.isFeatured });
    } catch (err) {
      alert('Failed to update featured status');
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white font-outfit">Course Management</h1>
          <p className="text-sm text-gray-400 mt-1">Create, edit, and manage all courses</p>
        </div>
        <Link href="/admin/academy/courses/create" className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity self-start">
          <Plus size={16} /> Create New Course
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
            className="search-input w-full pl-9 pr-4 py-2 text-sm" />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'published', 'draft'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20' : 'text-gray-400 hover:bg-white/[0.04]'}`}>
              {s === 'all' ? 'All Courses' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={36} className="text-violet-400 animate-spin mb-4" />
            <p className="text-sm text-gray-400">Loading courses...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <GraduationCap size={32} className="text-gray-500 mb-3" />
            <p className="text-sm text-gray-400">No courses found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Course</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden md:table-cell">Category</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Difficulty</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Enrolled</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden lg:table-cell">Modules</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500 hidden lg:table-cell">Lessons</th>
                  <th className="text-center px-3 py-3 text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 text-[10px] uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map(c => {
                  const diffColors: Record<string, string> = {
                    beginner: 'bg-emerald-500/10 text-emerald-400',
                    intermediate: 'bg-amber-500/10 text-amber-400',
                    advanced: 'bg-rose-500/10 text-rose-400',
                  };
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {c.thumbnail ? (
                            <img src={c.thumbnail} alt="" className="w-10 h-7 rounded-lg object-cover bg-slate-800" />
                          ) : (
                            <div className="w-10 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                              <BookOpen size={14} className="text-violet-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-white">{c.title}</p>
                            <p className="text-[10px] text-gray-500">{c.estimatedHours || 0}h estimated</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center hidden md:table-cell">
                        <span className="text-xs text-gray-400">{c.category}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${diffColors[c.difficulty] || ''}`}>
                          {c.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center text-sm font-medium text-white">{c.enrollmentCount || 0}</td>
                      <td className="px-3 py-3.5 text-center text-xs text-gray-400 hidden lg:table-cell">{c.totalModules || 0}</td>
                      <td className="px-3 py-3.5 text-center text-xs text-gray-400 hidden lg:table-cell">{c.totalLessons || 0}</td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${c.isPublished ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {c.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {actionLoading === c.id ? (
                            <Loader2 size={14} className="text-violet-400 animate-spin" />
                          ) : (
                            <>
                              <Link href={`/admin/academy/courses/${c.id}/edit`}
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="Edit">
                                <Pencil size={14} />
                              </Link>
                              <button onClick={() => handleTogglePublish(c)}
                                className={`p-1.5 rounded-lg transition-colors ${c.isPublished ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'}`}
                                title={c.isPublished ? 'Unpublish' : 'Publish'}>
                                {c.isPublished ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                              </button>
                              <button onClick={() => handleToggleFeatured(c)}
                                className={`p-1.5 rounded-lg transition-colors ${c.isFeatured ? 'bg-amber-500/10 text-amber-400' : 'bg-white/[0.04] text-gray-500'} hover:bg-amber-500/20`}
                                title={c.isFeatured ? 'Remove Featured' : 'Mark Featured'}>
                                <Star size={14} className={c.isFeatured ? 'fill-amber-400' : ''} />
                              </button>
                              <button onClick={() => handleDelete(c.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="Archive">
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
