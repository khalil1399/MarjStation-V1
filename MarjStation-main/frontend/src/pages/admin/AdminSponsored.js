import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from '../../hooks/use-toast';
import { sponsoredService } from '../../services/firebase/sponsoredService';
import { restaurantService } from '../../services/firebase/restaurantService';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Clock, 
  Eye, 
  MousePointer,
  ShoppingCart,
  Settings,
  ArrowUp,
  ArrowDown,
  Calendar,
  Store,
  TrendingUp,
  ToggleLeft,
  ToggleRight,
  Sparkles
} from 'lucide-react';

const AdminSponsored = () => {
  const [sponsorships, setSponsorships] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [settings, setSettings] = useState({ maxSponsoredSlots: 3, enableRotation: true, rotationInterval: 24 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // all, active, scheduled, expired

  const [formData, setFormData] = useState({
    restaurantId: '',
    restaurantName: '',
    priorityLevel: 'STANDARD',
    priority: 2,
    startDate: '',
    endDate: '',
    isActive: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Set up real-time listeners
      const unsubscribeSponsorships = sponsoredService.listenToSponsorships((data) => {
        setSponsorships(data.sort((a, b) => a.priority - b.priority));
      });

      const unsubscribeRestaurants = restaurantService.listenToRestaurants((data) => {
        setRestaurants(data);
      });

      // Load settings
      const settingsData = await sponsoredService.getSettings();
      setSettings(settingsData);

      setLoading(false);

      return () => {
        unsubscribeSponsorships();
        unsubscribeRestaurants();
      };
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const filteredSponsorships = useMemo(() => {
    if (viewMode === 'all') return sponsorships;
    return sponsorships.filter(s => {
      const status = sponsoredService.getSponsorshipStatus(s);
      return status.status === viewMode;
    });
  }, [sponsorships, viewMode]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: sponsorships.length,
      active: sponsorships.filter(s => {
        const start = new Date(s.startDate);
        const end = new Date(s.endDate);
        return s.isActive && start <= now && end >= now;
      }).length,
      scheduled: sponsorships.filter(s => {
        const start = new Date(s.startDate);
        return s.isActive && start > now;
      }).length,
      expired: sponsorships.filter(s => {
        const end = new Date(s.endDate);
        return end < now;
      }).length,
      totalImpressions: sponsorships.reduce((sum, s) => sum + (s.impressions || 0), 0),
      totalClicks: sponsorships.reduce((sum, s) => sum + (s.clicks || 0), 0),
      totalConversions: sponsorships.reduce((sum, s) => sum + (s.conversions || 0), 0)
    };
  }, [sponsorships]);

  const availableRestaurants = useMemo(() => {
    const sponsoredIds = sponsorships
      .filter(s => sponsoredService.getSponsorshipStatus(s).status !== 'expired')
      .map(s => s.restaurantId);
    return restaurants.filter(r => !sponsoredIds.includes(r.id) || editingSponsorship?.restaurantId === r.id);
  }, [restaurants, sponsorships, editingSponsorship]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'restaurantId') {
      const restaurant = restaurants.find(r => r.id === value);
      setFormData({
        ...formData,
        restaurantId: value,
        restaurantName: restaurant?.name || ''
      });
    } else if (name === 'priorityLevel') {
      const priorityMap = { PREMIUM: 1, STANDARD: 2, BASIC: 3 };
      setFormData({
        ...formData,
        priorityLevel: value,
        priority: priorityMap[value]
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const resetForm = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    setFormData({
      restaurantId: '',
      restaurantName: '',
      priorityLevel: 'STANDARD',
      priority: 2,
      startDate: tomorrow.toISOString().split('T')[0],
      endDate: nextMonth.toISOString().split('T')[0],
      isActive: true
    });
    setEditingSponsorship(null);
    setDialogOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.restaurantId) {
      toast({ title: 'Error', description: 'Please select a restaurant', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      if (editingSponsorship) {
        await sponsoredService.updateSponsorship(editingSponsorship.id, formData);
        toast({ title: 'Sponsorship updated successfully' });
      } else {
        await sponsoredService.createSponsorship(formData);
        toast({ title: 'Sponsorship created successfully' });
      }
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (sponsorship) => {
    setEditingSponsorship(sponsorship);
    setFormData({
      restaurantId: sponsorship.restaurantId,
      restaurantName: sponsorship.restaurantName,
      priorityLevel: sponsorship.priorityLevel || 'STANDARD',
      priority: sponsorship.priority,
      startDate: sponsorship.startDate.split('T')[0],
      endDate: sponsorship.endDate.split('T')[0],
      isActive: sponsorship.isActive
    });
    setDialogOpen(true);
  };

  const handleDelete = async (sponsorshipId) => {
    if (!window.confirm('Are you sure you want to delete this sponsorship?')) return;
    
    try {
      await sponsoredService.deleteSponsorship(sponsorshipId);
      toast({ title: 'Sponsorship deleted' });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (sponsorship) => {
    try {
      await sponsoredService.toggleSponsorshipStatus(sponsorship.id, !sponsorship.isActive);
      toast({ title: `Sponsorship ${sponsorship.isActive ? 'deactivated' : 'activated'}` });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleMovePriority = async (sponsorship, direction) => {
    const newPriority = direction === 'up' ? sponsorship.priority - 1 : sponsorship.priority + 1;
    if (newPriority < 1) return;

    try {
      // Find sponsorship with target priority and swap
      const targetSponsorship = sponsorships.find(s => s.priority === newPriority);
      if (targetSponsorship) {
        await sponsoredService.updateSponsorshipPriority(targetSponsorship.id, sponsorship.priority);
      }
      await sponsoredService.updateSponsorshipPriority(sponsorship.id, newPriority);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleSaveSettings = async () => {
    setSubmitting(true);
    try {
      await sponsoredService.updateSettings(settings);
      toast({ title: 'Settings saved' });
      setSettingsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priorityLevel) => {
    const config = {
      PREMIUM: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Star },
      STANDARD: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Sparkles },
      BASIC: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: Store }
    };
    const { color, icon: Icon } = config[priorityLevel] || config.STANDARD;
    return (
      <Badge className={`${color} border flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {priorityLevel}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="p-8" data-testid="admin-sponsored">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sponsored Restaurants</h1>
          <p className="text-gray-600 mt-1">Manage featured restaurant placements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSettingsDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700" data-testid="add-sponsorship-btn">
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsorship
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingSponsorship ? 'Edit Sponsorship' : 'Create Sponsorship'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="restaurantId">Restaurant *</Label>
                  <select
                    id="restaurantId"
                    name="restaurantId"
                    value={formData.restaurantId}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    data-testid="restaurant-select"
                  >
                    <option value="">Select restaurant</option>
                    {availableRestaurants.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="priorityLevel">Priority Level *</Label>
                  <select
                    id="priorityLevel"
                    name="priorityLevel"
                    value={formData.priorityLevel}
                    onChange={handleInputChange}
                    required
                    className="w-full border rounded-md px-3 py-2 text-sm"
                    data-testid="priority-select"
                  >
                    <option value="PREMIUM">Premium (Top Priority)</option>
                    <option value="STANDARD">Standard</option>
                    <option value="BASIC">Basic</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      required
                      data-testid="start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      required
                      data-testid="end-date"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Activate immediately when start date arrives</Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={submitting}
                    data-testid="submit-sponsorship-btn"
                  >
                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingSponsorship ? 'Update' : 'Create'} Sponsorship
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Star className="h-8 w-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <Sparkles className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Impressions</p>
              <p className="text-2xl font-bold">{stats.totalImpressions.toLocaleString()}</p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Clicks</p>
              <p className="text-2xl font-bold">{stats.totalClicks.toLocaleString()}</p>
            </div>
            <MousePointer className="h-8 w-8 text-indigo-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Conversions</p>
              <p className="text-2xl font-bold">{stats.totalConversions.toLocaleString()}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-teal-500" />
          </div>
        </Card>
      </div>

      {/* Current Settings Info */}
      <Alert className="mb-6 bg-orange-50 border-orange-200">
        <Settings className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <span className="font-medium">Current Settings:</span> Showing top {settings.maxSponsoredSlots} sponsored restaurants
          {settings.enableRotation && ` with rotation every ${settings.rotationInterval} hours`}
        </AlertDescription>
      </Alert>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'active', 'scheduled', 'expired'].map((mode) => (
          <Button
            key={mode}
            variant={viewMode === mode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode(mode)}
            className={viewMode === mode ? 'bg-orange-600 hover:bg-orange-700' : ''}
          >
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </Button>
        ))}
      </div>

      {/* Sponsorships List */}
      {filteredSponsorships.length === 0 ? (
        <Card className="p-12 text-center">
          <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Sponsorships Found</h3>
          <p className="text-gray-600 mb-4">
            {viewMode === 'all' 
              ? 'Create your first sponsored restaurant placement to get started.'
              : `No ${viewMode} sponsorships at the moment.`}
          </p>
          {viewMode === 'all' && (
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Sponsorship
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSponsorships.map((sponsorship, index) => {
            const status = sponsoredService.getSponsorshipStatus(sponsorship);
            const restaurant = restaurants.find(r => r.id === sponsorship.restaurantId);
            const ctr = sponsoredService.calculateCTR(sponsorship.impressions, sponsorship.clicks);
            const convRate = sponsoredService.calculateConversionRate(sponsorship.clicks, sponsorship.conversions);

            return (
              <Card key={sponsorship.id} className="p-5" data-testid={`sponsorship-${sponsorship.id}`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMovePriority(sponsorship, 'up')}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <span className="text-lg font-bold text-orange-600">#{sponsorship.priority}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleMovePriority(sponsorship, 'down')}
                        className="h-6 w-6 p-0"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {restaurant?.image ? (
                        <img src={restaurant.image} alt={restaurant?.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="h-10 w-10 text-gray-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">
                          {sponsorship.restaurantName || restaurant?.name || 'Unknown Restaurant'}
                        </h3>
                        <Badge className={status.color}>{status.label}</Badge>
                        {getPriorityBadge(sponsorship.priorityLevel)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(sponsorship.startDate)} - {formatDate(sponsorship.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-purple-600">
                          <Eye className="h-4 w-4" />
                          {(sponsorship.impressions || 0).toLocaleString()} views
                        </span>
                        <span className="flex items-center gap-1 text-indigo-600">
                          <MousePointer className="h-4 w-4" />
                          {(sponsorship.clicks || 0).toLocaleString()} clicks ({ctr}% CTR)
                        </span>
                        <span className="flex items-center gap-1 text-teal-600">
                          <TrendingUp className="h-4 w-4" />
                          {(sponsorship.conversions || 0).toLocaleString()} orders ({convRate}% conv.)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleStatus(sponsorship)}
                      data-testid={`toggle-${sponsorship.id}`}
                    >
                      {sponsorship.isActive ? (
                        <><ToggleRight className="h-4 w-4 mr-1 text-green-600" />Active</>
                      ) : (
                        <><ToggleLeft className="h-4 w-4 mr-1 text-gray-400" />Inactive</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(sponsorship)}
                      data-testid={`edit-${sponsorship.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(sponsorship.id)}
                      data-testid={`delete-${sponsorship.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Settings Dialog */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sponsorship Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="maxSlots">Maximum Sponsored Slots</Label>
              <Input
                id="maxSlots"
                type="number"
                min="1"
                max="10"
                value={settings.maxSponsoredSlots}
                onChange={(e) => setSettings({ ...settings, maxSponsoredSlots: parseInt(e.target.value) || 3 })}
              />
              <p className="text-sm text-gray-500 mt-1">
                Number of sponsored restaurants to display at the top
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="enableRotation"
                checked={settings.enableRotation}
                onChange={(e) => setSettings({ ...settings, enableRotation: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="enableRotation">Enable rotation for fair exposure</Label>
            </div>

            {settings.enableRotation && (
              <div>
                <Label htmlFor="rotationInterval">Rotation Interval (hours)</Label>
                <Input
                  id="rotationInterval"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.rotationInterval}
                  onChange={(e) => setSettings({ ...settings, rotationInterval: parseInt(e.target.value) || 24 })}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                onClick={handleSaveSettings}
                disabled={submitting}
              >
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
              <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSponsored;
