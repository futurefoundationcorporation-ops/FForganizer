import { createClient } from '@supabase/supabase-js';
import { serialize } from 'cookie';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
});

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'Chave de acesso é obrigatória.' });
        }

        // 1. Validar chave
        const { data: validation, error: validationError } = await supabase.rpc('validate_master_or_access_key', {
            input_key: key
        });

        if (validationError) {
            console.error("Erro ao validar chave:", validationError);
            return res.status(500).json({ error: 'Erro ao validar chave.' });
        }

        if (!validation || !validation.valid) {
            return res.status(400).json({ error: 'Chave inválida.' });
        }

        // 2. Gerar token de sessão
        const sessionToken = randomBytes(32).toString('hex');

        // 3. Criar sessão
        const { data: sessionData, error: sessionError } = await supabase.rpc('create_admin_session', {
            session_token: sessionToken,
            user_is_admin: validation.is_admin
        });

        if (sessionError) {
            console.error("Erro ao criar sessão:", sessionError);
            return res.status(500).json({ error: 'Erro ao criar sessão.' });
        }

        // 4. Configurar cookie
        const cookie = serialize("session_token", sessionToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7 // 7 dias
        });

        res.setHeader("Set-Cookie", cookie);

        return res.status(200).json({
            ok: true,
            success: true,
            isAdmin: validation.is_admin,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

    } catch (err) {
        console.error("Erro inesperado:", err);
        return res.status(500).json({ error: "Erro interno." });
    }
}
