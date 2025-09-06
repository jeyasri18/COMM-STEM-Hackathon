import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Heart } from 'lucide-react';
import { useClothingRatings } from '../hooks/useRatings';
import { supabase } from '../lib/supabase';
import RatingDisplay from './RatingDisplay';

export function Favorites({ favorites, onToggleFavorite }) {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFavoriteItems() {
      if (favorites.size === 0) {
        setFavoriteItems([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch clothing items that are in favorites
        const { data: clothingData, error } = await supabase
          .from('clothing')
          .select('*')
          .in('id', Array.from(favorites));

        if (error) {
          console.error('Error fetching favorite items:', error);
          return;
        }

        setFavoriteItems(clothingData || []);

        // Fetch user profiles for the items
        const userIds = [...new Set((clothingData || []).map(item => item.user_id))];
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('user_profiles')
            .select('user_id, display_name')
            .in('user_id', userIds);

          const profilesMap = {};
          (profilesData || []).forEach(profile => {
            profilesMap[profile.user_id] = profile.display_name || 'Unknown User';
          });
          setProfiles(profilesMap);
        }
      } catch (error) {
        console.error('Error fetching favorite items:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFavoriteItems();
  }, [favorites]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your favorites...</p>
          </div>
        </div>
      </div>
    );
  }

  if (favoriteItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl text-foreground mb-2">Your Favorites</h1>
          <p className="text-muted-foreground mb-8">Items you've loved will appear here</p>
          <Button 
            onClick={() => window.location.href = '#public'}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Discover Items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Your Favorites</h1>
        <p className="text-muted-foreground">Items you've loved ({favoriteItems.length})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favoriteItems.map(item => (
          <FavoriteItemCard 
            key={item.id} 
            item={item} 
            ownerName={profiles[item.user_id] || 'Unknown User'}
            onToggleFavorite={onToggleFavorite}
            isFavorited={favorites.has(item.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Component for individual favorite item
const FavoriteItemCard = ({ item, ownerName, onToggleFavorite, isFavorited }) => {
  const { stats: itemStats } = useClothingRatings(item?.id);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        {item.image_url && (
          <div className="mb-4 relative">
            <img 
              src={item.image_url} 
              alt={item.title} 
              className="w-full h-48 object-cover rounded-lg"
            />
            {/* Heart/Favorite Button */}
            <button
              onClick={() => onToggleFavorite(item.id)}
              className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all duration-200 hover:scale-110"
            >
              <Heart 
                className={`w-5 h-5 ${
                  isFavorited 
                    ? 'text-red-500 fill-current' 
                    : 'text-gray-400 hover:text-red-500'
                }`} 
              />
            </button>
          </div>
        )}
        
        <div className="mb-2">
          <h4 className="font-semibold text-lg text-foreground">{item.title || 'Untitled Item'}</h4>
          <p className="text-sm text-muted-foreground">by {ownerName}</p>
        </div>
        
        <p className="text-muted-foreground text-sm mb-3">{item.description || 'No description available'}</p>
        
        {/* Rating Display */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <RatingDisplay
            averageRating={itemStats?.average_rating || 0}
            totalRatings={itemStats?.total_ratings || 0}
            quality={itemStats?.quality}
            style={itemStats?.style}
            condition={itemStats?.condition}
            showDetails={true}
            size="sm"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-green-600">
            ${item.price_per_day || 0}/day
          </div>
          <div className="text-sm text-muted-foreground">
            {item.condition || 'Good condition'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
