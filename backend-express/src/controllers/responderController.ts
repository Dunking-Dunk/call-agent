import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createResponderSchema = z.object({
  responderType: z.enum(['AMBULANCE', 'POLICE', 'FIRE', 'OTHER']),
  identifier: z.string(),
  status: z.enum(['AVAILABLE', 'DISPATCHED', 'ON_ROUTE', 'ON_SCENE', 'RETURNING', 'OUT_OF_SERVICE']).optional(),
  locationId: z.string().optional(),
});

export const updateResponderSchema = createResponderSchema.partial();

// Get all responders
export const getAllResponders = async (req: Request, res: Response) => {
  try {
    const responders = await prisma.responder.findMany({
      include: {
        location: true,
        dispatches: {
          include: {
            session: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(responders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
};

// Get available responders
export const getAvailableResponders = async (req: Request, res: Response) => {
  try {
    const availableResponders = await prisma.responder.findMany({
      where: {
        status: 'AVAILABLE',
      },
      include: {
        location: true,
      },
    });
    res.json(availableResponders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch available responders' });
  }
};

// Get responders by type
export const getRespondersByType = async (req: Request, res: Response) => {
  try {
    const responders = await prisma.responder.findMany({
      where: {
        responderType: req.params.type as 'AMBULANCE' | 'POLICE' | 'FIRE' | 'OTHER',
      },
      include: {
        location: true,
        dispatches: {
          include: {
            session: true,
          },
        },
      },
    });
    res.json(responders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders by type' });
  }
};

// Get responder by ID
export const getResponderById = async (req: Request, res: Response) => {
  try {
    const responder = await prisma.responder.findUnique({
      where: { id: req.params.id },
      include: {
        location: true,
        dispatches: {
          include: {
            session: true,
          },
        },
      },
    });
    if (!responder) {
      return res.status(404).json({ error: 'Responder not found' });
    }
    res.json(responder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responder' });
  }
};

// Create new responder
export const createResponder = async (req: Request, res: Response) => {
  try {
    const data = createResponderSchema.parse(req.body);
    
    // Check if identifier already exists
    const existingResponder = await prisma.responder.findFirst({
      where: { identifier: data.identifier },
    });
    if (existingResponder) {
      return res.status(400).json({ error: 'Identifier already registered' });
    }

    const responder = await prisma.responder.create({
      data,
      include: {
        location: true,
      },
    });
    res.status(201).json(responder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create responder' });
    }
  }
};

// Update responder
export const updateResponder = async (req: Request, res: Response) => {
  try {
    const data = updateResponderSchema.parse(req.body);
    
    // If identifier is being updated, check if it already exists
    if (data.identifier) {
      const existingResponder = await prisma.responder.findFirst({
        where: {
          identifier: data.identifier,
          id: { not: req.params.id },
        },
      });
      if (existingResponder) {
        return res.status(400).json({ error: 'Identifier already registered' });
      }
    }

    const responder = await prisma.responder.update({
      where: { id: req.params.id },
      data,
      include: {
        location: true,
      },
    });
    res.json(responder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update responder' });
    }
  }
};

// Update responder status
export const updateResponderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = z.object({
      status: z.enum(['AVAILABLE', 'DISPATCHED', 'ON_ROUTE', 'ON_SCENE', 'RETURNING', 'OUT_OF_SERVICE']),
    }).parse(req.body);

    const responder = await prisma.responder.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        location: true,
      },
    });
    res.json(responder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update responder status' });
    }
  }
};

// Delete responder
export const deleteResponder = async (req: Request, res: Response) => {
  try {
    await prisma.responder.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete responder' });
  }
}; 