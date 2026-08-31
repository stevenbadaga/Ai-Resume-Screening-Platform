import { describe, it, expect, vi } from 'vitest';
import { logAuditEvent } from '@/lib/auditLogger';
import prisma from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  default: {
    auditEvent: {
      create: vi.fn().mockResolvedValue({ id: 'test-event-1' })
    }
  }
}));

describe('Audit Logger', () => {
  it('creates an audit event with correct fields', async () => {
    const eventParams = {
      action: 'TEST_ACTION',
      actorId: 'user-123',
      affectedRecordId: 'record-456',
      newValues: { test: true },
      organizationId: 'org-1'
    };

    await logAuditEvent(eventParams);

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        action: 'TEST_ACTION',
        actorId: 'user-123',
        affectedRecordId: 'record-456',
        newValues: JSON.stringify({ test: true }),
        organizationId: 'org-1'
      }
    });
  });

  it('handles optional fields correctly', async () => {
    const eventParams = {
      action: 'SYSTEM_ACTION'
    };

    await logAuditEvent(eventParams);

    expect(prisma.auditEvent.create).toHaveBeenCalledWith({
      data: {
        action: 'SYSTEM_ACTION',
        actorId: undefined,
        affectedRecordId: undefined,
        previousValues: undefined,
        newValues: undefined,
        organizationId: undefined,
        requestContext: undefined
      }
    });
  });
});
