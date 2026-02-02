import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/firebase/userService';
import { sellerRequestService } from '../services/firebase/sellerRequestService';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from '../hooks/use-toast';
import { User, Mail, Phone, MapPin, Store, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import NotificationSettings from '../components/NotificationSettings';

const Profile = () => {
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [sellerRequest, setSellerRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [sellerRequestForm, setSellerRequestForm] = useState({
    businessName: '',
    businessDescription: '',
    businessAddress: '',
    businessPhone: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadUserProfile();
      loadSellerRequest();
    }
  }, [currentUser]);

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile(currentUser.uid);
      if (profile) {
        setUserProfile(profile);
        setFormData({
          name: profile.name || '',
          phone: profile.phone || '',
          address: profile.address || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSellerRequest = () => {
    // Set up real-time listener for seller request
    const unsubscribe = sellerRequestService.listenToUserSellerRequest(
      currentUser.uid,
      (request) => {
        setSellerRequest(request);
      }
    );
    return unsubscribe;
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      await userService.updateUserProfile(currentUser.uid, formData);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
      });
      setEditing(false);
      loadUserProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleSellerRequestSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await sellerRequestService.createSellerRequest({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userProfile?.name || currentUser.email,
        ...sellerRequestForm
      });

      toast({
        title: 'Request submitted!',
        description: 'Your seller account request has been submitted for review',
      });
      
      setRequestDialogOpen(false);
      setSellerRequestForm({
        businessName: '',
        businessDescription: '',
        businessAddress: '',
        businessPhone: ''
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const getSellerStatusBadge = () => {
    if (userProfile?.isSeller) {
      return (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Seller Account Active</strong>
                <p className="text-sm mt-1">Manage your products in the Seller Panel</p>
              </div>
              <Button
                onClick={() => window.location.href = '/seller'}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Store className="h-4 w-4 mr-2" />
                Open Seller Panel
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (sellerRequest) {
      if (sellerRequest.status === 'pending') {
        return (
          <Alert className="bg-blue-50 border-blue-200">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Request Pending</strong> - Your seller account request is under review
            </AlertDescription>
          </Alert>
        );
      }
      
      if (sellerRequest.status === 'rejected') {
        return (
          <Alert className="bg-red-50 border-red-200">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Request Rejected</strong> - {sellerRequest.rejectionReason || 'Please contact support for details'}
            </AlertDescription>
          </Alert>
        );
      }
    }

    return null;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Please sign in to view your profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="space-y-6">
          {/* Seller Status */}
          {getSellerStatusBadge()}

          {/* Seller Request Button */}
          {!userProfile?.isSeller && !sellerRequest && (
            <Card className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Store className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Become a Seller
                    </h3>
                    <p className="text-gray-700 text-sm mb-3">
                      Start selling your products on our platform. Request a seller account to get started!
                    </p>
                    <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-orange-600 hover:bg-orange-700">
                          <Store className="h-4 w-4 mr-2" />
                          Request Seller Account
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Request Seller Account</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSellerRequestSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="businessName">Business Name *</Label>
                            <Input
                              id="businessName"
                              value={sellerRequestForm.businessName}
                              onChange={(e) => setSellerRequestForm({
                                ...sellerRequestForm,
                                businessName: e.target.value
                              })}
                              required
                              placeholder="Your restaurant or business name"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="businessDescription">Business Description *</Label>
                            <Textarea
                              id="businessDescription"
                              value={sellerRequestForm.businessDescription}
                              onChange={(e) => setSellerRequestForm({
                                ...sellerRequestForm,
                                businessDescription: e.target.value
                              })}
                              required
                              rows={3}
                              placeholder="Describe your business and what you'll be selling..."
                            />
                          </div>

                          <div>
                            <Label htmlFor="businessAddress">Business Address *</Label>
                            <Textarea
                              id="businessAddress"
                              value={sellerRequestForm.businessAddress}
                              onChange={(e) => setSellerRequestForm({
                                ...sellerRequestForm,
                                businessAddress: e.target.value
                              })}
                              required
                              rows={2}
                              placeholder="Full business address"
                            />
                          </div>

                          <div>
                            <Label htmlFor="businessPhone">Business Phone *</Label>
                            <Input
                              id="businessPhone"
                              type="tel"
                              value={sellerRequestForm.businessPhone}
                              onChange={(e) => setSellerRequestForm({
                                ...sellerRequestForm,
                                businessPhone: e.target.value
                              })}
                              required
                              placeholder="+1234567890"
                            />
                          </div>

                          <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> Your request will be reviewed by our admin team. 
                              You'll be notified once your seller account is approved.
                            </p>
                          </div>

                          <div className="flex space-x-3">
                            <Button
                              type="submit"
                              className="flex-1 bg-orange-600 hover:bg-orange-700"
                            >
                              Submit Request
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setRequestDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Profile Information Card */}
          <Card className="p-8">
          <div className="flex items-center space-x-6 mb-8">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl bg-orange-100 text-orange-600">
                {currentUser.email?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome Back!</h2>
              <p className="text-gray-600">{currentUser.email}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!editing && (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <Label className="text-sm text-gray-600">Email</Label>
                    <p className="font-medium">{currentUser.email}</p>
                  </div>
                </div>

                {editing ? (
                  <>
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-400 mt-2" />
                      <div className="flex-1">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-2" />
                      <div className="flex-1">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-2" />
                      <div className="flex-1">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={handleSave}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <Label className="text-sm text-gray-600">Full Name</Label>
                        <p className="font-medium">{userProfile?.name || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <Label className="text-sm text-gray-600">Phone Number</Label>
                        <p className="font-medium">{userProfile?.phone || 'Not set'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div className="flex-1">
                        <Label className="text-sm text-gray-600">Address</Label>
                        <p className="font-medium">{userProfile?.address || 'Not set'}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          </Card>

          {/* Notification Settings */}
          <div className="mt-6">
            <NotificationSettings 
              userRole={userProfile?.isSeller ? 'seller' : userProfile?.role === 'admin' ? 'admin' : 'customer'} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
