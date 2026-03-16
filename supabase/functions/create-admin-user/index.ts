// supabase/functions/create-admin-user/index.ts
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

    // ── Both clients use service role — bypasses RLS entirely ─────────────────
    const authCheckClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${serviceRoleKey}` } },
    })

    // ── Verify the caller's session token ─────────────────────────────────────
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
    console.log('CALLER VERIFIED:', callerUser.id, callerUser.email)

    // ── Role check ─────────────────────────────────────────────────────────────
    // FIX: Try by auth_user_id first. If that returns nothing (admin was created
    // manually and auth_user_id is NULL), fall back to matching by email.
    // Then self-heal the auth_user_id so future calls work via the fast path.
    let { data: callerAdmin, error: adminCheckError } = await adminClient
      .from('admin_users')
      .select('id, role, auth_user_id')
      .eq('auth_user_id', callerUser.id)
      .maybeSingle()

    console.log('ROLE CHECK (by auth_user_id):', callerAdmin?.role, adminCheckError?.message)

    if (!callerAdmin && !adminCheckError) {
      // Fallback: look up by email
      console.log('auth_user_id lookup returned nothing — trying email fallback...')
      const { data: adminByEmail, error: emailCheckError } = await adminClient
        .from('admin_users')
        .select('id, role, auth_user_id')
        .eq('email', callerUser.email)
        .maybeSingle()

      console.log('ROLE CHECK (by email):', adminByEmail?.role, emailCheckError?.message)

      if (adminByEmail) {
        callerAdmin = adminByEmail

        // Self-heal: patch auth_user_id so future calls skip the fallback
        if (!adminByEmail.auth_user_id) {
          const { error: patchErr } = await adminClient
            .from('admin_users')
            .update({ auth_user_id: callerUser.id })
            .eq('id', adminByEmail.id)
          console.log('PATCHED auth_user_id:', patchErr?.message ?? 'OK')
        }
      }
    }

    if (adminCheckError) {
      return new Response(
        JSON.stringify({ error: `Role check failed: ${adminCheckError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (callerAdmin?.role !== 'system_administrator') {
      console.log('FORBIDDEN — caller role:', callerAdmin?.role ?? 'not found')
      return new Response(
        JSON.stringify({ error: `Forbidden: caller role is "${callerAdmin?.role ?? 'not found in admin_users'}"` }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Parse + validate request body ─────────────────────────────────────────
    const body = await req.json()
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

    // ── Step 1: Create auth user ───────────────────────────────────────────────
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          account_type: user_type === 'responder' ? 'responder' : 'admin',
          full_name,
        },
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

      // Upsert into public.users (handles both trigger-created and missing rows)
      console.log('UPSERTING public.users, id:', newUserId)
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

      // Insert into responders table
      console.log('INSERTING INTO responders table, id:', newUserId)
      const { error: responderInsertError } = await adminClient
        .from('responders')
        .insert({
          id:     newUserId,
          name:   full_name,
          team:   (team ?? 'bpso').toLowerCase(),
          status: 'available',
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

      // Insert into admin_users — always set auth_user_id so future role checks work
      console.log('INSERTING INTO admin_users table, id:', newUserId)
      const { error: adminInsertError } = await adminClient
        .from('admin_users')
        .insert({
          auth_user_id: newUserId,   // ← always populated now
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