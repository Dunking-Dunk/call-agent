import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createLocationSchema = z.object({
  address: z.string().optional(),
  landmark: z.string().optional(),
  gpsCoordinates: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
});

export const updateLocationSchema = createLocationSchema.partial();

// Get all locations
export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      include: {
        sessions: true,
        responders: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
};

// Get location by ID
export const getLocationById = async (req: Request, res: Response) => {
  try {
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
      include: {
        sessions: true,
        responders: true,
      },
    });
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(location);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch location' });
  }
};

// Get locations by city
export const getLocationsByCity = async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      where: {
        city: req.params.city,
      },
      include: {
        sessions: true,
        responders: true,
      },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations by city' });
  }
};

// Get locations by district
export const getLocationsByDistrict = async (req: Request, res: Response) => {
  try {
    const locations = await prisma.location.findMany({
      where: {
        district: req.params.district,
      },
      include: {
        sessions: true,
        responders: true,
      },
    });
    res.json(locations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations by district' });
  }
};

// Create new location
export const createLocation = async (req: Request, res: Response) => {
  try {
    const data = createLocationSchema.parse(req.body);
    const location = await prisma.location.create({
      data,
    });
    res.status(201).json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create location' });
    }
  }
};

// Update location
export const updateLocation = async (req: Request, res: Response) => {
  try {
    const data = updateLocationSchema.parse(req.body);
    const location = await prisma.location.update({
      where: { id: req.params.id },
      data,
    });
    res.json(location);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to update location' });
    }
  }
};

// Delete location
export const deleteLocation = async (req: Request, res: Response) => {
  try {
    await prisma.location.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete location' });
  }
}; 