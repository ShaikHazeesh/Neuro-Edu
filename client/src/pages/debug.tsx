import React from 'react';
import MainLayout from '@/components/layouts/MainLayout';
import StreakDebugger from '@/components/debug/StreakDebugger';
import FaceDetectionDebug from '@/components/debug/FaceDetectionDebug';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

const DebugPage: React.FC = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    return (
      <MainLayout>
        <div className="container mx-auto p-8">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                You need to be logged in to access debug tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/auth')}>
                Log In
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold mb-6">Debug Tools</h1>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          These tools are for development and troubleshooting purposes only.
          Logged in as: {user?.username || 'Unknown'}
        </p>

        <Tabs defaultValue="streak">
          <TabsList className="mb-4">
            <TabsTrigger value="streak">Streak Debugger</TabsTrigger>
            <TabsTrigger value="face">Face Detection</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="streak">
            <StreakDebugger />
          </TabsContent>

          <TabsContent value="face">
            <FaceDetectionDebug />
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Details about the current environment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Browser Information</h3>
                    <p className="text-sm">User Agent: {navigator.userAgent}</p>
                  </div>

                  <div>
                    <h3 className="font-medium">LocalStorage Status</h3>
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-xs overflow-auto max-h-40">
                      {Object.keys(localStorage).map(key => (
                        <div key={key} className="mb-1">
                          <strong>{key}:</strong> {
                            key.includes('token') || key.includes('password')
                              ? '[REDACTED]'
                              : localStorage.getItem(key)
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium">Network Status</h3>
                    <p className="text-sm">
                      Online: <span className={navigator.onLine ? 'text-green-500' : 'text-red-500'}>
                        {navigator.onLine ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default DebugPage;