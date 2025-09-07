import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { api } from '../lib/api';
import { getCurrentUser, supabase } from '../lib/supabase';

export function AddItemSection({ onItemAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price_per_day: '',
    privacy: 'public'
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Get current user
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Please sign in to add items');
      }

      // Create the listing data - backend expects integer owner_id
      // We need to create or get a backend user first
      let backendUserId;
      
      // Convert UUID to a consistent integer for backend
      const uuidToInt = (uuid) => {
        // Simple hash function to convert UUID to integer
        let hash = 0;
        for (let i = 0; i < uuid.length; i++) {
          const char = uuid.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % 1000000; // Keep it reasonable
      };
      
      const userIdInt = uuidToInt(user.id);
      
      try {
        // Try to get existing backend user
        const userResponse = await api.getUser(userIdInt);
        backendUserId = userResponse.data.user_id;
      } catch (error) {
        // Create new backend user if doesn't exist
        const createResponse = await api.createUser({
          name: user.user_metadata?.full_name || user.email,
          circle: 'USYD' // Default circle
        });
        backendUserId = createResponse.data.user_id;
      }

      const listingData = {
        title: formData.title,
        description: formData.description,
        privacy: formData.privacy,
        owner_id: backendUserId
      };

      // Add the listing to the backend
      const response = await api.addListing(listingData);
      
      if (response.data) {
        // Also add to Supabase so it shows up in the main dashboard
        let imageUrl = null;
        
        // If image is provided, upload it to Supabase storage
        if (image) {
          try {
            const fileExt = image.name.split('.').pop();
            const fileName = `listing_${response.data.listing_id}.${fileExt}`;
            
            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('clothing-images')
              .upload(fileName, image);
            
            if (uploadError) {
              console.error('Image upload error:', uploadError);
              // Don't fail the whole operation if image upload fails
            } else {
              // Get public URL
              const { data: publicUrlData } = supabase.storage
                .from('clothing-images')
                .getPublicUrl(fileName);
              
              imageUrl = publicUrlData.publicUrl;
              console.log('Image uploaded successfully:', imageUrl);
            }
          } catch (imageError) {
            console.error('Image upload failed:', imageError);
            // Don't fail the whole operation
          }
        }
        
        // Add to Supabase clothing table so it appears in the main dashboard
        try {
          const { data: supabaseItem, error: supabaseError } = await supabase
            .from('clothing')
            .insert({
              title: formData.title,
              description: formData.description,
              price_per_day: parseFloat(formData.price_per_day) || 0,
              user_id: user.id,
              uploader_name: user.user_metadata?.full_name || user.email,
              visibility: formData.privacy === 'public' ? 'public' : 'private',
              image_url: imageUrl
            })
            .select()
            .single();
          
          if (supabaseError) {
            console.error('Failed to add to Supabase:', supabaseError);
          } else {
            console.log('Successfully added to Supabase:', supabaseItem);
          }
        } catch (supabaseError) {
          console.error('Supabase insertion failed:', supabaseError);
        }
        
        setSuccess('Item added successfully!');
        setFormData({
          title: '',
          description: '',
          price_per_day: '',
          privacy: 'public'
        });
        setImage(null);
        setImagePreview(null);
        
        // Call the callback to refresh the UI
        if (onItemAdded) {
          onItemAdded();
        }
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setError(error.message || 'Failed to add item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold text-foreground">Add New Item</h1>
          <p className="text-muted-foreground">Share an item from your wardrobe with the community</p>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Item Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g., Vintage Denim Jacket"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Describe the item, its condition, and any special features..."
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="price_per_day">Price per Day ($)</Label>
              <Input
                id="price_per_day"
                type="number"
                step="0.01"
                min="0"
                value={formData.price_per_day}
                onChange={(e) => handleChange('price_per_day', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Item Image</Label>
              <div className="relative">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-black hover:file:bg-primary/80 text-black"
                  style={{ color: 'black !important' }}
                />
                <style jsx>{`
                  input[type="file"] {
                    color: black !important;
                  }
                  input[type="file"]::file-selector-button {
                    color: black !important;
                  }
                `}</style>
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacy</Label>
              <select
                id="privacy"
                value={formData.privacy}
                onChange={(e) => handleChange('privacy', e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="public">Public - Everyone can see</option>
                <option value="circle">Circle - Only your community</option>
              </select>
            </div>
            
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Adding Item...' : 'Add Item'}
              </Button>
              <Button type="button" variant="outline" className="flex-1" disabled={loading}>
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
