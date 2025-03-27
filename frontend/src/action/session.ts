import { api } from "./user";
import { useQueryData } from "@/hooks/useQueryData";
import { useMutationData } from "@/hooks/useMutationData";

// Types based on Prisma schema
export type SessionStatus = 'ACTIVE' | 'EMERGENCY_VERIFIED' | 'DISPATCHED' | 'COMPLETED' | 'DROPPED' | 'TRANSFERRED' | 'NON_EMERGENCY';
export type EmergencyType = 'MEDICAL' | 'POLICE' | 'FIRE' | 'OTHER';
export type SpeakerType = 'AGENT' | 'CALLER' | 'SYSTEM';

export interface Caller {
  id: string;
  phoneNumber: string | null;
  name: string | null;
  language: string;
}

export interface Location {
  id: string;
  address: string | null;
  landmark: string | null;
  gpsCoordinates: string | null;
  city: string | null;
  district: string | null;
}

export interface SessionTranscript {
  id: string;
  content: string;
  speakerType: SpeakerType;
  timestamp: string;
}

export interface Responder {
  id: string;
  responderType: string;
  identifier: string;
  status: string;
}

export interface Dispatch {
  id: string;
  responder: Responder;
  dispatchTime: string;
  arrivalTime: string | null;
  status: string;
}

export interface Session {
  id: string;
  startTime: string;
  endTime: string | null;
  status: SessionStatus;
  phoneNumber: string | null;
  callerId: string | null;
  caller: Caller | null;
  emergencyType: EmergencyType | null;
  locationId: string | null;
  location: Location | null;
  description: string | null;
  priorityLevel: number | null;
  responseNotes: string | null;
  transcriptEntries: SessionTranscript[];
  dispatches: Dispatch[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  phoneNumber?: string;
  callerId?: string;
  emergencyType?: EmergencyType;
  locationId?: string;
  description?: string;
  priorityLevel?: number;
}

export interface UpdateSessionRequest {
  phoneNumber?: string;
  callerId?: string;
  emergencyType?: EmergencyType;
  locationId?: string;
  description?: string;
  priorityLevel?: number;
  responseNotes?: string;
}

export interface UpdateSessionStatusRequest {
  status: SessionStatus;
}

export interface CreateTranscriptRequest {
  content: string;
  speakerType: SpeakerType;
}

// API Functions

// Get all sessions
export const useGetSessions = () => {
  return useQueryData(
    ['sessions'],
    async () => {
      const response = await api.get('/sessions');
      return response.data;
    }
  );
};

// Get active sessions
export const useGetActiveSessions = () => {
  return useQueryData(
    ['activeSessions'],
    async () => {
      const response = await api.get('/sessions/active');
      return response.data;
    }
  );
};

// Get single session
export const useGetSession = (sessionId: string) => {
  return useQueryData(
    ['session', sessionId],
    async () => {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    }
  );
};

// Create session
export const useCreateSession = (onSuccess?: () => void) => {
  return useMutationData(
    ['createSession'],
    async (data: CreateSessionRequest) => {
      const response = await api.post('/sessions', data);
      return response.data;
    },
    'sessions',
    onSuccess
  );
};

// Update session
export const useUpdateSession = (sessionId: string, onSuccess?: () => void) => {
  return useMutationData(
    ['updateSession', sessionId],
    async (data: UpdateSessionRequest) => {
      const response = await api.patch(`/sessions/${sessionId}`, data);
      return response.data;
    },
    ['sessions', 'session', sessionId],
    onSuccess
  );
};

// Update session status
export const useUpdateSessionStatus = (sessionId: string, onSuccess?: () => void) => {
  return useMutationData(
    ['updateSessionStatus', sessionId],
    async (data: UpdateSessionStatusRequest) => {
      const response = await api.patch(`/sessions/${sessionId}/status`, data);
      return response.data;
    },
    ['sessions', 'session', sessionId],
    onSuccess
  );
};

// Add transcript entry
export const useAddTranscriptEntry = (sessionId: string, onSuccess?: () => void) => {
  return useMutationData(
    ['addTranscriptEntry', sessionId],
    async (data: CreateTranscriptRequest) => {
      const response = await api.post(`/sessions/${sessionId}/transcript`, data);
      return response.data;
    },
    ['sessions', 'session', sessionId],
    onSuccess
  );
};

// Delete session
export const useDeleteSession = (sessionId: string, onSuccess?: () => void) => {
  return useMutationData(
    ['deleteSession', sessionId],
    async () => {
      const response = await api.delete(`/sessions/${sessionId}`);
      return response.data;
    },
    'sessions',
    onSuccess
  );
};

// Join session
export const useJoinSession = (sessionId: string, onSuccess?: () => void) => {
  return useMutationData(
    ['joinSession', sessionId],
    async () => {
      const response = await api.post(`/sessions/${sessionId}/join`);
      return response.data.message;
    },
    ['sessions', 'session', sessionId],
    onSuccess
  );
};

// Leave session
export const useLeaveSession = (sessionId: string, onSuccess?: () => void) => {
  return useMutationData(
    ['leaveSession', sessionId],
    async () => {
      const response = await api.post(`/sessions/${sessionId}/leave`);
      return response.data.message;
    },
    ['sessions', 'session', sessionId],
    onSuccess
  );
}; 