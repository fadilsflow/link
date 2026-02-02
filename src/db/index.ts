import { config } from 'dotenv'
config({ path: ['.env.local', '.env'] })

// import { drizzle } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/neon-http'

import * as schema from './schema.ts'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
