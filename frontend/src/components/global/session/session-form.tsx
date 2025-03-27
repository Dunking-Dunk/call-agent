import { useCreateSession, CreateSessionRequest, EmergencyType } from "@/action/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sessionFormSchema = z.object({
  phoneNumber: z.string().min(1, "Phone number is required"),
  emergencyType: z.enum(['MEDICAL', 'POLICE', 'FIRE', 'OTHER'] as const),
  description: z.string().min(1, "Description is required"),
  priorityLevel: z.number().min(1).max(5).optional(),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

export function SessionForm() {
  const navigate = useNavigate();
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues: {
      phoneNumber: "",
      emergencyType: "MEDICAL",
      description: "",
      priorityLevel: 3,
    },
  });

  const createSession = useCreateSession(() => {
    toast.success("Emergency call session created successfully");
    navigate("/main/session");
  });

  function onSubmit(data: SessionFormValues) {
    const sessionData: CreateSessionRequest = {
      ...data,
    };
    createSession.mutate(sessionData);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Emergency Call</CardTitle>
        <CardDescription>Create a new emergency call session</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter caller's phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emergency Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select emergency type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="MEDICAL">Medical Emergency</SelectItem>
                      <SelectItem value="POLICE">Police Emergency</SelectItem>
                      <SelectItem value="FIRE">Fire Emergency</SelectItem>
                      <SelectItem value="OTHER">Other Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the emergency situation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priorityLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority Level (1-5)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={5} 
                      {...field} 
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/main/session")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending ? "Creating..." : "Create Emergency Call"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 