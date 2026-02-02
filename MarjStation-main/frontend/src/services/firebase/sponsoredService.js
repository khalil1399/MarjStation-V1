import { ref, set, get, update, remove, push, onValue, off } from 'firebase/database';
import { database } from '../../config/firebase';

export const sponsoredService = {
  // Priority levels
  PRIORITY_LEVELS: {
    PREMIUM: { value: 1, label: 'Premium', color: 'bg-yellow-500' },
    STANDARD: { value: 2, label: 'Standard', color: 'bg-blue-500' },
    BASIC: { value: 3, label: 'Basic', color: 'bg-gray-500' }
  },

  // Create sponsored placement
  async createSponsorship(sponsorshipData) {
    try {
      const sponsorshipsRef = ref(database, 'sponsoredRestaurants');
      const newSponsorshipRef = push(sponsorshipsRef);
      
      await set(newSponsorshipRef, {
        ...sponsorshipData,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Sponsorship created with ID:', newSponsorshipRef.key);
      return { success: true, id: newSponsorshipRef.key };
    } catch (error) {
      console.error('❌ Error creating sponsorship:', error);
      throw error;
    }
  },

  // Get all sponsorships
  async getAllSponsorships() {
    try {
      const sponsorshipsRef = ref(database, 'sponsoredRestaurants');
      const snapshot = await get(sponsorshipsRef);
      
      if (snapshot.exists()) {
        const sponsorships = [];
        snapshot.forEach((childSnapshot) => {
          sponsorships.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        return sponsorships;
      }
      return [];
    } catch (error) {
      console.error('Error getting sponsorships:', error);
      throw error;
    }
  },

  // Listen to all sponsorships in real-time
  listenToSponsorships(callback) {
    const sponsorshipsRef = ref(database, 'sponsoredRestaurants');
    const listener = onValue(sponsorshipsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sponsorships = [];
        snapshot.forEach((childSnapshot) => {
          sponsorships.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        callback(sponsorships);
      } else {
        callback([]);
      }
    });
    return () => off(sponsorshipsRef, 'value', listener);
  },

  // Get active sponsorships (within date range and active status)
  async getActiveSponsorships() {
    try {
      const allSponsorships = await this.getAllSponsorships();
      const now = new Date();
      
      return allSponsorships
        .filter(s => {
          const startDate = new Date(s.startDate);
          const endDate = new Date(s.endDate);
          return s.isActive && startDate <= now && endDate >= now;
        })
        .sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Error getting active sponsorships:', error);
      throw error;
    }
  },

  // Listen to active sponsorships in real-time
  listenToActiveSponsorships(callback) {
    const sponsorshipsRef = ref(database, 'sponsoredRestaurants');
    const listener = onValue(sponsorshipsRef, (snapshot) => {
      const now = new Date();
      
      if (snapshot.exists()) {
        const sponsorships = [];
        snapshot.forEach((childSnapshot) => {
          const s = { id: childSnapshot.key, ...childSnapshot.val() };
          const startDate = new Date(s.startDate);
          const endDate = new Date(s.endDate);
          
          if (s.isActive && startDate <= now && endDate >= now) {
            sponsorships.push(s);
          }
        });
        // Sort by priority (lower number = higher priority)
        callback(sponsorships.sort((a, b) => a.priority - b.priority));
      } else {
        callback([]);
      }
    });
    return () => off(sponsorshipsRef, 'value', listener);
  },

  // Update sponsorship
  async updateSponsorship(sponsorshipId, updateData) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      await update(sponsorshipRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Sponsorship updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating sponsorship:', error);
      throw error;
    }
  },

  // Update sponsorship priority/order
  async updateSponsorshipPriority(sponsorshipId, newPriority) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      await update(sponsorshipRef, {
        priority: newPriority,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating sponsorship priority:', error);
      throw error;
    }
  },

  // Toggle sponsorship active status
  async toggleSponsorshipStatus(sponsorshipId, isActive) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      await update(sponsorshipRef, {
        isActive,
        updatedAt: new Date().toISOString()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error toggling sponsorship status:', error);
      throw error;
    }
  },

  // Delete sponsorship
  async deleteSponsorship(sponsorshipId) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      await remove(sponsorshipRef);
      return { success: true };
    } catch (error) {
      console.error('Error deleting sponsorship:', error);
      throw error;
    }
  },

  // Track impression (when sponsored restaurant is displayed)
  async trackImpression(sponsorshipId) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      const snapshot = await get(sponsorshipRef);
      
      if (snapshot.exists()) {
        const current = snapshot.val();
        await update(sponsorshipRef, {
          impressions: (current.impressions || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  },

  // Track click (when user clicks on sponsored restaurant)
  async trackClick(sponsorshipId) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      const snapshot = await get(sponsorshipRef);
      
      if (snapshot.exists()) {
        const current = snapshot.val();
        await update(sponsorshipRef, {
          clicks: (current.clicks || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  },

  // Track conversion (when user orders from sponsored restaurant)
  async trackConversion(sponsorshipId) {
    try {
      const sponsorshipRef = ref(database, `sponsoredRestaurants/${sponsorshipId}`);
      const snapshot = await get(sponsorshipRef);
      
      if (snapshot.exists()) {
        const current = snapshot.val();
        await update(sponsorshipRef, {
          conversions: (current.conversions || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error tracking conversion:', error);
    }
  },

  // Get sponsorship status
  getSponsorshipStatus(sponsorship) {
    const now = new Date();
    const startDate = new Date(sponsorship.startDate);
    const endDate = new Date(sponsorship.endDate);
    
    if (!sponsorship.isActive) {
      return { status: 'inactive', label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
    }
    if (now < startDate) {
      return { status: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-800' };
    }
    if (now > endDate) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' };
    }
    return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
  },

  // Calculate CTR (Click-Through Rate)
  calculateCTR(impressions, clicks) {
    if (!impressions || impressions === 0) return 0;
    return ((clicks / impressions) * 100).toFixed(2);
  },

  // Calculate Conversion Rate
  calculateConversionRate(clicks, conversions) {
    if (!clicks || clicks === 0) return 0;
    return ((conversions / clicks) * 100).toFixed(2);
  },

  // Get sponsorship settings
  async getSettings() {
    try {
      const settingsRef = ref(database, 'sponsorshipSettings');
      const snapshot = await get(settingsRef);
      
      if (snapshot.exists()) {
        return snapshot.val();
      }
      // Default settings
      return {
        maxSponsoredSlots: 3,
        enableRotation: true,
        rotationInterval: 24 // hours
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        maxSponsoredSlots: 3,
        enableRotation: true,
        rotationInterval: 24
      };
    }
  },

  // Update sponsorship settings
  async updateSettings(settings) {
    try {
      const settingsRef = ref(database, 'sponsorshipSettings');
      await set(settingsRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }
};
