import logging
from typing import Optional, Dict, Any
import datetime

from .db_operations import (
    create_caller,
    create_location,
    create_session,
    create_dispatch,
    update_session,
    update_dispatch,
    find_available_responders,
    create_session_transcript
)

from models.db_operations import SessionTranscriptInput, CallerInput, LocationInput, SessionInput, DispatchInput, EmergencyType, SessionStatus, DispatchStatus,SessionTranscriptInput


logger = logging.getLogger("db-tools")

async def create_or_update_session(
    session_id: Optional[str] = None,
    emergency_type: Optional[str] = None,
    description: Optional[str] = None,
    caller_phone: Optional[str] = None,
    caller_name: Optional[str] = None,
    language: Optional[str] = None,
    address: Optional[str] = None,
    landmark: Optional[str] = None,
    gps_coordinates: Optional[str] = None,
    city: Optional[str] = None,
    district: Optional[str] = None,
    priority_level: Optional[int] = 3,
    notes: Optional[str] = None,
    status: Optional[SessionStatus] = None
) -> Dict[str, Any]:
    """
    Create or update an emergency session with all possible details.
    This is the main entry point for managing emergency sessions.
    
    Args:
        session_id: ID of existing session to update (optional)
        emergency_type: Type of emergency (MEDICAL, POLICE, FIRE, OTHER)
        description: Description of the emergency
        caller_phone: Phone number of the caller
        caller_name: Name of the caller
        language: Preferred language of the caller (defaults to Tamil)
        address: Address of the emergency
        landmark: Nearby landmark
        gps_coordinates: GPS coordinates (lat,long)
        city: City name
        district: District name
        priority_level: Priority level (1-5, where 1 is highest)
        notes: Additional notes about the emergency
        status: Session status (for updates)
        
    Returns:
        Dictionary with created/updated session details including caller and location information
    """
    try:
        caller_id = None
        if caller_phone:
            caller_data = CallerInput(
                phoneNumber=caller_phone,
                name=caller_name,
                language=language
            )
            caller = await create_caller(caller_data)
            if caller:
                caller_id = caller.id
                logger.info(f"Created/Updated caller with ID: {caller_id}")
            
        location_id = None
        if any([address, landmark, gps_coordinates, city, district]):
            location_data = LocationInput(
                address=address,
                landmark=landmark,
                gpsCoordinates=gps_coordinates,
                city=city,
                district=district
            )
            location = await create_location(location_data)
            if location:
                location_id = location.id
                logger.info(f"Created/Updated location with ID: {location_id}")
        
        # Convert emergency type to enum
        emergency_type_enum = None
        if emergency_type:
            try:
                emergency_type_enum = EmergencyType(emergency_type.upper())
            except ValueError:
                emergency_type_enum = EmergencyType.OTHER
                logger.warning(f"Invalid emergency type: {emergency_type}, defaulting to OTHER")
        
        # Prepare session data
        session_data = SessionInput(
            callerId=caller_id,
            phoneNumber=caller_phone,  
            emergencyType=emergency_type_enum,
            locationId=location_id,
            description=description,
            priorityLevel=priority_level,
            responseNotes=notes,
            status=status
        )
        
        if session_id:
            # Update existing session
            session = await update_session(session_id, session_data.dict(exclude_none=True))
            if not session:
                logger.error(f"Failed to update emergency session {session_id}")
                return {"success": False, "error": "Failed to update emergency session"}
            logger.info(f"Updated emergency session with ID: {session_id}")
        else:
            # Create new session
            session = await create_session(session_data)
            if not session:
                logger.error("Failed to create emergency session")
                return {"success": False, "error": "Failed to create emergency session"}
            logger.info(f"Created emergency session with ID: {session.id}")
        
        return {
            "success": True,
            "session_id": session.id,
            "caller_id": caller_id,
            "location_id": location_id,
            "emergency_type": emergency_type_enum.value if emergency_type_enum else None,
            "timestamp": session.updatedAt.isoformat() if session_id else session.createdAt.isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error managing emergency session: {str(e)}")
        return {"success": False, "error": str(e)}


async def manage_dispatch(
    session_id: str,
    dispatch_id: Optional[str] = None,
    responder_id: Optional[str] = None,
    emergency_type: Optional[str] = None,
    location_id: Optional[str] = None,
    notes: Optional[str] = None,
    status: Optional[DispatchStatus] = None,
    arrival_time: Optional[datetime.datetime] = None
) -> Dict[str, Any]:
    """
    Create or update a dispatch for an emergency session.
    If responder_id is not provided, it will find an available responder based on emergency type.
    
    Args:
        session_id: ID of the emergency session
        dispatch_id: ID of existing dispatch to update (optional)
        responder_id: ID of the responder to dispatch (optional)
        emergency_type: Type of emergency if responder needs to be found (MEDICAL, POLICE, FIRE, OTHER)
        location_id: Location ID to find nearby responders (optional)
        notes: Additional notes for the dispatch
        status: New status for the dispatch (for updates)
        arrival_time: Arrival time for ARRIVED status
        
    Returns:
        Dictionary with dispatch information
    """
    try:
        if not responder_id and emergency_type:
            try:
                emergency_type_enum = EmergencyType(emergency_type.upper())
            except ValueError:
                emergency_type_enum = EmergencyType.OTHER
                logger.warning(f"Invalid emergency type: {emergency_type}, defaulting to OTHER")
                
            available_responders = await find_available_responders(emergency_type_enum, location_id)
            
            if not available_responders or len(available_responders) == 0:
                logger.error(f"No available responders found for emergency type: {emergency_type}")
                return {"success": False, "error": "No available responders found"}

            responder_id = available_responders[0].id
            logger.info(f"Found available responder: {responder_id}")
        
        if not responder_id and not dispatch_id:
            logger.error("No responder ID provided and no available responders found")
            return {"success": False, "error": "No responder ID provided"}

        dispatch_data = DispatchInput(
            sessionId=session_id,
            responderId=responder_id,
            notes=notes,
            status=status,
            arrivalTime=arrival_time
        )
        
        if dispatch_id:
            # Update existing dispatch
            dispatch = await update_dispatch(dispatch_id, dispatch_data.dict(exclude_none=True))
            if not dispatch:
                logger.error(f"Failed to update dispatch {dispatch_id}")
                return {"success": False, "error": "Failed to update dispatch"}
            logger.info(f"Updated dispatch with ID: {dispatch_id}")
        else:
            # Create new dispatch
            dispatch = await create_dispatch(dispatch_data)
            if not dispatch:
                logger.error("Failed to create dispatch")
                return {"success": False, "error": "Failed to create dispatch"}
            logger.info(f"Created dispatch with ID: {dispatch.id}")
            
            # Update session status to DISPATCHED for new dispatches
            await update_session(session_id, {"status": SessionStatus.DISPATCHED})
        
        return {
            "success": True,
            "dispatch_id": dispatch.id,
            "session_id": session_id,
            "responder_id": responder_id,
            "timestamp": dispatch.updatedAt.isoformat() if dispatch_id else dispatch.dispatchTime.isoformat(),
            "status": dispatch.status
        }
        
    except Exception as e:
        logger.error(f"Error managing dispatch: {str(e)}")
        return {"success": False, "error": str(e)}


async def store_session_transcript(session_id: str, speaker_type: str, content: str):
    """
    Store a new session transcript entry in the database.
    
    Args:
        session_id: ID of the session
        speaker_type: Type of speaker (AGENT, CALLER, SYSTEM)
        content: Content of the message
    
    Returns:
        The created transcript entry
    """
    try:
        session_transcript_data = SessionTranscriptInput(
            sessionId=session_id,
            speakerType=speaker_type,
            content=content
        )
        result = await create_session_transcript(session_transcript_data)
        logger.info(f"Created transcript entry for session {session_id}")
        return result
    except Exception as e:
        logger.error(f"Error storing session transcript: {str(e)}")
        return None
