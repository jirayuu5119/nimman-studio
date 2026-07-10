import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/** @deprecated Prefer a request-scoped client or createAdminClient(). */
export const supabaseServer = createAdminClient();
