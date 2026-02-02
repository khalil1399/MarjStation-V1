import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { userService } from '../services/firebase/userService';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Shield, Lock, AlertCircle } from 'lucide-react';

const AdminPasswordVerify = () => {
  const { currentUser } = useAuth();
  const { verifyAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkIfAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const checkIfAdmin = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const userProfile = await userService.getUserProfile(currentUser.uid);
      if (userProfile && userProfile.isAdmin === true) {
        setIsAdmin(true);
      } else {
        setError('You do not have admin privileges');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setError('Error verifying admin status');
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Re-authenticate user with password
      await signInWithEmailAndPassword(auth, currentUser.email, password);
      
      // Verify admin status again
      const userProfile = await userService.getUserProfile(currentUser.uid);
      if (userProfile && userProfile.isAdmin === true) {
        verifyAdmin();
        navigate('/admin');
      } else {
        setError('Admin privileges not found');
      }
    } catch (error) {
      console.error('Password verification failed:', error);
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Incorrect password. Please try again.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert className="max-w-md bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error || 'Access Denied: Admin privileges required'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Shield className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel Access</h1>
          <p className="text-gray-600">Please re-enter your password to continue</p>
        </div>

        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email (Confirmed)</Label>
            <Input
              id="email"
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={loading || !password}
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Security Notice:</strong> Admin access requires password re-verification for security. 
            Your session will expire after 30 minutes of inactivity.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AdminPasswordVerify;
