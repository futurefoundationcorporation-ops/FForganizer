import { createClient } from '@supabase/supabase-js';
import { parse } from 'cookie';
import { randomBytes, createHash } from 'crypto';

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
        const { label, isAdmin } = req.body;

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
            return res.status(403).json({ error: 'Apenas admins podem gerar chaves' });
        }

        // Gerar chave aleatória
        const plainKey = randomBytes(64).toString('hex');
        const salt = randomBytes(16).toString('hex');
        const keyHash = createHash('sha256')
            .update(plainKey + salt)
            .digest('hex');

        // Salvar no banco
        const { data: keyData, error: keyError } = await supabase
            .from('access_keys')
            .insert({
                key_hash: keyHash,
                salt: salt,
                label: label || 'Sem nome',
                is_admin: isAdmin || false,
                created_at: new Date().toISOString(),
                last_used_at: null
            })
            .select()
            .single();

        if (keyError) {
            console.error("Erro ao criar chave:", keyError);
            return res.status(500).json({ error: 'Erro ao criar chave' });
        }

        return res.status(200).json({
            success: true,
            key: plainKey,
            keyId: keyData.id,
            label: keyData.label,
            isAdmin: keyData.is_admin
        });

    } catch (err) {
        console.error("Erro ao gerar chave:", err);
        return res.status(500).json({ error: 'Erro interno' });
    }
}
