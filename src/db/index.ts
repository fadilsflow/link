import { config } from 'dotenv'

// import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema.ts'

config({ path: ['.env.local', '.env'] })

export const db = drizzle(process.env.DATABASE_URL!, { schema })
