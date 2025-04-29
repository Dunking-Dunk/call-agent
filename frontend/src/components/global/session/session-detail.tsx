import { useGetSession, useUpdateSession, useDeleteSession, useUpdateSessionStatus, useAddTranscriptEntry, Session, SessionStatus, SpeakerType, EmergencyType } from "@/action/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import Loader from "@/components/global/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

const statusColors: Record<SessionStatus, string> = {
  ACTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  EMERGENCY_VERIFIED: 'bg-purple-100 text-purple-800 border-purple-200',
  DISPATCHED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  DROPPED: 'bg-red-100 text-red-800 border-red-200',
  TRANSFERRED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  NON_EMERGENCY: 'bg-gray-100 text-gray-800 border-gray-200'
};

const emergencyTypeColors: Record<EmergencyType, string> = {
  MEDICAL: 'bg-red-100 text-red-800 border-red-200',
  POLICE: 'bg-blue-100 text-blue-800 border-blue-200',
  FIRE: 'bg-orange-100 text-orange-800 border-orange-200',
  OTHER: 'bg-gray-100 text-gray-800 border-gray-200'
};

export function SessionDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { data: sessionData, isPending } = useGetSession(sessionId || "");
  const session = sessionData as Session;
  const [responseNotes, setResponseNotes] = useState(session?.responseNotes || "");
  const [transcriptContent, setTranscriptContent] = useState("");
  const [speakerType, setSpeakerType] = useState<SpeakerType>("AGENT");

  const updateSession = useUpdateSession(sessionId || "", () => {
    toast.success("Session updated successfully");
  });

  const updateStatus = useUpdateSessionStatus(sessionId || "", () => {
    toast.success("Session status updated successfully");
  });

  const deleteSession = useDeleteSession(sessionId || "", () => {
    toast.success("Session deleted successfully");
    navigate("/session");
  });

  const addTranscriptEntry = useAddTranscriptEntry(sessionId || "", () => {
    toast.success("Transcript entry added successfully");
    setTranscriptContent("");
  });
  
  if (!session && isPending) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Session not found</h3>
          <p className="text-muted-foreground">The requested session could not be found.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/session")}
          >
            Back to Sessions
          </Button>
        </div>
      </div>
    );
  }

  const handleStatusChange = (newStatus: SessionStatus) => {
    updateStatus.mutate({ status: newStatus });
  };

  const handleNotesUpdate = () => {
    updateSession.mutate({ responseNotes });
  };

  const handleAddTranscript = () => {
    if (!transcriptContent.trim()) return;
    addTranscriptEntry.mutate({
      content: transcriptContent,
      speakerType,
    });
  };

  console.log(session)
  return (
    <Loader state={isPending} className="h-full">
      <ScrollArea className="h-full">
        <div className="container mx-auto py-6 space-y-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between rounded-t-lg">
              <div>
                <CardTitle className="text-2xl font-bold text-primary">Emergency Call Details</CardTitle>
                <CardDescription className="text-base">Manage emergency call session</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`${statusColors[session.status]} text-sm font-medium px-3 py-1`}
                >
                  {session.status}
                </Badge>
                <Button
                  variant="outline"
                  onClick={() => navigate("/session")}
                  className="hover:bg-primary/10"
                >
                  Back
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <Tabs defaultValue="details" className="space-y-4">
                <TabsList className="bg-muted/50 p-1">
                  <TabsTrigger value="details" className="data-[state=active]:shadow-sm">Details</TabsTrigger>
                  <TabsTrigger value="transcript" className="data-[state=active]:shadow-sm">Transcript</TabsTrigger>
                  <TabsTrigger value="dispatches" className="data-[state=active]:shadow-sm">Dispatches</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border shadow-sm">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="text-lg font-semibold">Caller Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">Phone:</span>
                          <span className="font-semibold">{session.phoneNumber}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">Name:</span>
                          <span className="font-semibold">{session.caller?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">Language:</span>
                          <span className="font-semibold">{session.caller?.language || 'Unknown'}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border shadow-sm">
                      <CardHeader className="bg-muted/30">
                        <CardTitle className="text-lg font-semibold">Location Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">Address:</span>
                          <span className="font-semibold text-right">{session.location?.address || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">Landmark:</span>
                          <span className="font-semibold text-right">{session.location?.landmark || 'None'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">City:</span>
                          <span className="font-semibold">{session.location?.city || 'Unknown'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-muted-foreground">District:</span>
                          <span className="font-semibold">{session.location?.district || 'Unknown'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg font-semibold">Emergency Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-muted-foreground">Type:</span>
                            <Badge 
                              variant="outline" 
                              className={`${emergencyTypeColors[session.emergencyType || 'OTHER']} font-medium`}
                            >
                              {session.emergencyType}
                            </Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-muted-foreground">Priority Level:</span>
                            <Badge 
                              variant={session.priorityLevel === 1 ? 'destructive' : 'outline'}
                              className="font-medium"
                            >
                              {session.priorityLevel || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-muted-foreground">Start Time:</span>
                            <span className="font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(session.startTime), 'PPp')}
                            </span>
                          </div>
                          {session.endTime && (
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-muted-foreground">End Time:</span>
                              <span className="font-semibold flex items-center gap-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(session.endTime), 'PPp')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">Description:</span>
                        <p className="mt-2 text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                          {session.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg font-semibold">Response Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <Textarea
                        value={responseNotes}
                        onChange={(e) => setResponseNotes(e.target.value)}
                        placeholder="Add response notes..."
                        className="min-h-[100px] shadow-sm"
                      />
                      <Button onClick={handleNotesUpdate} className="bg-primary hover:bg-primary/90">
                        Update Notes
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg font-semibold">Session Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => handleStatusChange('EMERGENCY_VERIFIED')}
                          disabled={session.status !== 'ACTIVE'}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Verify Emergency
                        </Button>
                        <Button
                          onClick={() => handleStatusChange('DISPATCHED')}
                          disabled={session.status !== 'EMERGENCY_VERIFIED'}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Dispatch Responders
                        </Button>
                        <Button
                          onClick={() => handleStatusChange('COMPLETED')}
                          disabled={session.status !== 'DISPATCHED'}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Complete Call
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusChange('DROPPED')}
                          disabled={session.status === 'COMPLETED'}
                        >
                          Drop Call
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange('NON_EMERGENCY')}
                          disabled={session.status === 'COMPLETED'}
                          className="hover:bg-primary/10"
                        >
                          Mark as Non-Emergency
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="transcript" className="space-y-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg font-semibold">Call Transcript</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                      <div className="flex gap-4">
                        <Input
                          value={transcriptContent}
                          onChange={(e) => setTranscriptContent(e.target.value)}
                          placeholder="Enter transcript content..."
                          className="shadow-sm"
                        />
                        <Select value={speakerType} onValueChange={(value: SpeakerType) => setSpeakerType(value)}>
                          <SelectTrigger className="w-[180px] shadow-sm">
                            <SelectValue placeholder="Select speaker type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AGENT">Agent</SelectItem>
                            <SelectItem value="CALLER">Caller</SelectItem>
                            <SelectItem value="SYSTEM">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddTranscript} className="bg-primary hover:bg-primary/90">
                          Add Entry
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {session.transcriptEntries.map((entry) => (
                          <div key={entry.id} className="flex flex-col space-y-1 bg-muted/30 p-3 rounded-md">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="font-medium">{entry.speakerType}</Badge>
                              <span className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(entry.timestamp), 'PPp')}
                              </span>
                            </div>
                            <p className="text-sm mt-2">{entry.content}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="dispatches" className="space-y-4">
                  <Card className="border shadow-sm">
                    <CardHeader className="bg-muted/30">
                      <CardTitle className="text-lg font-semibold">Dispatch History</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {session.dispatches.map((dispatch) => (
                          <div key={dispatch.id} className="flex flex-col space-y-2 bg-muted/30 p-3 rounded-md">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold">{dispatch.responder.responderType}</span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({dispatch.responder.identifier})
                                </span>
                              </div>
                              <Badge variant="outline" className="font-medium">{dispatch.status}</Badge>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Dispatched: {format(new Date(dispatch.dispatchTime), 'PPp')}
                              </span>
                              {dispatch.arrivalTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Arrived: {format(new Date(dispatch.arrivalTime), 'PPp')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Session</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the session.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteSession.mutate({})}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </Loader>
  );
} 