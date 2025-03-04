import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, User, Fingerprint, Globe, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Identity types
interface IdentifyResponse {
  status: 'new' | 'existing';
  fingerprint?: string;
  suggestedNames?: string[];
  sessionId?: string;
  selectedName?: string;
  user?: {selectedName: string};
}

const Login = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [identifying, setIdentifying] = useState<boolean>(false);
  const [selecting, setSelecting] = useState<boolean>(false);
  const [identityResponse, setIdentityResponse] = useState<IdentifyResponse | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState<number>(0);
  const MAX_RETRIES = 5;

  // Get browser info for identification
  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
    };
  };

  // Check if user has a saved session
  const checkExistingSession = async () => {
    try {
      const sessionId = localStorage.getItem('sinet_session_id');
      const savedName = localStorage.getItem('sinet_user_name');

      if (sessionId && savedName) {
        const isValid = await validateSession(sessionId);
        if (isValid) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking existing session:', error);
      return false;
    }
  };

  // Validate an existing session
  const validateSession = async (sessionId: string) => {
    try {
      // First check - try to validate the session
      const response = await apiRequest('/api/identity/validate', {
        headers: {
          'X-Session-ID': sessionId,
        }
      });

      if (response.status === 'valid') {
        // Valid session, redirect to dashboard
        localStorage.setItem('sinet_user_name', response.user.selectedName);
        redirectToDashboard();
        return true;
      } else {
        // Invalid session, remove stored values
        localStorage.removeItem('sinet_session_id');
        localStorage.removeItem('sinet_user_name');
        return false;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('sinet_session_id');
      localStorage.removeItem('sinet_user_name');
      return false;
    }
  };

  // Function to safely make API requests with retries
  const safeApiRequest = async (url: string, options: any, maxRetries = 3) => {
    let retries = 0;
    let lastError;

    while (retries < maxRetries) {
      try {
        return await apiRequest(url, options);
      } catch (error) {
        lastError = error;
        console.warn(`API request failed (attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;

        // Wait before retrying (exponential backoff)
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
        }
      }
    }

    throw lastError;
  };

  // Identify the user
  const identifyUser = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // Check for existing session first
      const hasSession = await checkExistingSession();
      if (hasSession) {
        setLoading(false);
        return;
      }

      setIdentifying(true);

      // Get browser info
      const browserInfo = getBrowserInfo();

      // Get location if available (with user permission)
      let locationData = null;
      try {
        if (navigator.geolocation) {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000,
            });
          });

          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        }
      } catch (e) {
        console.log('Location access denied or unavailable');
      }

      // Call the identify endpoint with retry mechanism
      const response = await safeApiRequest('/api/identity/identify', {
        method: 'POST',
        body: {
          userAgent: browserInfo.userAgent,
          location: locationData
        }
      });

      setIdentityResponse(response);

      // If existing user, set session and redirect
      if (response.status === 'existing' && response.sessionId && response.selectedName) {
        localStorage.setItem('sinet_session_id', response.sessionId);
        localStorage.setItem('sinet_user_name', response.selectedName);
        redirectToDashboard();
      }

    } catch (error) {
      console.error('Error identifying user:', error);
      const errorMsg = error instanceof Error 
        ? `Connection issue: ${error.message}` 
        : 'Unable to establish secure connection with identity service';
      setErrorMessage(errorMsg);
    } finally {
      setIdentifying(false);
      setLoading(false);
    }
  };

  // Handle name selection
  const handleNameSelection = async (name: string) => {
    if (!identityResponse?.fingerprint) return;

    setSelectedName(name);
    setSelecting(true);
    setErrorMessage('');

    try {
      // Call the select-name endpoint with retry mechanism
      const response = await safeApiRequest('/api/identity/select-name', {
        method: 'POST',
        body: {
          fingerprint: identityResponse.fingerprint,
          selectedName: name,
          location: null // Don't send location data on name selection
        }
      });

      if (response.status === 'success' && response.sessionId) {
        // Store session info
        localStorage.setItem('sinet_session_id', response.sessionId);
        localStorage.setItem('sinet_user_name', response.selectedName);

        toast({
          title: "Login Successful",
          description: `Welcome, ${response.selectedName}!`,
        });

        // Redirect to dashboard
        redirectToDashboard();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error selecting name:', error);
      setErrorMessage('Failed to register your selected name. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  // Redirect to dashboard
  const redirectToDashboard = () => {
    setTimeout(() => {
      setLocation('/');
    }, 1000);
  };

  // Effect to identify the user on load with a slight delay
  useEffect(() => {
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      identifyUser();
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Effect to auto-retry identification if it fails
  useEffect(() => {
    if (errorMessage && retryCount < MAX_RETRIES) {
      const timer = setTimeout(() => {
        console.log(`Retrying identification (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
        setErrorMessage('');
        identifyUser();
        setRetryCount(prev => prev + 1);
      }, 1500 * (retryCount + 1)); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [errorMessage, retryCount]);

  // If still loading, show loading state
  if (loading && !identityResponse) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[450px]">
          <CardHeader className="text-center">
            <CardTitle>SINet Dashboard</CardTitle>
            <CardDescription>Establishing secure connection...</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-6 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Initializing zero-knowledge identity verification...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If we need to show name selection
  if (identityResponse?.status === 'new' && identityResponse.suggestedNames) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="w-[550px]">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Identity Verification</CardTitle>
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardDescription>
              Zero Knowledge Identity System - Choose your identity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <Fingerprint className="h-5 w-5 text-primary" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  Identity Fingerprint Generated
                </p>
                <p className="text-xs text-muted-foreground">
                  Your device has been analyzed using zero knowledge techniques
                </p>
              </div>
              <Badge>Secure</Badge>
            </div>

            {errorMessage && (
              <div className="flex items-center space-x-2 rounded-md border border-destructive p-3 bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-destructive">{errorMessage}</p>
              </div>
            )}

            <div>
              <p className="text-sm mb-3">Please select one of the following identities:</p>

              <ScrollArea className="h-[200px] rounded-md border p-4">
                <div className="grid grid-cols-1 gap-2">
                  {identityResponse.suggestedNames.map((name) => (
                    <Button
                      key={name}
                      variant={selectedName === name ? "default" : "outline"}
                      className="w-full justify-start text-left h-auto py-3"
                      onClick={() => handleNameSelection(name)}
                      disabled={selecting}
                    >
                      <div className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>{name}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <p className="text-xs text-muted-foreground">
              Your identity is secured using zero knowledge proofs. No personal information is stored.
            </p>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>NULL_ISLAND Identity Protocol</span>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Fallback/error state
  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-[450px]">
        <CardHeader className="text-center">
          <CardTitle>SINet Dashboard</CardTitle>
          <CardDescription>
            {errorMessage || "Connection issue. Please try again or refresh the page."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <Button onClick={identifyUser} disabled={identifying}>
            {identifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
            Try Again
          </Button>
        </CardContent>
        <CardFooter className="text-center text-xs text-muted-foreground">
          {retryCount > 0 && <p>Attempted {retryCount} automatic retries</p>}
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;