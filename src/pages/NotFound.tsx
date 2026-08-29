import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";

const NotFound = () => {
  const refreshApp = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.allSettled(
        registrations
          .filter(({ active }) => active?.scriptURL.endsWith("/sw.js") || active?.scriptURL.endsWith("/pwabuilder-sw.js"))
          .map((registration) => registration.update()),
      );
    }
    window.location.assign(`${window.location.origin}/dashboard`);
  };

  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Return Home
            </Link>
          </Button>
          <Button asChild onClick={() => window.history.back()}>
            <button type="button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </button>
          </Button>
          <Button variant="secondary" onClick={refreshApp}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh app
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
