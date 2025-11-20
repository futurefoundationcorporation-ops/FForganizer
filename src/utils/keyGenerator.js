export function generateSecureKey(prefix = 'KEY') {
  const randomBytes = new Uint8Array(32)
  crypto.getRandomValues(randomBytes)
  
  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  const uuid = crypto.randomUUID().replace(/-/g, '')
  
  return `${prefix}-${uuid}-${hexString}`
}

export function generateMasterKey() {
  const randomBytes = new Uint8Array(48)
  crypto.getRandomValues(randomBytes)
  
  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return `MASTER-KEY-${hexString}`
}

export function copyToClipboard(text) {
  return navigator.clipboard.writeText(text)
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
