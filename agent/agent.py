import logging
from typing import Annotated, Optional
from datetime import datetime
import asyncio

from dotenv import load_dotenv
from livekit.agents import (
    AutoSubscribe,
    JobContext,
    JobProcess,
    WorkerOptions,
    cli,
    llm,
    metrics,
)
from livekit import api
from livekit.agents.pipeline import VoicePipelineAgent
from livekit.plugins import deepgram, silero, turn_detector, google
from tools import (
    create_or_update_session,
    manage_dispatch,
    store_session_transcript
)
from utils import ai_prompt, execute_db_operation

load_dotenv(dotenv_path=".env.local")
logger = logging.getLogger("voice-agent")



async def initialize_session():
    """
    Create an initial empty session when a connection is established.
    This allows for immediate transcript recording.
    
    Returns:
        The session ID if successful, None otherwise
    """
    try:
        result = await create_or_update_session(
            description="Initial session - details pending"
        )
        
        if result and "success" in result and result["success"] and "session_id" in result:
            session_id = result["session_id"]
            logger.info(f"Created initial session with ID: {session_id}")
            
            system_message = f"Emergency session initialized at {datetime.now().isoformat()}"
            await store_session_transcript(
                session_id=session_id,
                speaker_type="SYSTEM",
                content=system_message
            )
            
            return session_id
        else:
            logger.error("Failed to create initial session")
            return None
    except Exception as e:
        logger.error(f"Error initializing session: {str(e)}")
        return None


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Set up recording
    req = api.RoomCompositeEgressRequest(
        room_name=ctx.room.name,
        layout="speaker",
        preset=api.EncodingOptionsPreset.H264_720P_30,
        audio_only=False,
        segment_outputs=[api.SegmentedFileOutput(
            filename_prefix=f"emergency-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            playlist_name="playlist.m3u8",
            live_playlist_name="live-playlist.m3u8",
            segment_duration=5,
            gcp=api.GCPUpload(
                credentials=open("./scenic-shift-437715-m8-9058a9392575.json").read(), 
                bucket="dispatch-agent",  
            ),
        )],
    )
    
    lkapi = api.LiveKitAPI()
    try:
        res = await lkapi.egress.start_room_composite_egress(req)
        print("Started room recording with egress ID: ", res.egress_id)
        logger.info(f"Started room recording with egress ID: {res.egress_id}")
    except Exception as e:
        logger.error(f"Failed to start room recording: {str(e)}")
    
    initial_ctx = llm.ChatContext().append(
        role="system",
        text=(ai_prompt),
    )

    logger.info(f"connecting to room {ctx.room.name}")
    await ctx.connect(auto_subscribe=AutoSubscribe.AUDIO_ONLY)

    participant = await ctx.wait_for_participant()
    logger.info(f"starting voice assistant for participant {participant.identity}")
    
    current_session_id = await initialize_session()
    logger.info(f"Initialized session for participant {participant.identity}: {current_session_id}")
    
    class EmergencyResponseFnc(llm.FunctionContext):
        @llm.ai_callable()
        async def create_emergency_session(
            self,
            emergency_type: Annotated[
                Optional[str], llm.TypeInfo(description="Type of emergency (MEDICAL, POLICE, FIRE, OTHER)")
            ] = None,
            description: Annotated[
                Optional[str], llm.TypeInfo(description="Description of the emergency")
            ] = None,
            caller_phone: Annotated[
                Optional[str], llm.TypeInfo(description="Phone number of the caller")
            ] = None,
            caller_name: Annotated[
                Optional[str], llm.TypeInfo(description="Name of the caller")
            ] = None,
            language: Annotated[
                Optional[str], llm.TypeInfo(description="Preferred language of the caller (defaults to Tamil)")
            ] = None,
            address: Annotated[
                Optional[str], llm.TypeInfo(description="Address of the emergency")
            ] = None,
            landmark: Annotated[
                Optional[str], llm.TypeInfo(description="Nearby landmark")
            ] = None,
            gps_coordinates: Annotated[
                Optional[str], llm.TypeInfo(description="GPS coordinates (lat,long)")
            ] = None,
            city: Annotated[
                Optional[str], llm.TypeInfo(description="City name")
            ] = None,
            district: Annotated[
                Optional[str], llm.TypeInfo(description="District name")
            ] = None,
            priority_level: Annotated[
                Optional[int], llm.TypeInfo(description="Priority level (1-5, where 1 is highest)")
            ] = 3,
            notes: Annotated[
                Optional[str], llm.TypeInfo(description="Additional notes about the emergency")
            ] = None,
            status: Annotated[
                Optional[str], llm.TypeInfo(description="Session status (for updates)")
            ] = None
        ):
            """Called to create or update an emergency session with all relevant details. Use this when you've gathered enough information about an emergency."""
            nonlocal current_session_id
            
            if current_session_id:
                logger.info(f"Session already exists ({current_session_id}), updating with new information")
                result = await create_or_update_session(
                    session_id=current_session_id,
                    emergency_type=emergency_type,
                    description=description,
                    caller_phone=caller_phone,
                    caller_name=caller_name,
                    language=language,
                    address=address,
                    landmark=landmark,
                    gps_coordinates=gps_coordinates,
                    city=city,
                    district=district,
                    priority_level=priority_level,
                    notes=notes,
                    status=status
                )
                
                if result and result.get("success"):
                    system_message = f"Enhanced session with additional details at {datetime.now().isoformat()}"
                    asyncio.create_task(
                        store_session_transcript(
                            session_id=current_session_id,
                            speaker_type="SYSTEM",
                            content=system_message
                        )
                    )
                    return result
                else:
                    logger.warning(f"Failed to update session {current_session_id}, creating new one")
                    current_session_id = None
            
            if not current_session_id:
                result = await create_or_update_session(
                    emergency_type=emergency_type,
                    description=description,
                    caller_phone=caller_phone,
                    caller_name=caller_name,
                    language=language,
                    address=address,
                    landmark=landmark,
                    gps_coordinates=gps_coordinates,
                    city=city,
                    district=district,
                    priority_level=priority_level,
                    notes=notes,
                    status=status
                )
                
                if result and "success" in result and result["success"] and "session_id" in result:
                    current_session_id = result["session_id"]
                    logger.info(f"Created new session with ID: {current_session_id}")
                
                return result
            return {"success": False, "error": "Unknown error in session handling"}
        
        @llm.ai_callable()
        async def dispatch_responder(
            self,
            session_id: Annotated[
                Optional[str], llm.TypeInfo(description="ID of the emergency session")
            ] = None,
            responder_id: Annotated[
                Optional[str], llm.TypeInfo(description="ID of the responder to dispatch")
            ] = None,
            emergency_type: Annotated[
                Optional[str], llm.TypeInfo(description="Type of emergency if responder needs to be found")
            ] = None,
            location_id: Annotated[
                Optional[str], llm.TypeInfo(description="Location ID to find nearby responders")
            ] = None,
            notes: Annotated[
                Optional[str], llm.TypeInfo(description="Additional notes for the dispatch")
            ] = None,
            status: Annotated[
                Optional[str], llm.TypeInfo(description="Dispatch status (for updates)")
            ] = None,
            arrival_time: Annotated[
                Optional[str], llm.TypeInfo(description="Arrival time for ARRIVED status")
            ] = None
        ):
            """Called to dispatch or update a responder for the emergency. Use after creating an emergency session."""
            nonlocal current_session_id
            
            if not session_id and current_session_id:
                session_id = current_session_id
                logger.info(f"Using current session ID: {session_id} for dispatch")
            
            arrival_datetime = None
            if arrival_time:
                try:
                    arrival_datetime = datetime.fromisoformat(arrival_time)
                except ValueError:
                    logger.warning(f"Invalid arrival time format: {arrival_time}")
            
            result = await manage_dispatch(
                session_id=session_id,
                responder_id=responder_id,
                emergency_type=emergency_type,
                location_id=location_id,
                notes=notes,
                status=status,
                arrival_time=arrival_datetime
            )
            return result

    fnc_ctx = EmergencyResponseFnc()

    agent = VoicePipelineAgent(
        vad=ctx.proc.userdata["vad"],
        stt=deepgram.STT(),
        llm=google.LLM(model="gemini-2.0-flash"),
        tts=deepgram.TTS(),
        turn_detector=turn_detector.EOUModel(),
        min_endpointing_delay=0.5,
        max_endpointing_delay=5.0,
        chat_ctx=initial_ctx,
        fnc_ctx=fnc_ctx
    )

    usage_collector = metrics.UsageCollector()

    @agent.on("metrics_collected")
    def on_metrics_collected(agent_metrics: metrics.AgentMetrics):
        metrics.log_metrics(agent_metrics)
        usage_collector.collect(agent_metrics)
        print("printed message: ",agent_metrics)

    @agent.on("user_speech_committed")
    def on_user_speech_committed(msg=None):
        try:
            nonlocal current_session_id
            
            if not current_session_id:
                logger.info("No active session ID, skipping transcript storage")
                return
                
            if msg is None:
                logger.info("No message provided in user_speech_committed event, skipping transcript storage")
                return
                
            content = msg.content if hasattr(msg, 'content') else str(msg)
                
            # Create a task for the async operation
            asyncio.create_task(
                store_session_transcript(
                    session_id=current_session_id,
                    speaker_type="CALLER",
                    content=content
                )
            )
            logger.info(f"Created task to store user speech in transcript: {content[:50]}...")
        except Exception as e:
            logger.error(f"Error processing user_speech_committed event: {str(e)}")
    
    @agent.on("agent_stopped_speaking") 
    def on_agent_stopped_speaking(msg=None):
        try:
            nonlocal current_session_id
            
            if not current_session_id:
                logger.info("No active session ID, skipping transcript storage")
                return
                
            if msg is None:
                logger.info("No message provided in agent_stopped_speaking event, skipping transcript storage")
                return
                
            content = msg.content if hasattr(msg, 'content') else str(msg)
                
            asyncio.create_task(
                store_session_transcript(
                    session_id=current_session_id,
                    speaker_type="AGENT",
                    content=content
                )
            )
            logger.info(f"Created task to store agent speech in transcript: {content[:50]}...")
        except Exception as e:
            logger.error(f"Error processing agent_stopped_speaking event: {str(e)}")

    agent.start(ctx.room, participant)

    try:
        await agent.say("Hello, what is your emergency? I'm ready to help you.", allow_interruptions=True)
        
        # Wait for the agent to complete
        await agent.wait_for_completion()
        
        # Ensure all pending operations are completed
        pending = asyncio.all_tasks()
        if pending:
            logger.info(f"Waiting for {len(pending)} pending tasks to complete...")
            await asyncio.gather(*pending)
            
        logger.info("Agent completed successfully")
    except Exception as e:
        logger.error(f"Error during agent execution: {str(e)}")
        raise
    finally:
        # Clean up database connection
        from utils import close_prisma_client
        await close_prisma_client()
        # Close LiveKit API connection
        await lkapi.aclose()


if __name__ == "__main__":
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
            prewarm_fnc=prewarm
        ),
    )
