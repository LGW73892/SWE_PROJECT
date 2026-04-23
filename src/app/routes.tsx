import { createBrowserRouter } from "react-router";
import { Root } from "./components/root";
import { Home } from "./components/home";
import { Plan } from "./components/plan";
import { Schedule } from "./components/schedule";
import { Practice } from "./components/practice";
import { NotFound } from "./components/not-found";
import { Auth } from "./components/auth";
import { Profile } from "./components/profile";
import { QuestionBank } from "./components/question-bank";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "auth", Component: Auth },
      { path: "plan", Component: Plan },
      { path: "schedule", Component: Schedule },
      { path: "practice", Component: Practice },
      { path: "profile", Component: Profile },
      { path: "question-bank", Component: QuestionBank },
      { path: "*", Component: NotFound },
    ],
  },
]);
