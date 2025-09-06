import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Upload, X, Camera, DollarSign, Heart } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface AddItemSectionProps {
  onItemAdded: () => void;
}

export function AddItemSection({ onItemAdded }: AddItemSectionProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    price: '',
    isFree: false,
    visibility: 'public',
    tags: ''
  });
  
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (files: FileList | null) => {
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - selectedImages.length).map(file => 
        URL.createObjectURL(file)
      );
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally upload to your backend
    console.log('Form submitted:', formData, selectedImages);
    onItemAdded();
  };

  const isFormValid = formData.title && formData.description && formData.category && 
                     formData.size && formData.condition && selectedImages.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl text-black mb-2">Share Your Style</h1>
        <p className="text-gray-600">List an item from your wardrobe for others to borrow or rent</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver 
                  ? 'border-lime-400 bg-lime-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleImageUpload(e.dataTransfer.files);
              }}
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Drag and drop photos here, or</p>
              <Button type="button" variant="outline" onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'image/*';
                input.onchange = (e) => handleImageUpload((e.target as HTMLInputElement).files);
                input.click();
              }}>
                Choose Files
              </Button>
              <p className="text-sm text-gray-500 mt-2">Up to 5 photos, max 10MB each</p>
            </div>

            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <ImageWithFallback 
                      src={image}
                      alt={`Upload ${index + 1}`}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    {index === 0 && (
                      <Badge className="absolute bottom-2 left-2 bg-lime-400 text-black">
                        Cover
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Item Details */}
        <Card>
          <CardHeader>
            <CardTitle>Item Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">Title *</label>
              <Input
                placeholder="e.g. Vintage Denim Jacket"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="bg-gray-50 border-0"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Description *</label>
              <Textarea
                placeholder="Describe your item, its style, fit, and any special details..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="bg-gray-50 border-0 min-h-24"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className="bg-gray-50 border-0">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tops">Tops</SelectItem>
                    <SelectItem value="bottoms">Bottoms</SelectItem>
                    <SelectItem value="dresses">Dresses</SelectItem>
                    <SelectItem value="jackets">Jackets & Coats</SelectItem>
                    <SelectItem value="shoes">Shoes</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Size *</label>
                <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                  <SelectTrigger className="bg-gray-50 border-0">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="XS">XS</SelectItem>
                    <SelectItem value="S">S</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="XL">XL</SelectItem>
                    <SelectItem value="XXL">XXL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2">Condition *</label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger className="bg-gray-50 border-0">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New with tags</SelectItem>
                    <SelectItem value="like-new">Like New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">Tags (optional)</label>
              <Input
                placeholder="e.g. vintage, bohemian, party, casual"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="bg-gray-50 border-0"
              />
              <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Availability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing & Availability
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-lime-600" />
                <div>
                  <p className="text-black">Free lending</p>
                  <p className="text-sm text-gray-600">Share the love, no charge</p>
                </div>
              </div>
              <Switch
                checked={formData.isFree}
                onCheckedChange={(checked) => handleInputChange('isFree', checked)}
              />
            </div>

            {!formData.isFree && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">Daily rental price ($)</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="bg-gray-50 border-0"
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Suggested: $10-30 per day for most items</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-2">Visibility</label>
              <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
                <SelectTrigger className="bg-gray-50 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can see</SelectItem>
                  <SelectItem value="followers">Followers only</SelectItem>
                  <SelectItem value="mutual">Mutual followers only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex gap-4">
          <Button 
            type="submit" 
            className="flex-1 bg-lime-400 text-black hover:bg-lime-500"
            disabled={!isFormValid}
          >
            {formData.isFree ? 'List for Free' : 'List for Rent'}
          </Button>
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}