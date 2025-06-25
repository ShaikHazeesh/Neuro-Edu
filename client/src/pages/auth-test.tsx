import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";

const AuthTestPage = () => {
  const [username, setUsername] = useState('testuser');
  const [password, setPassword] = useState('password123');
  const [email, setEmail] = useState('test@example.com');
  const [debugResponse, setDebugResponse] = useState<any>(null);
  const [testResponse, setTestResponse] = useState<any>(null);
  const { loginMutation, registerMutation } = useAuth();

  const handleDebug = async () => {
    try {
      const res = await fetch('/api/debug');
      const data = await res.json();
      setDebugResponse(data);
      console.log('Debug response:', data);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugResponse({ error: String(error) });
    }
  };

  const handleTestLogin = async () => {
    try {
      const res = await fetch('/api/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      setTestResponse(data);
      console.log('Test response:', data);
    } catch (error) {
      console.error('Test error:', error);
      setTestResponse({ error: String(error) });
    }
  };

  const handleLogin = () => {
    loginMutation.mutate({ username, password });
  };

  const handleRegister = () => {
    registerMutation.mutate({ username, password, email });
  };

  return (
    <div className="container py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Auth API Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Button onClick={handleDebug} className="mr-2">Test Debug Endpoint</Button>
              {debugResponse && (
                <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                  {JSON.stringify(debugResponse, null, 2)}
                </pre>
              )}
            </div>
            
            <div className="mt-4">
              <Button onClick={handleTestLogin} className="mr-2">Test Login Endpoint</Button>
              {testResponse && (
                <pre className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Login Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleLogin} className="w-full">
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </Button>
              {loginMutation.isError && (
                <div className="text-red-500 mt-2">
                  {loginMutation.error.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Register Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block mb-2">Username</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleRegister} className="w-full">
                {registerMutation.isPending ? 'Registering...' : 'Register'}
              </Button>
              {registerMutation.isError && (
                <div className="text-red-500 mt-2">
                  {registerMutation.error.message}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthTestPage; 