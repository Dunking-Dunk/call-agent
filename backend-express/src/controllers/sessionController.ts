import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createSessionSchema = z.object({
  phoneNumber: z.string().optional(),
  callerId: z.string().optional(),
  emergencyType: z.enum(['MEDICAL', 'POLICE', 'FIRE', 'OTHER']).optional(),
  locationId: z.string().optional(),
  description: z.string().optional(),
  priorityLevel: z.number().min(1).max(5).optional(),
});

export const updateSessionSchema = createSessionSchema.partial();

export const updateSessionStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'EMERGENCY_VERIFIED', 'DISPATCHED', 'COMPLETED', 'DROPPED', 'TRANSFERRED', 'NON_EMERGENCY']),
});

export const createTranscriptSchema = z.object({
  content: z.string(),
  speakerType: z.enum(['AGENT', 'CALLER', 'SYSTEM']),
});

// Get all sessions
export const getAllSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await prisma.session.findMany({
      include: {
        caller: true,
        location: true,
        transcriptEntries: true,
        dispatches: {
          include: {
            responder: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};

// Get active sessions
export const getActiveSessions = async (req: Request, res: Response) => {
  try {
    const activeSessions = await prisma.session.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        caller: true,
        location: true,
        transcriptEntries: true,
        dispatches: {
          include: {
            responder: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(activeSessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active sessions' });
  }
};

// Get session by ID
export const getSessionById = async (req: Request, res: Response) => {
  try {
    const session = await prisma.session.findUnique({
      where: { id: req.params.id },
      include: {
        caller: true,
        location: true,
        transcriptEntries: true,
        dispatches: {
          include: {
            responder: true,
          },
        },
      },
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

// Create new session
export const createSession = async (req: Request, res: Response) => {
  try {
    const data = createSessionSchema.parse(req.body);
    const session = await prisma.session.create({
      data,
      include: {
        caller: true,
        location: true,
      },
    });
    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create session' });
    }
  }
};

// Update session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const data = updateSessionSchema.parse(req.body);
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data,
      include: {
        caller: true,
        location: true,
      },
    });
    res.status(200).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update session' });
    }
  }
};

// Update session status
export const updateSessionStatus = async (req: Request, res: Response) => {
  try {
    const { status } = updateSessionStatusSchema.parse(req.body);
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        caller: true,
        location: true,
      },
    });
    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update session status' });
    }
  }
};

// Add transcript entry
export const addTranscriptEntry = async (req: Request, res: Response) => {
  try {
    const { content, speakerType } = createTranscriptSchema.parse(req.body);
    const transcriptEntry = await prisma.sessionTranscript.create({
      data: {
        sessionId: req.params.id,
        content,
        speakerType,
      },
    });
    res.status(201).json(transcriptEntry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to add transcript entry' });
    }
  }
};

// Delete session
export const deleteSession = async (req: Request, res: Response) => {
  try {
    await prisma.session.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
}; 