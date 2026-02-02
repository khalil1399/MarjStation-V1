import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { useNotifications } from '../context/NotificationContext';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Monitor, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Loader2,
  Settings,
  ShoppingBag,
  UserCheck,
  Package,
  Sparkles
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

const NotificationSettings = ({ userRole = 'customer' }) => {
  const {
    permissionStatus,
    isPushEnabled,
    isSupported,
    preferences,
    requestNotificationPermission,
    disableNotifications,
    updatePreferences
  } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [localPreferences, setLocalPreferences] = useState({
    enabled: true,
    orderUpdates: true,
    promotions: false,
    sellerUpdates: true,
    adminAlerts: true
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const result = await requestNotificationPermission();
      if (!result.success) {
        toast({
          title: 'Error',
          description: result.error || 'Failed to enable notifications',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDisableNotifications = async () => {
    setLoading(true);
    try {
      await disableNotifications();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (key, value) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    
    try {
      await updatePreferences(newPreferences);
      toast({ title: 'Preferences updated' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = () => {
    if (!isSupported) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <AlertCircle className="h-3 w-3 mr-1" />
          Not Supported
        </Badge>
      );
    }
    if (permissionStatus === 'denied') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="h-3 w-3 mr-1" />
          Blocked
        </Badge>
      );
    }
    if (isPushEnabled) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Enabled
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        <BellOff className="h-3 w-3 mr-1" />
        Disabled
      </Badge>
    );
  };

  const preferenceOptions = [
    {
      key: 'orderUpdates',
      label: 'Order Updates',
      description: 'Notifications about order status changes',
      icon: ShoppingBag,
      roles: ['customer', 'seller', 'admin']
    },
    {
      key: 'sellerUpdates',
      label: 'Seller Updates',
      description: 'New orders and approval status updates',
      icon: UserCheck,
      roles: ['seller']
    },
    {
      key: 'adminAlerts',
      label: 'Admin Alerts',
      description: 'New seller requests, orders, and product approvals',
      icon: Package,
      roles: ['admin']
    },
    {
      key: 'promotions',
      label: 'Promotions & Offers',
      description: 'Special deals and promotional notifications',
      icon: Sparkles,
      roles: ['customer', 'seller', 'admin']
    }
  ];

  const filteredOptions = preferenceOptions.filter(opt => opt.roles.includes(userRole));

  return (
    <Card className="p-6" data-testid="notification-settings">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Bell className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Push Notifications</h3>
            <p className="text-sm text-gray-500">Manage your notification preferences</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Browser Not Supported */}
      {!isSupported && (
        <Alert className="mb-4 bg-gray-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge.
          </AlertDescription>
        </Alert>
      )}

      {/* Permission Denied */}
      {isSupported && permissionStatus === 'denied' && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Notifications are blocked. To enable them, click the lock icon in your browser address bar and allow notifications for this site.
          </AlertDescription>
        </Alert>
      )}

      {/* Enable/Disable Button */}
      {isSupported && permissionStatus !== 'denied' && (
        <div className="mb-6">
          {isPushEnabled ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-green-600" />
                  <Smartphone className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-800">Notifications Active</p>
                  <p className="text-sm text-green-600">You will receive push notifications on this device</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleDisableNotifications}
                disabled={loading}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <BellOff className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Enable Push Notifications</p>
                  <p className="text-sm text-orange-600">Get real-time updates on orders and more</p>
                </div>
              </div>
              <Button
                onClick={handleEnableNotifications}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                Enable
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Notification Preferences */}
      {isPushEnabled && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Notification Preferences
          </h4>
          
          <div className="space-y-3">
            {filteredOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <div>
                      <Label className="font-medium">{option.label}</Label>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences[option.key]}
                      onChange={(e) => handlePreferenceChange(option.key, e.target.checked)}
                      className="sr-only peer"
                      data-testid={`pref-${option.key}`}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Device Info */}
      {isPushEnabled && (
        <div className="mt-6 pt-4 border-t">
          <p className="text-xs text-gray-400">
            Notifications will be sent to this device. Sign in on other devices to receive notifications there as well.
          </p>
        </div>
      )}
    </Card>
  );
};

export default NotificationSettings;
