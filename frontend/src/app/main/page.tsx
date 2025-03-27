import { Route, Routes } from "react-router";
import Profile from "./profile/page";
import Setting from "./setting/page";
import SessionPage from "./session/page";
import NewSessionPage from "./session/new/page";
import SessionDetailPage from "./session/[sessionId]/page";

export default function Dashboard() {
  return (
    <Routes>
      <Route path="/profile" element={<Profile />} />
      <Route path="/setting" element={<Setting />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/session/new" element={<NewSessionPage />} />
      <Route path="/session/:sessionId" element={<SessionDetailPage />} />
    </Routes>
  );
} 