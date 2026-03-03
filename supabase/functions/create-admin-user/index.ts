import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabaseUrl    = Deno.env.get('SUPABASE_URL') ?? ''

    const authCheckClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        headers: { Authorization: `Bearer ${serviceRoleKey}` },
      },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: callerUser }, error: callerError } =
      await authCheckClient.auth.getUser(token)

    if (callerError || !callerUser) {
      console.log('AUTH FAILED:', callerError?.message)
      return new Response(
        JSON.stringify({ error: `Unauthorized: ${callerError?.message ?? 'invalid session'}` }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    console.log('CALLER VERIFIED:', callerUser.id)

    const { data: callerAdmin, error: adminCheckError } = await adminClient
      .from('admin_users')
      .select('role')
      .eq('auth_user_id', callerUser.id)
      .maybeSingle()

    console.log('ROLE CHECK:', callerAdmin?.role, adminCheckError?.message)

    if (adminCheckError) {
      return new Response(
        JSON.stringify({ error: `Role check failed: ${adminCheckError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (callerAdmin?.role !== 'system_administrator') {
      return new Response(
        JSON.stringify({ error: `Forbidden: caller role is "${callerAdmin?.role ?? 'null'}"` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json()
    // ✅ removed `role` for responders — only team matters now
    const { full_name, email, password, role, user_type, team } = body
    console.log('BODY:', { full_name, email, role, user_type, team })

    if (!full_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'All fields are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (password.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Step 1: Create auth user ──────────────────────────────────────────────
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    console.log('AUTH CREATE:', authData?.user?.id, authError?.message)

    if (authError) {
      return new Response(
        JSON.stringify({ error: `Auth creation failed: ${authError.message}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newUserId = authData.user.id

    // ── Step 2: Branch by user_type ───────────────────────────────────────────
    if (user_type === 'responder') {

      console.log('UPDATING public.users, id:', newUserId)
      const { error: userUpdateError } = await adminClient
        .from('users')
        .update({
          full_name,
          account_type:   'responder',
          account_status: 'active',
          is_verified:    true,
        })
        .eq('id', newUserId)
      console.log('users UPDATE RESULT:', userUpdateError?.message ?? 'OK')

      if (userUpdateError) {
        await adminClient.auth.admin.deleteUser(newUserId)
        return new Response(
          JSON.stringify({ error: `users update failed: ${userUpdateError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('UPSERTING public.users (fallback), id:', newUserId)
      const { error: userUpsertError } = await adminClient
        .from('users')
        .upsert({
          id:             newUserId,
          email,
          full_name,
          account_type:   'responder',
          account_status: 'active',
          is_verified:    true,
        }, { onConflict: 'id' })
      console.log('users UPSERT RESULT:', userUpsertError?.message ?? 'OK')

      if (userUpsertError) {
        await adminClient.auth.admin.deleteUser(newUserId)
        return new Response(
          JSON.stringify({ error: `users upsert failed: ${userUpsertError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // ✅ Insert into responders — team replaces type
      console.log('INSERTING INTO responders table, id:', newUserId)
      const { error: responderInsertError } = await adminClient
        .from('responders')
        .insert({
          id:     newUserId,
          name:   full_name,
          team:   (team ?? 'bpso').toLowerCase(),   // ✅ team column
          status: 'available',
          // type column intentionally omitted
        })
      console.log('responders INSERT RESULT:', responderInsertError?.message ?? 'OK')

      if (responderInsertError) {
        await adminClient.from('users').delete().eq('id', newUserId)
        await adminClient.auth.admin.deleteUser(newUserId)
        return new Response(
          JSON.stringify({ error: `responders insert failed: ${responderInsertError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

    } else {

      // Admin user
      console.log('INSERTING INTO admin_users table, id:', newUserId)
      const { error: adminInsertError } = await adminClient
        .from('admin_users')
        .insert({
          auth_user_id: newUserId,
          email,
          full_name,
          role:         role.toLowerCase(),
          is_active:    true,
        })
      console.log('admin_users INSERT RESULT:', adminInsertError?.message ?? 'OK')

      if (adminInsertError) {
        await adminClient.auth.admin.deleteUser(newUserId)
        return new Response(
          JSON.stringify({ error: `admin_users insert failed: ${adminInsertError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log('SUCCESS')
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.log('CAUGHT ERROR:', err.message)
    return new Response(
      JSON.stringify({ error: err.message ?? 'Unexpected server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
