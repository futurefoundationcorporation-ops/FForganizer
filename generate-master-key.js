#!/usr/bin/env node

import crypto from 'crypto'

function generateMasterKey() {
  const randomBytes = crypto.randomBytes(48)
  const hexString = randomBytes.toString('hex')
  return `MASTER-KEY-${hexString}`
}

const masterKey = generateMasterKey()

console.log('\n' + '='.repeat(80))
console.log('🔐 MASTER KEY GERADA COM SUCESSO!')
console.log('='.repeat(80))
console.log('\n⚠️  IMPORTANTE: Copie esta chave e guarde em local seguro!')
console.log('Esta chave só será mostrada uma vez.\n')
console.log('Sua MASTER KEY:')
console.log('\n' + '-'.repeat(80))
console.log(masterKey)
console.log('-'.repeat(80) + '\n')
console.log('📋 Configuração no Replit:')
console.log('\n' + '-'.repeat(80))
console.log('1. No painel do Replit, clique em "Secrets" (ícone de cadeado)')
console.log('2. Adicione uma nova secret:')
console.log('   Nome: VITE_MASTER_KEY')
console.log(`   Valor: ${masterKey}`)
console.log('3. Clique em "Add Secret"')
console.log('4. Reinicie o servidor (Ctrl+C e npm run dev)')
console.log('-'.repeat(80) + '\n')
console.log('⚠️  NUNCA compartilhe esta chave ou faça commit dela no Git!')
console.log('A MASTER_KEY dá acesso total ao painel administrativo.\n')
console.log('='.repeat(80) + '\n')

export { generateMasterKey }
