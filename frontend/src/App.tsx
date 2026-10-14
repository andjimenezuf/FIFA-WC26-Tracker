import { Route, Routes } from "react-router-dom";
import { Header } from "@/components/header";
import { ChatPage } from "@/pages/ChatPage";
import { HomePage } from "@/pages/HomePage";
import { PredictionsPage } from "@/pages/PredictionsPage";
import { ProjectArchitecturePage } from "@/pages/ProjectArchitecturePage";
import { TodayPage } from "@/pages/TodayPage";

export function App() {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/today" element={<TodayPage />} />
        <Route path="/predictions" element={<PredictionsPage />} />
        <Route
          path="/project-architecture"
          element={<ProjectArchitecturePage />}
        />
        <Route path="/chat/:id" element={<ChatPage />} />
      </Routes>
    </div>
  );
}
