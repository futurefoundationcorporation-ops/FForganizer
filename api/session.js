import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const cookies = parse(req.headers.cookie || '');
        const sessionToken = cookies.session_token;

        if (!sessionToken) {
            return res.status(200).json({
                valid: false,
                logged: false,
                isAdmin: false
            });
        }

        // Buscar sessão diretamente (SEM RPC para evitar problemas)
        const { data: session, error } = await supabase
            .from('admin_sessions')
            .select('*')
            .eq('session_token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !session) {
            return res.status(200).json({
                valid: false,
                logged: false,
                isAdmin: false
            });
        }

        // Atualizar last_used (opcional)
        await supabase
            .from('admin_sessions')
            .update({ last_used: new Date().toISOString() })
            .eq('session_token', sessionToken);

        return res.status(200).json({
            valid: true,
            logged: true,
            isAdmin: session.is_admin,
            expiresAt: session.expires_at
        });

    } catch (err) {
        console.error("Erro ao validar sessão:", err);
        return res.status(200).json({
            valid: false,
            logged: false,
            isAdmin: false
        });
    }
}
