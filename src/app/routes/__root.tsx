import { createRootRoute, Outlet } from '@tanstack/react-router';
import { ThemeProvider } from '@/app/providers';
import { Nav } from '@/app/layout/Nav';
import { Footer } from '@/app/layout/Footer';

export const Route = createRootRoute({
  component: RootLayout,
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
