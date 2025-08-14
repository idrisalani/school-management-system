// client/src/layout/index.js
export * from './variations';
export { default as Header } from './components/Header';
export { default as Footer } from './components/Footer';
export { default as Sidebar } from './components/Sidebar';
export { default as Breadcrumbs } from './components/Breadcrumbs';
export { default as MobileNav } from './components/MobileNav';

// Usage example:
/*
import { MainLayout, SimpleLayout, FocusLayout, SplitLayout } from '@/layout';

const routes = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'students', element: <Students /> },
    ]
  },
  {
    path: '/auth',
    element: <SimpleLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
    ]
  },
  {
    path: '/focus',
    element: <FocusLayout />,
    children: [
      { path: 'exam', element: <ExamView /> },
      { path: 'reading', element: <ReadingView /> },
    ]
  },
  {
    path: '/split',
    element: <SplitLayout />,
    children: [
      { path: 'lesson', element: <LessonView /> },
      { path: 'documentation', element: <DocumentationView /> },
    ]
  }
];
*/