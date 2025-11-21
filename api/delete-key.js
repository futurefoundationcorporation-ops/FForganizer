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
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { keyId } = req.body;

        if (!keyId) {
            return res.status(400).json({ error: 'keyId é obrigatório' });
        }

        // Validar sessão admin
        const cookies = parse(req.headers.cookie || '');
        const sessionToken = cookies.session_token;

        if (!sessionToken) {
            return res.status(401).json({ error: 'Não autenticado' });
        }

        const { data: session, error: sessionError } = await supabase
            .from('admin_sessions')
            .select('*')
            .eq('session_token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (sessionError || !session || !session.is_admin) {
            return res.status(403).json({ error: 'Apenas admins podem deletar chaves' });
        }

        // Deletar chave
        const { error: deleteError } = await supabase
            .from('access_keys')
            .delete()
            .eq('id', keyId);

        if (deleteError) {
            console.error("Erro ao deletar chave:", deleteError);
            return res.status(500).json({ error: 'Erro ao deletar chave' });
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error("Erro ao deletar chave:", err);
        return res.status(500).json({ error: 'Erro interno' });
    }
}
