import { useGetSessions, Session, SessionStatus, EmergencyType } from "@/action/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ClockIcon } from "lucide-react";

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

export function SessionList() {
  const { data: sessions, isPending } = useGetSessions();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "ALL">("ALL");
  const [emergencyTypeFilter, setEmergencyTypeFilter] = useState<EmergencyType | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH">("ALL");

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    return (sessions as Session[]).filter((session) => {
      const matchesSearch = 
        session.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.caller?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || session.status === statusFilter;
      const matchesEmergencyType = emergencyTypeFilter === "ALL" || session.emergencyType === emergencyTypeFilter;
      
      const sessionDate = new Date(session.startTime);
      const matchesDate = 
        dateFilter === "ALL" ||
        (dateFilter === "TODAY" && isToday(sessionDate)) ||
        (dateFilter === "YESTERDAY" && isYesterday(sessionDate)) ||
        (dateFilter === "THIS_WEEK" && isThisWeek(sessionDate)) ||
        (dateFilter === "THIS_MONTH" && isThisMonth(sessionDate));

      return matchesSearch && matchesStatus && matchesEmergencyType && matchesDate;
    });
  }, [sessions, searchQuery, statusFilter, emergencyTypeFilter, dateFilter]);

  if (isPending) {
    return (
      <div className="container mx-auto space-y-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <Card className="container mx-auto border-none shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
        <div>
          <CardTitle className="text-2xl font-bold text-primary">Emergency Sessions</CardTitle>
          <CardDescription className="text-base">View and manage emergency call sessions</CardDescription>
        </div>
        <Link to="/session/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            New Emergency Call
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Search</label>
            <Input
              placeholder="Search by phone, name, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shadow-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={(value: SessionStatus | "ALL") => setStatusFilter(value)}>
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.keys(statusColors).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Emergency Type</label>
            <Select value={emergencyTypeFilter} onValueChange={(value: EmergencyType | "ALL") => setEmergencyTypeFilter(value)}>
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                {Object.keys(emergencyTypeColors).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Date Range</label>
            <Select value={dateFilter} onValueChange={(value: typeof dateFilter) => setDateFilter(value)}>
              <SelectTrigger className="shadow-sm">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Time</SelectItem>
                <SelectItem value="TODAY">Today</SelectItem>
                <SelectItem value="YESTERDAY">Yesterday</SelectItem>
                <SelectItem value="THIS_WEEK">This Week</SelectItem>
                <SelectItem value="THIS_MONTH">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">Phone Number</TableHead>
                <TableHead className="font-semibold">Caller</TableHead>
                <TableHead className="font-semibold">Emergency Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Start Time</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">{session.phoneNumber}</TableCell>
                  <TableCell>{session.caller?.name || 'Unknown'}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={emergencyTypeColors[session.emergencyType || 'OTHER']}
                    >
                      {session.emergencyType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={statusColors[session.status]}
                    >
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(session.startTime), 'PPp')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={session.priorityLevel === 1 ? 'destructive' : 'outline'}
                      className="font-medium"
                    >
                      {session.priorityLevel || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link to={`/session/${session.id}`}>
                      <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                        View Details
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 