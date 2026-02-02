import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { testFirebaseConnection, checkFirebaseSetup } from '../utils/firebaseTest';
import { categoryService } from '../services/firebase/categoryService';
import { restaurantService } from '../services/firebase/restaurantService';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const FirebaseDebugTool = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults = {
      connection: null,
      categories: null,
      restaurants: null,
      writeTest: null
    };

    // Test connection
    testResults.connection = await testFirebaseConnection();

    // Test reading categories
    try {
      const cats = await categoryService.getAllCategories();
      testResults.categories = {
        success: true,
        count: cats.length,
        data: cats
      };
    } catch (error) {
      testResults.categories = {
        success: false,
        error: error.message
      };
    }

    // Test reading restaurants
    try {
      const rests = await restaurantService.getAllRestaurants();
      testResults.restaurants = {
        success: true,
        count: rests.length,
        data: rests
      };
    } catch (error) {
      testResults.restaurants = {
        success: false,
        error: error.message
      };
    }

    // Test writing a category
    try {
      const testCat = {
        name: `Test Category ${Date.now()}`,
        icon: '🧪',
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
      };
      const result = await categoryService.createCategory(testCat);
      testResults.writeTest = {
        success: true,
        id: result.id
      };
    } catch (error) {
      testResults.writeTest = {
        success: false,
        error: error.message
      };
    }

    setResults(testResults);
    setTesting(false);
  };

  const seedMinimalData = async () => {
    setSeeding(true);
    try {
      // Add one category
      const catResult = await categoryService.createCategory({
        name: 'Fast Food',
        icon: '🍔',
        image: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400'
      });

      // Add one restaurant
      await restaurantService.createRestaurant({
        name: 'Quick Test Restaurant',
        description: 'Testing persistence',
        category: catResult.id,
        rating: 4.5,
        deliveryTime: '25-35 min',
        minOrder: 15,
        deliveryFee: 5,
        image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600',
        logo: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=200',
        isOpen: true
      });

      alert('✅ Minimal data seeded successfully! Refresh to see.');
      window.location.reload();
    } catch (error) {
      alert('❌ Failed to seed: ' + error.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Firebase Debug Tool</h1>

      <div className="flex gap-4 mb-6">
        <Button onClick={runTests} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {testing ? 'Testing...' : 'Run Full Diagnostics'}
        </Button>
        <Button onClick={seedMinimalData} disabled={seeding} variant="secondary">
          {seeding ? 'Seeding...' : 'Seed Minimal Data'}
        </Button>
        <Button onClick={() => checkFirebaseSetup()} variant="outline">
          Check Config
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {/* Connection Test */}
          <Card className="p-4">
            <h3 className="font-bold mb-2">Connection Test</h3>
            {results.connection.canWrite ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div>✅ Database URL: {results.connection.databaseURL}</div>
                  <div>✅ Can Read: {results.connection.canRead ? 'Yes' : 'No'}</div>
                  <div>✅ Can Write: {results.connection.canWrite ? 'Yes' : 'No'}</div>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription>
                  <div>❌ Database issues detected</div>
                  {results.connection.errors.map((err, i) => (
                    <div key={i} className="text-sm">• {err}</div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Categories Test */}
          <Card className="p-4">
            <h3 className="font-bold mb-2">Categories</h3>
            {results.categories.success ? (
              <div>
                <div className="text-green-600">✅ Found {results.categories.count} categories</div>
                {results.categories.count === 0 && (
                  <div className="text-orange-600 text-sm mt-2">
                    ⚠️ No categories found. Click "Seed Minimal Data" to add one.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">❌ Error: {results.categories.error}</div>
            )}
          </Card>

          {/* Restaurants Test */}
          <Card className="p-4">
            <h3 className="font-bold mb-2">Restaurants</h3>
            {results.restaurants.success ? (
              <div className="text-green-600">✅ Found {results.restaurants.count} restaurants</div>
            ) : (
              <div className="text-red-600">❌ Error: {results.restaurants.error}</div>
            )}
          </Card>

          {/* Write Test */}
          <Card className="p-4">
            <h3 className="font-bold mb-2">Write Test</h3>
            {results.writeTest.success ? (
              <div className="text-green-600">
                ✅ Successfully wrote test category with ID: {results.writeTest.id}
                <div className="text-sm mt-1">This proves writes are working!</div>
              </div>
            ) : (
              <div className="text-red-600">
                ❌ Write failed: {results.writeTest.error}
                <div className="text-sm mt-1">Check Firebase Console rules!</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {!results && (
        <Card className="p-8 text-center text-gray-500">
          Click "Run Full Diagnostics" to test Firebase connection and data access
        </Card>
      )}
    </div>
  );
};

export default FirebaseDebugTool;
