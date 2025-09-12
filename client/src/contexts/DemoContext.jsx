// @ts-nocheck
// client/src/contexts/DemoContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DemoContext = createContext();

export const useDemo = () => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
};

export const DemoProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoUser, setDemoUser] = useState(null);
  const [demoSessionId, setDemoSessionId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Demo user templates - memoized to avoid dependency issues
  const demoUsers = useMemo(
    () => ({
      admin: {
        id: "demo_admin",
        email: "admin@demo.edumanager.com",
        username: "demo.admin",
        first_name: "Demo",
        last_name: "Administrator",
        role: "admin",
        status: "active",
        is_verified: true,
        profile_completed: true,
      },
      teacher: {
        id: "demo_teacher",
        email: "teacher@demo.edumanager.com",
        username: "demo.teacher",
        first_name: "Sarah",
        last_name: "Johnson",
        role: "teacher",
        status: "active",
        department: "Mathematics",
        employee_id: "TCH001",
        is_verified: true,
        profile_completed: true,
      },
      student: {
        id: "demo_student",
        email: "student@demo.edumanager.com",
        username: "demo.student",
        first_name: "Alex",
        last_name: "Chen",
        role: "student",
        status: "active",
        grade_level: "10th Grade",
        student_id: "STU001",
        is_verified: true,
        profile_completed: true,
      },
      parent: {
        id: "demo_parent",
        email: "parent@demo.edumanager.com",
        username: "demo.parent",
        first_name: "Jennifer",
        last_name: "Smith",
        role: "parent",
        status: "active",
        occupation: "Marketing Manager",
        relationship_to_student: "mother",
        is_verified: true,
        profile_completed: true,
      },
    }),
    []
  );

  const enterDemoMode = useCallback(
    (role) => {
      if (!demoUsers[role]) {
        console.error(`Demo role "${role}" not found`);
        return;
      }
      navigate(`/demo/${role}`);
    },
    [demoUsers, navigate]
  );

  const exitDemoMode = useCallback(() => {
    setIsDemoMode(false);
    setDemoUser(null);
    setDemoSessionId(null);
    sessionStorage.removeItem("demo_mode");
    sessionStorage.removeItem("demo_role");
    sessionStorage.removeItem("demo_user");
    navigate("/");
  }, [navigate]);

  const resetDemoData = useCallback(() => {
    console.log("Demo data reset for session:", demoSessionId);
    window.location.reload();
  }, [demoSessionId]);

  const getDemoMessage = useCallback(() => {
    if (!isDemoMode || !demoUser) return null;

    const messages = {
      admin:
        "You're viewing the admin dashboard with sample school data. All changes are temporary.",
      teacher:
        "You're experiencing the teacher interface with sample classes and students. Try creating assignments!",
      student:
        "You're in student view with sample grades and assignments. Explore your academic progress.",
      parent:
        "You're seeing the parent dashboard with sample children data. Check attendance and grades.",
    };

    return messages[demoUser.role] || "You're in demo mode with sample data.";
  }, [isDemoMode, demoUser]);

  // Check if current path is demo mode
  useEffect(() => {
    const path = location.pathname;
    const isDemo = path.startsWith("/demo");
    setIsDemoMode(isDemo);

    if (isDemo) {
      const pathParts = path.split("/");
      const role = pathParts[2];

      if (role && demoUsers[role]) {
        const selectedUser = demoUsers[role];
        setDemoUser(selectedUser);
        setDemoSessionId(`demo_${role}_${Date.now()}`);

        sessionStorage.setItem("demo_mode", "true");
        sessionStorage.setItem("demo_role", role);
        sessionStorage.setItem("demo_user", JSON.stringify(selectedUser));
      }
    } else {
      setDemoUser(null);
      setDemoSessionId(null);
      sessionStorage.removeItem("demo_mode");
      sessionStorage.removeItem("demo_role");
      sessionStorage.removeItem("demo_user");
    }
  }, [location.pathname, demoUsers]);

  // Restore demo state on page refresh
  useEffect(() => {
    const storedDemoMode = sessionStorage.getItem("demo_mode");
    const storedDemoUser = sessionStorage.getItem("demo_user");

    if (storedDemoMode === "true" && storedDemoUser) {
      try {
        const user = JSON.parse(storedDemoUser);
        if (user && user.role) {
          setDemoUser(user);
          setIsDemoMode(true);
          setDemoSessionId(`demo_${user.role}_restored`);
        }
      } catch (error) {
        console.error("Error restoring demo state:", error);
        sessionStorage.removeItem("demo_mode");
        sessionStorage.removeItem("demo_role");
        sessionStorage.removeItem("demo_user");
      }
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      isDemoMode,
      demoUser,
      demoSessionId,
      demoUsers,
      enterDemoMode,
      exitDemoMode,
      resetDemoData,
      getDemoMessage,
      availableRoles: Object.keys(demoUsers),
    }),
    [
      isDemoMode,
      demoUser,
      demoSessionId,
      demoUsers,
      enterDemoMode,
      exitDemoMode,
      resetDemoData,
      getDemoMessage,
    ]
  );

  return (
    <DemoContext.Provider value={contextValue}>{children}</DemoContext.Provider>
  );
};

export default DemoProvider;
