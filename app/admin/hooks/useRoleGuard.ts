"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export function useRoleGuard(allowedRoles: string[]) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        router.push("/admin/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role, is_active")
        .eq("user_id", session.user.id)
        .single();

      if (error || !data || !data.is_active) {
        router.push("/admin/login");
        return;
      }

      if (mounted) {
        setUserRole(data.role);
        
        if (!allowedRoles.includes(data.role)) {
          router.push("/admin/orders");
          setAuthorized(false);
        } else {
          setAuthorized(true);
        }
      }
    }

    checkRole();

    return () => {
      mounted = false;
    };
  }, [router, allowedRoles]);

  return { authorized, userRole };
}