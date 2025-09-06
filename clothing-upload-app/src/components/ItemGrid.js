import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { api } from '../lib/api';

export function ItemGrid({ onItemMessage, onProfileView }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sample data as fallback
  const sampleItems = [
    {
      id: 1,
      title: "Vintage Denim Jacket",
      description: "Classic blue denim jacket in excellent condition",
      price: "$25",
      image: "👕",
      owner: "Sarah M.",
      category: "Outerwear",
      condition: "Excellent"
    },
    {
      id: 2,
      title: "Summer Dress",
      description: "Light floral summer dress perfect for warm weather",
      price: "$18",
      image: "👗",
      owner: "Emma L.",
      category: "Dresses",
      condition: "Good"
    },
    {
      id: 3,
      title: "Leather Boots",
      description: "Brown leather ankle boots, size 8",
      price: "$35",
      image: "👢",
      owner: "Mike R.",
      category: "Shoes",
      condition: "Very Good"
    },
    {
      id: 4,
      title: "Knit Sweater",
      description: "Cozy cream-colored knit sweater",
      price: "$22",
      image: "🧥",
      owner: "Lisa K.",
      category: "Tops",
      condition: "Excellent"
    },
    {
      id: 5,
      title: "Designer Handbag",
      description: "Black leather handbag with gold hardware",
      price: "$45",
      image: "👜",
      owner: "Anna T.",
      category: "Accessories",
      condition: "Good"
    },
    {
      id: 6,
      title: "Casual Jeans",
      description: "Dark wash skinny jeans, size 6",
      price: "$20",
      image: "👖",
      owner: "David P.",
      category: "Bottoms",
      condition: "Very Good"
    }
  ];

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await api.getListings();
        if (response.data && response.data.length > 0) {
          setItems(response.data);
        } else {
          // Use sample data if no items from backend
          setItems(sampleItems);
        }
      } catch (error) {
        console.error('Error fetching items:', error);
        setError('Failed to load items');
        // Use sample data as fallback
        setItems(sampleItems);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Loading items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Discover Items</h1>
        <p className="text-muted-foreground">Find amazing pieces from your community</p>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="text-4xl text-center mb-2">{item.image || '👕'}</div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground line-clamp-1">{item.title}</h3>
                <Badge variant="secondary">{item.privacy || 'public'}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline">{item.privacy || 'public'}</Badge>
                <span className="text-sm text-muted-foreground">
                  by {item.owner_name || item.owner || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ID: {item.listing_id}</span>
                <button 
                  onClick={() => onProfileView(item.owner_name || item.owner)}
                  className="text-sm text-primary hover:underline"
                >
                  View Profile
                </button>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button 
                className="w-full"
                onClick={() => onItemMessage(item.id)}
              >
                Message Owner
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
