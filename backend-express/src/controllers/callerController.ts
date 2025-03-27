import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createCallerSchema = z.object({
  phoneNumber: z.string().optional(),
  name: z.string().optional(),
  language: z.string().optional(),
});

export const updateCallerSchema = createCallerSchema.partial();

// Get all callers
export const getAllCallers = async (req: Request, res: Response) => {
  try {
    const callers = await prisma.caller.findMany({
      include: {
        sessions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(callers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch callers' });
  }
};

// Get caller by ID
export const getCallerById = async (req: Request, res: Response) => {
  try {
    const caller = await prisma.caller.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: true,
      },
    });
    if (!caller) {
      return res.status(404).json({ error: 'Caller not found' });
    }
    res.json(caller);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch caller' });
  }
};

// Get caller by phone number
export const getCallerByPhone = async (req: Request, res: Response) => {
  try {
    const caller = await prisma.caller.findUnique({
      where: { phoneNumber: req.params.phoneNumber },
      include: {
        sessions: true,
      },
    });
    if (!caller) {
      return res.status(404).json({ error: 'Caller not found' });
    }
    res.json(caller);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch caller' });
  }
};

// Create new caller
export const createCaller = async (req: Request, res: Response) => {
  try {
    const data = createCallerSchema.parse(req.body);
    
    // If phone number is provided, check if it already exists
    if (data.phoneNumber) {
      const existingCaller = await prisma.caller.findUnique({
        where: { phoneNumber: data.phoneNumber },
      });
      if (existingCaller) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const caller = await prisma.caller.create({
      data,
    });
    res.status(201).json(caller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create caller' });
    }
  }
};

// Update caller
export const updateCaller = async (req: Request, res: Response) => {
  try {
    const data = updateCallerSchema.parse(req.body);
    
    // If phone number is being updated, check if it already exists
    if (data.phoneNumber) {
      const existingCaller = await prisma.caller.findFirst({
        where: {
          phoneNumber: data.phoneNumber,
          id: { not: req.params.id },
        },
      });
      if (existingCaller) {
        return res.status(400).json({ error: 'Phone number already registered' });
      }
    }

    const caller = await prisma.caller.update({
      where: { id: req.params.id },
      data,
    });
    res.json(caller);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update caller' });
    }
  }
};

// Delete caller
export const deleteCaller = async (req: Request, res: Response) => {
  try {
    await prisma.caller.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete caller' });
  }
}; 