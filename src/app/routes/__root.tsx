import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/app/providers';
import { Nav } from '@/app/layout/Nav';
import { Footer } from '@/app/layout/Footer';
import { NotFound } from '@/app/layout/NotFound';

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});

function RootLayout() {
  return (
    <ThemeProvider>
      <div className="min-h-screen">
        <Nav />
        <main className="max-w-[700px] mx-auto px-6 pt-8 pb-24 min-h-[calc(100vh-200px)]">
          <Outlet />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
