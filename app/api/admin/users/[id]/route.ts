import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "غير مصرح بالدخول", status: 401, user: null };
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

  if (error || !user) {
    return { error: "جلسة غير صالحة", status: 401, user: null };
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return { error: "ليس لديك صلاحية", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}

// PATCH: تعديل المستخدم
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { full_name, role, is_active, new_password } = body;

    // الحصول على البروفايل الحالي
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // منع المدير من تعطيل نفسه
    if (profile.user_id === authCheck.user?.id && is_active === false) {
      return NextResponse.json({ error: "لا يمكنك تعطيل حسابك الخاص" }, { status: 400 });
    }

    // منع المدير من تغيير دوره من admin (لتجنب فقدان آخر مدير)
    if (profile.user_id === authCheck.user?.id && role && role !== "admin") {
      return NextResponse.json({ error: "لا يمكنك تغيير دورك الخاص" }, { status: 400 });
    }

    // تحديث كلمة المرور إذا طُلبت
    if (new_password) {
      if (new_password.length < 6) {
        return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        profile.user_id,
        { password: new_password }
      );
      if (pwError) {
        return NextResponse.json({ error: pwError.message }, { status: 400 });
      }
    }

    // تحديث البروفايل
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role !== undefined) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم تحديث المستخدم بنجاح" });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "خطأ غير متوقع" }, { status: 500 });
  }
}

// DELETE: حذف المستخدم
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const { id } = await params;

    // الحصول على البروفايل
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !profile) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // منع المدير من حذف نفسه
    if (profile.user_id === authCheck.user?.id) {
      return NextResponse.json({ error: "لا يمكنك حذف حسابك الخاص" }, { status: 400 });
    }

    // حذف من Auth (سيحذف البروفايل تلقائياً بسبب CASCADE)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.user_id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "تم حذف المستخدم بنجاح" });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "خطأ غير متوقع" }, { status: 500 });
  }
}
