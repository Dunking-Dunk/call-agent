import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createDispatchSchema = z.object({
  sessionId: z.string(),
  responderId: z.string(),
  notes: z.string().optional(),
});

export const updateDispatchSchema = z.object({
  arrivalTime: z.string().datetime().optional(),
  status: z.enum(['DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'COMPLETED', 'CANCELLED']).optional(),
  notes: z.string().optional(),
});

// Get all dispatches
export const getAllDispatches = async (req: Request, res: Response) => {
  try {
    const dispatches = await prisma.dispatch.findMany({
      include: {
        session: true,
        responder: true,
      },
      orderBy: {
        dispatchTime: 'desc',
      },
    });
    res.json(dispatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dispatches' });
  }
};

// Get active dispatches
export const getActiveDispatches = async (req: Request, res: Response) => {
  try {
    const activeDispatches = await prisma.dispatch.findMany({
      where: {
        status: {
          in: ['DISPATCHED', 'EN_ROUTE', 'ARRIVED'],
        },
      },
      include: {
        session: true,
        responder: true,
      },
      orderBy: {
        dispatchTime: 'desc',
      },
    });
    res.json(activeDispatches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch active dispatches' });
  }
};

// Get dispatch by ID
export const getDispatchById = async (req: Request, res: Response) => {
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: req.params.id },
      include: {
        session: true,
        responder: true,
      },
    });
    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }
    res.json(dispatch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dispatch' });
  }
};

// Create new dispatch
export const createDispatch = async (req: Request, res: Response) => {
  try {
    const data = createDispatchSchema.parse(req.body);
    
    // Check if session exists and is active
    const session = await prisma.session.findUnique({
      where: { id: data.sessionId },
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'ACTIVE' && session.status !== 'EMERGENCY_VERIFIED') {
      return res.status(400).json({ error: 'Session is not active or verified' });
    }

    // Check if responder is available
    const responder = await prisma.responder.findUnique({
      where: { id: data.responderId },
    });
    if (!responder) {
      return res.status(404).json({ error: 'Responder not found' });
    }
    if (responder.status !== 'AVAILABLE') {
      return res.status(400).json({ error: 'Responder is not available' });
    }

    // Create dispatch and update responder status
    const dispatch = await prisma.$transaction([
      prisma.dispatch.create({
        data,
        include: {
          session: true,
          responder: true,
        },
      }),
      prisma.responder.update({
        where: { id: data.responderId },
        data: { status: 'DISPATCHED' },
      }),
    ]);

    res.status(201).json(dispatch[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create dispatch' });
    }
  }
};

// Update dispatch
export const updateDispatch = async (req: Request, res: Response) => {
  try {
    const data = updateDispatchSchema.parse(req.body);
    
    // Start a transaction to update both dispatch and responder status
    const result = await prisma.$transaction(async (tx) => {
      // Update dispatch
      const dispatch = await tx.dispatch.update({
        where: { id: req.params.id },
        data,
        include: {
          session: true,
          responder: true,
        },
      });

      // Update responder status based on dispatch status
      if (data.status) {
        let responderStatus: 'AVAILABLE' | 'DISPATCHED' | 'ON_ROUTE' | 'ON_SCENE' | 'RETURNING' | 'OUT_OF_SERVICE';
        
        switch (data.status) {
          case 'COMPLETED':
            responderStatus = 'AVAILABLE';
            break;
          case 'EN_ROUTE':
            responderStatus = 'ON_ROUTE';
            break;
          case 'ARRIVED':
            responderStatus = 'ON_SCENE';
            break;
          case 'DISPATCHED':
            responderStatus = 'DISPATCHED';
            break;
          case 'CANCELLED':
            responderStatus = 'AVAILABLE';
            break;
          default:
            responderStatus = 'AVAILABLE';
        }

        await tx.responder.update({
          where: { id: dispatch.responderId },
          data: { status: responderStatus },
        });
      }

      return dispatch;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update dispatch' });
    }
  }
};

// Delete dispatch
export const deleteDispatch = async (req: Request, res: Response) => {
  try {
    const dispatch = await prisma.dispatch.findUnique({
      where: { id: req.params.id },
    });
    if (!dispatch) {
      return res.status(404).json({ error: 'Dispatch not found' });
    }

    // Reset responder status to available
    await prisma.$transaction([
      prisma.dispatch.delete({
        where: { id: req.params.id },
      }),
      prisma.responder.update({
        where: { id: dispatch.responderId },
        data: { status: 'AVAILABLE' },
      }),
    ]);

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete dispatch' });
  }
}; 