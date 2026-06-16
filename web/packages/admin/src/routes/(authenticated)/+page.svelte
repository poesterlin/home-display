<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Dashboard - Admin</title>
</svelte:head>

<div class="dashboard">
  <h2>Dashboard</h2>

  <div class="stats">
    <div class="stat-card">
      <span class="stat-value">{data.userCount}</span>
      <span class="stat-label">Total Users</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{data.creditTotal}</span>
      <span class="stat-label">Total Credits</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{data.pendingWithdrawals}</span>
      <span class="stat-label">Pending Withdrawals</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{data.jobCounts.completed}</span>
      <span class="stat-label">Completed Jobs</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{data.jobCounts.failed}</span>
      <span class="stat-label">Failed Jobs</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{data.jobCounts.running}</span>
      <span class="stat-label">Running</span>
    </div>
    <div class="stat-card">
      <span class="stat-value">{data.jobCounts.pending}</span>
      <span class="stat-label">Pending</span>
    </div>
  </div>

  <h3 style="margin-top: 32px; margin-bottom: 12px;">
    Pending Withdrawals
    <a href="/withdrawals" style="font-size: 13px; margin-left: 8px;">View all</a>
  </h3>
  <table>
    <thead>
      <tr>
        <th>Email</th>
        <th>Order ID</th>
        <th>Confirmed</th>
      </tr>
    </thead>
    <tbody>
      {#each data.recentWithdrawals as withdrawal}
        <tr>
          <td>{withdrawal.email}</td>
          <td><code style="font-size: 11px;">{withdrawal.stripeSessionId}</code></td>
          <td>{withdrawal.confirmedAt ? new Date(withdrawal.confirmedAt).toLocaleString() : '—'}</td>
        </tr>
      {/each}
      {#if data.recentWithdrawals.length === 0}
        <tr><td colspan="3" style="color: var(--text-muted); text-align: center;">No pending withdrawals</td></tr>
      {/if}
    </tbody>
  </table>

  <h3 style="margin-top: 32px; margin-bottom: 12px;">Recent Jobs</h3>
  <table>
    <thead>
      <tr>
        <th>Project</th>
        <th>Status</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      {#each data.recentJobs as job}
        <tr>
          <td>
            <a href="/jobs/{job.id}">{job.projectName}</a>
          </td>
          <td><span class="badge badge-{job.status}">{job.status}</span></td>
          <td>{new Date(job.createdAt).toLocaleString()}</td>
        </tr>
      {/each}
      {#if data.recentJobs.length === 0}
        <tr><td colspan="3" style="color: var(--text-muted); text-align: center;">No jobs yet</td></tr>
      {/if}
    </tbody>
  </table>
</div>

<style>
  .dashboard h2 { margin-bottom: 24px; font-size: 22px; }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
  }
  .stat-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--accent);
  }
  .stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
