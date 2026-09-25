import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// عميل عادي للتحقق من هوية المستخدم
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

// عميل Admin بصلاحيات كاملة (server-side فقط)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// التحقق من أن المستخدم مسجل وأنه admin
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

  // التحقق من أن المستخدم admin
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role, is_active")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return { error: "ليس لديك صلاحية إدارة المستخدمين", status: 403, user: null };
  }

  return { error: null, status: 200, user };
}

// GET: جلب قائمة المستخدمين
export async function GET(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ users: data });
}

// POST: إنشاء مستخدم جديد
export async function POST(request: NextRequest) {
  const authCheck = await verifyAdmin(request);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  try {
    const body = await request.json();
    const { email, password, full_name, role } = body;

    // التحقق من المدخلات
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" }, { status: 400 });
    }

    if (!["admin", "sales", "delivery"].includes(role)) {
      return NextResponse.json({ error: "الدور غير صالح" }, { status: 400 });
    }

    // إنشاء المستخدم في Supabase Auth
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!newUser.user) {
      return NextResponse.json({ error: "فشل إنشاء المستخدم" }, { status: 500 });
    }

    // إضافة البروفايل في جدول profiles
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: newUser.user.id,
        email,
        full_name,
        role,
        is_active: true,
      });

    if (profileError) {
      // إذا فشل إنشاء البروفايل، احذف المستخدم من Auth
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "تم إنشاء المستخدم بنجاح",
      user: { id: newUser.user.id, email, full_name, role }
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || "خطأ غير متوقع" }, { status: 500 });
  }
}
