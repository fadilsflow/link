import path from 'node:path'
import fs from 'node:fs'
import { Resend } from 'resend'

// Manually load .env if not automatically handled by Bun
const envPath = path.resolve(process.cwd(), '.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach((line) => {
    const [key, value] = line.split('=')
    if (key && value) process.env[key.trim()] = value.trim()
  })
}

const resend = new Resend(process.env.RESEND_API_KEY)

async function testEmail() {
  console.log('Using API Key:', process.env.RESEND_API_KEY?.slice(0, 10), '...')

  // Replace this with your verified domain email
  const from = 'onboarding@webtron.biz.id'

  const to = 'wahyufadil1140@gmail.com' // Resend testing address

  console.log(`Sending from ${from} to ${to}...`)

  try {
    const { data, error } = await resend.emails.send({
      from: from,
      to: to,
      subject: 'Bun Test Email',
      html: '<strong>It works!</strong> sent from bun script.',
    })

    if (error) {
      console.error('Error:', error)
      return
    }

    console.log('Success! ID:', data?.id)
  } catch (err) {
    console.error('Critical Error:', err)
  }
}
