import { useState } from 'react';
import { ItemCard } from './ItemCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';
import { Badge } from './ui/badge';
import exampleImage1 from 'figma:asset/be00ac865822652c747a80c6323ce65e5db39e42.png';
import exampleImage2 from 'figma:asset/923aa1a325a40aca42b8379291b1146ee87930fd.png';

interface ItemGridProps {
  onItemMessage: (id: string) => void;
  onProfileView: (id: string) => void;
}

export function ItemGrid({ onItemMessage, onProfileView }: ItemGridProps) {
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  // Mock data incorporating the provided images
  const items = [
    {
      id: '1',
      image: exampleImage1,
      title: 'Vintage Adidas Jacket',
      description: 'Perfect for a matcha date or casual outing! Super cozy and stylish.',
      price: 15,
      isFree: false,
      likes: 24,
      owner: { name: 'Emma', rating: 4.8 },
      size: 'M',
      condition: 'Like New',
      category: 'jackets'
    },
    {
      id: '2',
      image: exampleImage2,
      title: 'Black Platform Boots',
      description: 'Statement boots that elevate any outfit. Perfect for concerts or nights out!',
      price: 22,
      isFree: false,
      likes: 35,
      owner: { name: 'Maya', rating: 4.9 },
      size: '8',
      condition: 'Like New',
      category: 'shoes'
    },
    {
      id: '3',
      image: exampleImage1,
      title: 'Cozy Grey Jacket',
      description: 'Another beautiful Adidas piece! Perfect for layering in cooler weather.',
      isFree: true,
      likes: 18,
      owner: { name: 'Sophie', rating: 4.7 },
      size: 'S',
      condition: 'Good',
      category: 'jackets'
    },
    {
      id: '4',
      image: exampleImage2,
      title: 'Edgy Black Boots',
      description: 'Make a statement with these bold platform boots. Great for festivals!',
      price: 20,
      isFree: false,
      likes: 42,
      owner: { name: 'Alex', rating: 4.6 },
      size: '7.5',
      condition: 'Excellent',
      category: 'shoes'
    },
    {
      id: '5',
      image: exampleImage1,
      title: 'Vintage Sports Jacket',
      description: 'Classic Adidas style that never goes out of fashion. Super versatile!',
      isFree: true,
      likes: 15,
      owner: { name: 'Jordan', rating: 4.5 },
      size: 'L',
      condition: 'Good',
      category: 'jackets'
    },
    {
      id: '6',
      image: exampleImage2,
      title: 'Statement Platform Boots',
      description: 'Perfect for adding height and edge to any look. Festival ready!',
      price: 18,
      isFree: false,
      likes: 28,
      owner: { name: 'Riley', rating: 4.8 },
      size: '9',
      condition: 'Like New',
      category: 'shoes'
    }
  ];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSize = sizeFilter === 'all' || item.size === sizeFilter;
    const matchesPrice = priceFilter === 'all' || 
                        (priceFilter === 'free' && item.isFree) ||
                        (priceFilter === 'paid' && !item.isFree);
    
    return matchesSearch && matchesCategory && matchesSize && matchesPrice;
  });

  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newLiked = new Set(prev);
      if (newLiked.has(id)) {
        newLiked.delete(id);
      } else {
        newLiked.add(id);
      }
      return newLiked;
    });
  };

  const activeFilters = [
    categoryFilter !== 'all' && categoryFilter,
    sizeFilter !== 'all' && `Size ${sizeFilter}`,
    priceFilter !== 'all' && priceFilter
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl text-foreground mb-2">Something new for you</h1>
        <p className="text-muted-foreground">Discover amazing pieces from your community</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search for items, styles, or occasions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-0"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-input-background border-0">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="jackets">Jackets</SelectItem>
                <SelectItem value="dresses">Dresses</SelectItem>
                <SelectItem value="tops">Tops</SelectItem>
                <SelectItem value="sweaters">Sweaters</SelectItem>
                <SelectItem value="sets">Sets</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sizeFilter} onValueChange={setSizeFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-input-background border-0">
                <SelectValue placeholder="Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sizes</SelectItem>
                <SelectItem value="XS">XS</SelectItem>
                <SelectItem value="S">S</SelectItem>
                <SelectItem value="M">M</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="XL">XL</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full sm:w-32 bg-input-background border-0">
                <SelectValue placeholder="Price" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="bg-input-background border-0">
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Filters:</span>
            {activeFilters.map((filter, index) => (
              <Badge key={index} variant="outline" className="bg-accent text-accent-foreground border-accent">
                {filter}
              </Badge>
            ))}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => {
                setCategoryFilter('all');
                setSizeFilter('all');
                setPriceFilter('all');
              }}
            >
              Clear all
            </Button>
          </div>
        )}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <ItemCard
            key={item.id}
            id={item.id}
            image={item.image}
            title={item.title}
            description={item.description}
            price={item.price}
            isFree={item.isFree}
            isLiked={likedItems.has(item.id)}
            likes={item.likes + (likedItems.has(item.id) ? 1 : 0)}
            owner={item.owner}
            size={item.size}
            condition={item.condition}
            onLike={handleLike}
            onMessage={onItemMessage}
            onViewProfile={onProfileView}
          />
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground/60 mb-4">
            <Filter className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg text-muted-foreground mb-2">No items found</h3>
          <p className="text-muted-foreground/80">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
}