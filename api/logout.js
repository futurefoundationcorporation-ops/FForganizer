import { createClient } from '@supabase/supabase-js';
import { parse, serialize } from 'cookie';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cookies = parse(req.headers.cookie || '');
        const sessionToken = cookies.session_token;

        // Deletar sessão do banco (se existir)
        if (sessionToken) {
            await supabase
                .from('admin_sessions')
                .delete()
                .eq('session_token', sessionToken);
        }

        // Limpar cookie
        const cookie = serialize('session_token', '', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/',
            maxAge: 0 // Expira imediatamente
        });

        res.setHeader('Set-Cookie', cookie);

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Erro ao fazer logout:", err);
        return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
}
