import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    console.log("Creating/Updating user admin...");
    const email = 'admin@sakpore.com';
    const password = 'Admin123!@#';

    let { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (error && error.message.includes('already been registered')) {
        console.log("User already exists. Updating password to ensure it matches GoTrue's hashing...");
        const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) return console.error(listError);

        const user = usersData.users.find(u => u.email === email);
        if (user) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
                password: password,
                email_confirm: true,
                user_metadata: { role: 'admin' }
            });
            if (updateError) console.error("Update password Error:", updateError);
            else console.log("Password updated successfully.");

            const { error: upsertErr } = await supabase.from('profiles').upsert({ id: user.id, role: 'admin', full_name: 'Admin Sakpore' });
            if (upsertErr) console.error("Upsert Profile Error:", upsertErr);
            else console.log("Profile ensured.");
        }
    } else if (error) {
        console.error("Create User Error:", error);
    } else {
        console.log("User created:", data.user.id);
        const { error: upsertErr } = await supabase.from('profiles').upsert({ id: data.user.id, role: 'admin', full_name: 'Admin Sakpore' });
        if (upsertErr) console.error("Upsert Profile Error:", upsertErr);
        else console.log("Profile created.");
    }
}

main();
