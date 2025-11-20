import express from 'express'
import cors from 'cors'
import authRoutes from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 API Server running on port ${PORT}`)
  console.log(`📍 Health check: http://localhost:${PORT}/health`)
})

export default app
