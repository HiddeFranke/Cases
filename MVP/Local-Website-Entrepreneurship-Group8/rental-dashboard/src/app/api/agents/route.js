import { NextResponse } from 'next/server';
import { getAgentJobs, clearCompletedJobs, removeAgentJob } from '@/lib/db';

export async function GET() {
  const jobs = getAgentJobs();
  const stats = {
    queued: jobs.filter(j => j.status === 'queued').length,
    running: jobs.filter(j => j.status === 'running').length,
    completed: jobs.filter(j => j.status === 'completed').length,
    failed: jobs.filter(j => j.status === 'failed').length,
    total: jobs.length,
  };
  return NextResponse.json({ jobs, stats });
}

export async function DELETE(request) {
  const body = await request.json().catch(() => ({}));

  if (body.id) {
    removeAgentJob(body.id);
    return NextResponse.json({ success: true });
  }

  const removed = clearCompletedJobs();
  return NextResponse.json({ success: true, removed });
}
