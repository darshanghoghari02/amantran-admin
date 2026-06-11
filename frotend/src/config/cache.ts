// Shared runtime cache to store fetched CMS lists and avoid loading spinners on tab switching (Stale-While-Revalidate pattern)
export const cmsCache = {
  dashboard: null as { stats: any; charts: any } | null,
  categories: null as any[] | null,
  templates: null as any[] | null,
  fonts: null as any[] | null,
  languages: null as any[] | null,
  users: null as { staff: any[]; mobile: any[] } | null,
  subscriptions: null as any[] | null,
  roles: null as any[] | null,
  auditLogs: null as any[] | null,
};
