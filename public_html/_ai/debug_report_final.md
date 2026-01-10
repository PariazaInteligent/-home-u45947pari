# RUN.LOG CONTENT

```
C:\Users\tomiz\Desktop\-home-u45947pari\public_html\apps\api\src\middleware\auth.ts:2
import { prisma } from '@pariaza/database';
         ^^^^^^
SyntaxError: The requested module '@pariaza/database' does not provide an export named 'prisma'
```

(Reconstructed from partial logs and context)

# FINDSTR OUTPUT

`findstr /s /n /c:"from '@pariaza" apps\api\src\*.ts`

Result matches:

- `apps\api\src\middleware\auth.ts:2:import { prisma } from '@pariaza/database';`
- `apps\api\src\services\units.service.ts:1:import { prisma } from '@pariaza/database';`
- `apps\api\src\tests\withdrawal-fees.integration.test.ts:2:import { prisma } from '@pariaza/database';`
- `apps\api\src\tests\withdrawal-fees.integration.test.ts:3:import { Decimal } from '@pariaza/database';` (WRONG IMPORT)
- And other correct imports of `prisma`.

# FILE CHECKS

**packages/database/index.ts:**

```typescript
import { PrismaClient } from '@prisma/client';
export * from '@prisma/client';
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

(Exports `prisma` correctly)

**apps/api/src/middleware/auth.ts:**

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@pariaza/database';
```

(Looks correct, but fails at runtime)

**apps/api/src/tests/withdrawal-fees.integration.test.ts:**

```typescript
import { prisma } from '@pariaza/database';
import { Decimal } from '@pariaza/database'; // ERROR: Decimal is not exported by database
```
